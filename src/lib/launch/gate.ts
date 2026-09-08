/**
 * Launch QA gate (Phase 3 §6). Runs the ordered gate over a freshly translated
 * variant BEFORE it may leave `mt_generated`:
 *   1. deterministic validation (required fields, placeholder/token integrity)
 *   2. structural QA (translation-qa: leakage, contamination, script)
 *   3. semantic QA (number integrity + optional LLM judge)
 *   4. SEO validation (title/description present + length)
 *   + termbase consistency (§10)
 * Rendered QA (canonical/hreflang/JSON-LD) is proven separately at the page
 * level (§13) because it needs the DB + renderer; the gate covers field-level
 * correctness. Verdict: any P0 → BLOCK (stay mt_generated). Else → in_review.
 */
import type { TranslateResult } from "@/lib/translate/translator";
import type { LocaleCode } from "@/lib/i18n/locales";
import { translationQa, type TQAIssue } from "@/lib/translate/translation-qa";
import { semanticQa, type SemIssue, type JudgeFn } from "@/lib/translate/semantic-qa";
import { assertTerms } from "./termbase";

export interface GateIssue { severity: "P0" | "P1" | "P2"; layer: string; check: string; field?: string; detail: string }
export interface GateResult {
  issues: GateIssue[];
  p0: number; p1: number; p2: number;
  verdict: "block" | "review";
  nextStatus: "mt_generated" | "in_review";
}

function seoIssues(result: TranslateResult): GateIssue[] {
  const out: GateIssue[] = [];
  const seoTitle = result.fields.find((f) => f.key === "seoTitle" || f.key === "seo_title")?.text;
  const seoDesc = result.fields.find((f) => f.key === "seoDescription" || f.key === "seo_description")?.text;
  const title = seoTitle ?? result.fields.find((f) => f.key === "title")?.text;
  if (!title || !title.trim()) out.push({ severity: "P1", layer: "seo", check: "seo_title_missing", detail: "no seo/title for MS variant" });
  else if (title.length > 70) out.push({ severity: "P2", layer: "seo", check: "seo_title_long", detail: `seo title ${title.length} chars` });
  if (seoDesc && seoDesc.length > 180) out.push({ severity: "P2", layer: "seo", check: "seo_desc_long", detail: `seo description ${seoDesc.length} chars` });
  return out;
}

/** Concatenate translatable field text for whole-document semantic checks. */
function joinText(fields: { policy: string; text: string }[]): string {
  return fields.filter((f) => f.policy === "translate" || f.policy === "localize").map((f) => f.text).join("\n");
}

export async function runLaunchGate(
  source: Record<string, string>,
  result: TranslateResult,
  locale: LocaleCode,
  judge?: JudgeFn,
): Promise<GateResult> {
  const issues: GateIssue[] = [];

  // 1+2. deterministic + structural (translation-qa covers empty/placeholder/token/leak/contamination)
  const tqa: TQAIssue[] = translationQa(source, result);
  for (const i of tqa) issues.push({ severity: i.severity, layer: "structural", check: i.check, field: i.field, detail: i.detail });

  // stray placeholder leak (§9) — no §N§ may survive into published text
  for (const f of result.fields) {
    if (/§\d+§/.test(f.text)) issues.push({ severity: "P0", layer: "deterministic", check: "placeholder_leak", field: f.key, detail: "unrestored §N§ token in output" });
  }

  // 3. semantic — number integrity (deterministic) + optional judge, over whole doc
  const srcJoined = Object.values(source).join("\n");
  const tgtJoined = joinText(result.fields);
  const sem: SemIssue[] = await semanticQa(srcJoined, tgtJoined, locale, judge);
  for (const i of sem) issues.push({ severity: i.severity, layer: "semantic", check: i.check, detail: i.detail });

  // 4. seo
  issues.push(...seoIssues(result));

  // termbase consistency (§10) — P2 signal
  for (const t of assertTerms(srcJoined, tgtJoined, locale)) issues.push({ severity: "P2", layer: "termbase", check: "term_inconsistent", detail: t.detail });

  const p0 = issues.filter((i) => i.severity === "P0").length;
  const p1 = issues.filter((i) => i.severity === "P1").length;
  const p2 = issues.filter((i) => i.severity === "P2").length;
  const verdict = p0 > 0 ? "block" : "review";
  return { issues, p0, p1, p2, verdict, nextStatus: verdict === "block" ? "mt_generated" : "in_review" };
}
