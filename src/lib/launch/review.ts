/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs partly typed via generated types; kept loose for JSON fields */
/**
 * Native-review support (Phase 3 AC14). Produces the EXACT package a native
 * Malaysian-Malay reviewer must read (EN↔MS side-by-side per field + live QA
 * findings + a decision checklist), and records their decision through the
 * EXISTING approval gate — never bypassing QA, never self-approving.
 *
 * `buildReviewPackage` is read-only. `recordReview` routes an APPROVE through
 * `approveVariant` (which enforces `canApprove`: only a QA-passed in_review
 * variant is approvable) and a REJECT through `unpublishVariant`/hold, writing an
 * auditable `activity-log` entry either way. No path here can publish.
 */
import { payloadClient } from "@/lib/content/payload";
import { getTranslator, policyFor, type Field, type TranslateResult } from "@/lib/translate/translator";
import { runLaunchGate } from "./gate";
import { approveVariant } from "./transitions";
import type { LocaleCode } from "@/lib/i18n/locales";

export interface ReviewField { key: string; policy: string; en: string; ms: string; identical: boolean }
export interface ReviewPackage {
  contentId: string; locale: LocaleCode; status: string; slug: string;
  translatedFromSourceVersion?: number; sourceVersion: number; stale: boolean;
  qa: { p0: number; p1: number; p2: number; verdict: string; issues: any[] };
  fields: ReviewField[];
  checklist: string[];
  reviewable: boolean;   // true only if currently in_review (QA-passed, awaiting human)
  instructions: string;
}

const flatten = (v: any): Record<string, string> => {
  const out: Record<string, string> = {};
  const put = (k: string, t?: string | null) => { if (t != null && String(t).trim()) out[k] = String(t); };
  put("title", v.title); put("summary", v.summary);
  put("seoTitle", v.seo?.title); put("seoDescription", v.seo?.description);
  (Array.isArray(v.sections) ? v.sections : []).forEach((s: any, i: number) => { put(`sec${i}_heading`, s.heading); put(`sec${i}_body`, s.body); (s.items ?? []).forEach((it: string, j: number) => put(`sec${i}_item${j}`, it)); });
  (Array.isArray(v.faq) ? v.faq : []).forEach((f: any, i: number) => { put(`faq_q${i}`, f.q); put(`faq_a${i}`, f.a); });
  return out;
};

export async function buildReviewPackage(contentId: string, locale: LocaleCode = "ms"): Promise<ReviewPackage> {
  const p = await payloadClient();
  const [enR, msR, srcR] = await Promise.all([
    p.find({ collection: "variants", where: { and: [{ contentId: { equals: contentId } }, { locale: { equals: "en" } }] }, limit: 1, depth: 0 }),
    p.find({ collection: "variants", where: { and: [{ contentId: { equals: contentId } }, { locale: { equals: locale } }] }, limit: 1, depth: 0 }),
    p.find({ collection: "sources", where: { contentId: { equals: contentId } }, limit: 1, depth: 0 }),
  ]);
  const en: any = enR.docs[0]; const ms: any = msR.docs[0]; const src: any = srcR.docs[0];
  if (!en) throw new Error(`no EN variant for ${contentId}`);
  if (!ms) throw new Error(`no ${locale} variant for ${contentId} — generate it first`);

  const enFlat = flatten(en); const msFlat = flatten(ms);
  const fields: ReviewField[] = Object.keys(enFlat).map((k) => ({ key: k, policy: policyFor(k), en: enFlat[k], ms: msFlat[k] ?? "", identical: (msFlat[k] ?? "") === enFlat[k] }));

  // live QA recompute so the reviewer sees current findings (not a stale snapshot)
  const result: TranslateResult = { contentId, targetLocale: locale, provider: "stored", model: "-", timestamp: "", fields: fields.map((f) => ({ key: f.key, text: f.ms, policy: f.policy as Field["policy"] })) };
  const gate = await runLaunchGate(enFlat, result, locale);

  return {
    contentId, locale, status: ms.status, slug: ms.slug,
    translatedFromSourceVersion: ms.translation?.translatedFromSourceVersion,
    sourceVersion: src?.sourceVersion ?? 1,
    stale: ms.translation?.stale === true,
    qa: { p0: gate.p0, p1: gate.p1, p2: gate.p2, verdict: gate.verdict, issues: gate.issues },
    fields,
    checklist: [
      "Is the Malay natural, idiomatic Bahasa Melayu (Malaysia) — NOT Indonesian?",
      "Is meaning preserved (no omission, addition, or changed claim strength)?",
      "Are all numbers, dates, product names (ChatGPT, etc.) and URLs correct?",
      "Is terminology consistent (e.g. prompt→gesaan) across the whole article?",
      "Are the title and SEO description accurate and not machine-stilted?",
      "Any factual or tone problem that must block publication?",
    ],
    reviewable: ms.status === "in_review" && gate.p0 === 0 && ms.translation?.stale !== true,
    instructions:
      "Read every EN↔MS field pair. This MS variant is NOT public. Only after a native reviewer approves does it become publishable, and only via approved→published. Record the decision with recordReview (approve requires status=in_review and zero P0). Do not approve on 'looks reasonable' — verify each checklist item.",
  };
}

export interface ReviewDecision { decision: "approve" | "reject"; reviewer: string; notes: string }

/** Record a HUMAN reviewer's decision. Approve goes through the QA-enforcing gate. */
export async function recordReview(contentId: string, locale: LocaleCode, d: ReviewDecision) {
  if (!d.reviewer || !d.reviewer.trim()) throw new Error("reviewer identity is required (auditability)");
  if (!d.notes || !d.notes.trim()) throw new Error("review notes are required (auditability)");
  const p = await payloadClient();
  const msR = await p.find({ collection: "variants", where: { and: [{ contentId: { equals: contentId } }, { locale: { equals: locale } }] }, limit: 1, depth: 0 });
  const ms: any = msR.docs[0];
  if (!ms) throw new Error(`no ${locale} variant for ${contentId}`);

  if (d.decision === "approve") {
    // approveVariant enforces canApprove (in_review only) — QA is never bypassed here.
    const updated = await approveVariant(ms.id, d.reviewer, d.notes);
    return { recorded: "approved", status: (updated as any).status, reviewer: d.reviewer };
  }
  // reject: hold out of publication, record reviewer + notes, audit as review_required.
  await p.update({ collection: "variants", id: ms.id, depth: 0, data: { status: ms.status === "published" ? "in_review" : "mt_generated", translation: { ...(ms.translation ?? {}), reviewer: null, reviewNotes: `REJECTED by ${d.reviewer}: ${d.notes}` } } as any });
  await p.create({ collection: "activity-log", data: { actor: `editor:${d.reviewer}`, action: "review.reject", entity: contentId, locale, detail: d.notes.slice(0, 200), outcome: "review_required" } as any, depth: 0 }).catch(() => {});
  return { recorded: "rejected", status: ms.status === "published" ? "in_review" : "mt_generated", reviewer: d.reviewer };
}
