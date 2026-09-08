/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs untyped (F-A) */
/**
 * Gated MS generation for one content item (Phase 3 §2/§6). The launch path:
 *   read EN variant + source → build fields → resilient translate (real provider
 *   via getTranslator) → write MS at `mt_generated` (NEVER published) → run the
 *   QA gate → advance to `in_review` (clean) or stay `mt_generated` (P0).
 * Human review + publish are SEPARATE, explicit steps (transitions.ts). This
 * function can never make MS public.
 */
import { payloadClient } from "@/lib/content/payload";
import { getTranslator, policyFor, type Field, type TranslateResult, type Translator } from "@/lib/translate/translator";
import { withRetry } from "@/lib/translate/retry";
import { runLaunchGate, type GateResult } from "./gate";
import { getSourceVersion } from "./transitions";
import type { JudgeFn } from "@/lib/translate/semantic-qa";
import type { LocaleCode } from "@/lib/i18n/locales";

interface Section { id: string; heading?: string; body?: string; items?: string[] }
interface Faq { id: string; q: string; a: string }

/** Flatten an EN variant's translatable content into provider Field[]. */
function toFields(v: any): { fields: Field[]; sections: Section[]; faq: Faq[] } {
  const fields: Field[] = [];
  const push = (key: string, text?: string | null) => { if (text && String(text).trim()) fields.push({ key, text: String(text), policy: policyFor(key) }); };
  push("title", v.title);
  push("summary", v.summary);
  push("seoTitle", v.seo?.title ?? v.title);
  push("seoDescription", v.seo?.description ?? v.summary);
  const sections: Section[] = Array.isArray(v.sections) ? v.sections : [];
  sections.forEach((s, i) => { push(`sec${i}_heading`, s.heading); push(`sec${i}_body`, s.body); (s.items ?? []).forEach((it, j) => push(`sec${i}_item${j}`, it)); });
  const faq: Faq[] = Array.isArray(v.faq) ? v.faq : [];
  faq.forEach((f, i) => { push(`faq_q${i}`, f.q); push(`faq_a${i}`, f.a); });
  return { fields, sections, faq };
}

/** Reassemble translated fields back into the variant shape (lossless w.r.t. structure). */
function fromFields(t: TranslateResult, sections: Section[], faq: Faq[]) {
  const get = (k: string) => t.fields.find((f) => f.key === k)?.text;
  const outSections = sections.map((s, i) => ({
    id: s.id,
    heading: get(`sec${i}_heading`) ?? s.heading,
    body: get(`sec${i}_body`) ?? s.body,
    items: (s.items ?? []).map((it, j) => get(`sec${i}_item${j}`) ?? it),
  }));
  const outFaq = faq.map((f, i) => ({ id: f.id, q: get(`faq_q${i}`) ?? f.q, a: get(`faq_a${i}`) ?? f.a }));
  return {
    title: get("title") ?? "",
    summary: get("summary") ?? undefined,
    seoTitle: get("seoTitle") ?? get("title") ?? "",
    seoDescription: get("seoDescription") ?? undefined,
    sections: outSections,
    faq: outFaq,
  };
}

export interface GenerateResult {
  contentId: string; locale: LocaleCode; provider: string; model: string;
  status: "mt_generated" | "in_review"; gate: GateResult; variantId: string | number;
}

/**
 * Generate (or regenerate) the MS variant for a content item through the gate.
 * `translatorOverride` lets a proof/test inject a deterministic provider (e.g.
 * Mock) so the state machine can be exercised without spending real quota; the
 * default is the configured real provider (getTranslator → Gemini).
 */
export async function generateMsVariant(contentId: string, locale: LocaleCode = "ms", judge?: JudgeFn, translatorOverride?: Translator): Promise<GenerateResult> {
  const p = await payloadClient();
  const enRes = await p.find({ collection: "variants", where: { and: [{ contentId: { equals: contentId } }, { locale: { equals: "en" } }] }, limit: 1, depth: 0 });
  const en: any = enRes.docs[0];
  if (!en) throw new Error(`no EN variant for ${contentId} — cannot translate`);

  const { fields, sections, faq } = toFields(en);
  const source: Record<string, string> = {}; for (const f of fields) source[f.key] = f.text;

  const translator = translatorOverride ?? getTranslator();
  // resilient call (§7/AC10): in-app exponential backoff on 429/5xx/network.
  const result = await withRetry(() => translator.translate({ contentId, sourceLocale: "en", targetLocale: locale, fields }), {
    onRetry: async (attempt, waitMs, err) => {
      try { await p.create({ collection: "activity-log", data: { actor: "system", action: "translate.retry", entity: contentId, locale, detail: `attempt ${attempt}, wait ${waitMs}ms: ${String(err).slice(0, 120)}`, outcome: "failed" } as any, depth: 0 }); } catch {}
    },
  });

  const shaped = fromFields(result, sections, faq);
  const sourceVersion = await getSourceVersion(contentId);

  // write MS at mt_generated — NEVER published (§2). Upsert by (contentId, locale).
  const existing = await p.find({ collection: "variants", where: { and: [{ contentId: { equals: contentId } }, { locale: { equals: locale } }] }, limit: 1, depth: 0 });
  const prevTransVer = (existing.docs[0] as any)?.translation?.translationVersion ?? 0;
  const data = {
    contentId, locale, type: en.type,
    status: "mt_generated" as const,
    title: shaped.title, slug: en.slug, summary: shaped.summary,
    sections: shaped.sections, faq: shaped.faq,
    seo: { title: shaped.seoTitle, description: shaped.seoDescription, noindex: false },
    translation: {
      translatedFromSourceVersion: sourceVersion,
      translationVersion: prevTransVer + 1,
      localizationVersion: 1,
      stale: false,
      fieldStatus: Object.fromEntries(result.fields.map((f) => [f.key, "mt"])),
    },
  };
  const variant: any = existing.docs[0]
    ? await p.update({ collection: "variants", id: existing.docs[0].id, data: data as any, depth: 0 })
    : await p.create({ collection: "variants", data: data as any, depth: 0 });

  // QA GATE (§6)
  const gate = await runLaunchGate(source, result, locale, judge);
  const status = gate.nextStatus;
  if (status !== variant.status) await p.update({ collection: "variants", id: variant.id, data: { status } as any, depth: 0 });

  try {
    await p.create({ collection: "activity-log", data: {
      actor: "system", action: "translate.generate", entity: contentId, locale,
      detail: `${translator.provider}/${translator.model} → ${status} (P0:${gate.p0} P1:${gate.p1} P2:${gate.p2})`,
      outcome: gate.verdict === "block" ? "review_required" : "ok",
    } as any, depth: 0 });
  } catch {}

  return { contentId, locale, provider: translator.provider, model: translator.model, status, gate, variantId: variant.id };
}
