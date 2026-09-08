/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs (typed where it helps) */
"use server";
/**
 * Studio server actions (Phase 4). The founder-facing authoring workflow, wrapping
 * the EXISTING Source+Variant model and the Phase-3 publish gates. No UI action
 * bypasses the backend gate: MS publication still goes approved→published through
 * the Variants hook / assertPublishable / canApprove. Auth reuses Payload login.
 */
import { headers as nextHeaders } from "next/headers";
import { payloadClient } from "@/lib/content/payload";
import { parseArticle } from "./parse";
import { prepareMeta } from "./prepare";
import { analyzeArticle } from "@/lib/quality/analyze";
import { generateMsVariant } from "@/lib/launch/translate-article";
import { approveVariant, publishVariant } from "@/lib/launch/transitions";
import { STUDIO_TYPES, type CreateInput } from "./constants";

export async function requireUser() {
  const p = await payloadClient();
  const h = await nextHeaders();
  const { user } = await p.auth({ headers: h });
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

const newContentId = () => `art_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

function variantToParsed(v: any) {
  return { title: v.title, summary: v.summary ?? undefined, sections: v.sections ?? [], faq: v.faq ?? [] };
}

/** Create a new article: Source + one Variant (draft). Founder never sees contentId. */
export async function createArticleDraft(input: CreateInput): Promise<{ contentId: string; locale: string }> {
  await requireUser();
  const p = await payloadClient();
  const locale = (input.locale || "en").trim();
  const type = STUDIO_TYPES[input.studioType || "article"] ?? "article";
  const parsed = parseArticle(input.content);
  const title = (input.title || parsed.title || "").trim();
  if (!title) throw new Error("A title is required.");
  const meta = prepareMeta(title, parsed);
  const contentId = newContentId();

  await p.create({ collection: "sources", data: {
    contentId, type, sourceVersion: 1, fieldHashes: { en: meta.slug },
    ingestStatus: "structured", datePublished: meta.datePublished, dateModified: meta.dateModified,
    neutralData: { heroImageUrl: input.heroImageUrl || null, heroImageAlt: meta.altSuggestion, author: input.author || null, tags: (input.tags || "").split(",").map((t) => t.trim()).filter(Boolean), category: input.category || null },
  } as any, depth: 0 });

  await p.create({ collection: "variants", data: {
    contentId, locale, type, status: "draft",
    title, slug: meta.slug, summary: parsed.summary,
    sections: parsed.sections, faq: parsed.faq,
    seo: { title: meta.seoTitle, description: meta.seoDescription, noindex: false },
  } as any, depth: 0 });

  return { contentId, locale };
}

/** Re-parse + save edited content (stays draft/current status). */
export async function saveArticle(contentId: string, locale: string, input: Partial<CreateInput>): Promise<void> {
  await requireUser();
  const p = await payloadClient();
  const vr = await p.find({ collection: "variants", where: { and: [{ contentId: { equals: contentId } }, { locale: { equals: locale } }] }, limit: 1, depth: 0 });
  const v: any = vr.docs[0];
  if (!v) throw new Error("Article not found.");
  const parsed = input.content != null ? parseArticle(input.content) : variantToParsed(v);
  const title = (input.title ?? v.title ?? parsed.title ?? "").trim();
  if (!title) throw new Error("A title is required.");
  const meta = prepareMeta(title, parsed);
  await p.update({ collection: "variants", id: v.id, depth: 0, data: {
    title, summary: parsed.summary, sections: parsed.sections, faq: parsed.faq,
    seo: { ...(v.seo ?? {}), title: v.seo?.title || meta.seoTitle, description: v.seo?.description || meta.seoDescription },
  } as any });
}

/** Attach disclosed tool recommendations to a variant (Phase 4 §6). */
export async function attachTools(contentId: string, locale: string, tools: Array<{ toolSlug: string; why?: string; cta?: string }>): Promise<void> {
  await requireUser();
  const p = await payloadClient();
  const vr = await p.find({ collection: "variants", where: { and: [{ contentId: { equals: contentId } }, { locale: { equals: locale } }] }, limit: 1, depth: 0 });
  const v: any = vr.docs[0];
  if (!v) throw new Error("Article not found.");
  const clean = tools.filter((t) => t.toolSlug).map((t) => ({ toolSlug: t.toolSlug, why: t.why || "", cta: t.cta || "Try it" }));
  await p.update({ collection: "variants", id: v.id, depth: 0, data: { commerce: { recommendedTools: clean } } as any });
}

/** Run the quality gate against the stored variant (advisory + block decision). */
export async function checkArticle(contentId: string, locale: string) {
  await requireUser();
  const p = await payloadClient();
  const vr = await p.find({ collection: "variants", where: { and: [{ contentId: { equals: contentId } }, { locale: { equals: locale } }] }, limit: 1, depth: 0 });
  const v: any = vr.docs[0];
  if (!v) throw new Error("Article not found.");
  return analyzeArticle({ title: v.title, parsed: variantToParsed(v), seoTitle: v.seo?.title, seoDescription: v.seo?.description, slug: v.slug, noindex: v.seo?.noindex, recommendedTools: v.commerce?.recommendedTools });
}

/**
 * Publish. EN (source of truth) publishes directly after the quality gate. A
 * directly-authored non-EN variant is human-written, so the founder acts as its
 * reviewer: approve→publish through the SAME gate (never a raw status write).
 * Machine-translated MS must be reviewed first (its status is mt_generated and
 * approveVariant/canApprove will refuse until in_review). Idempotent.
 */
export async function publishArticle(contentId: string, locale: string): Promise<{ status: string }> {
  await requireUser();
  const p = await payloadClient();
  const vr = await p.find({ collection: "variants", where: { and: [{ contentId: { equals: contentId } }, { locale: { equals: locale } }] }, limit: 1, depth: 0 });
  const v: any = vr.docs[0];
  if (!v) throw new Error("Article not found.");
  if (v.status === "published") return { status: "published" }; // idempotent — no double publish

  const gate = analyzeArticle({ title: v.title, parsed: variantToParsed(v), seoTitle: v.seo?.title, seoDescription: v.seo?.description, slug: v.slug, noindex: v.seo?.noindex, recommendedTools: v.commerce?.recommendedTools });
  if (!gate.publishable) throw new Error(`Cannot publish: ${gate.counts.block} blocking issue(s) must be fixed first.`);

  if (locale === "en") {
    await p.update({ collection: "variants", id: v.id, depth: 0, data: { status: "published", publishedAt: new Date().toISOString() } as any });
    return { status: "published" };
  }
  // non-EN directly authored: founder-reviewed human content → approve then publish (gate-enforced).
  if (v.status === "mt_generated") throw new Error("This Malay version was machine-translated and must be reviewed (approved) before publishing.");
  await approveVariant(v.id, undefined, "Authored + approved by founder in Studio");
  await publishVariant(v.id); // Variants hook enforces approved + not-stale
  return { status: "published" };
}

/** Generate the Malay version via the existing Gemini pipeline (Phase 3). Never publishes. */
export async function translateToMs(contentId: string) {
  await requireUser();
  const gen = await generateMsVariant(contentId, "ms");
  return { status: gen.status, p0: gen.gate.p0, p1: gen.gate.p1, p2: gen.gate.p2 };
}

/** Founder approves a reviewed MS variant and publishes it (Malay-first). */
export async function approvePublishMs(contentId: string, reviewer = "founder", notes = "Reviewed + approved in Studio"): Promise<{ status: string }> {
  await requireUser();
  const p = await payloadClient();
  const vr = await p.find({ collection: "variants", where: { and: [{ contentId: { equals: contentId } }, { locale: { equals: "ms" } }] }, limit: 1, depth: 0 });
  const v: any = vr.docs[0];
  if (!v) throw new Error("Malay version not found.");
  await approveVariant(v.id, undefined, `${notes} (${reviewer})`);
  await publishVariant(v.id);
  return { status: "published" };
}
