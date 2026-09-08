/* eslint-disable @typescript-eslint/no-explicit-any -- verifier returns arbitrary untyped JSON */
/**
 * Semantic-equivalence QA (docs/specs/03 §28/§38). SEPARATE from structural QA:
 * a translation can pass structure and fail meaning. Two layers:
 *  1. Deterministic number/date integrity — script-independent, guaranteed, no API.
 *  2. LLM-judge verifier — omission/addition/contradiction/claim-strength, via a
 *     verification model call (kept separate from the translator per §38).
 * Low confidence or any P0 finding → REVIEW_REQUIRED; never auto-publish.
 */
export interface SemIssue { severity: "P0" | "P1" | "P2"; check: string; detail: string }

/** Extract comparable numeric values (ints/decimals/currency/percent), separator-agnostic. */
export function extractNumbers(s: string): string[] {
  const raw = s.match(/\d[\d.,]*/g) ?? [];
  return raw
    .map((n) => n.replace(/[.,](?=\d{3}\b)/g, "")) // drop thousands separators
    .map((n) => n.replace(/,(\d{1,2})$/, ".$1")) // eu decimal comma → dot
    .map((n) => n.replace(/\.0+$/, "")) // trailing .0
    .filter((n) => n.length > 0);
}

/** Deterministic: every source number must survive; no invented numbers. */
export function numberIntegrity(source: string, target: string): SemIssue[] {
  const src = extractNumbers(source);
  const tgt = extractNumbers(target);
  const tgtCount: Record<string, number> = {}; tgt.forEach((n) => (tgtCount[n] = (tgtCount[n] ?? 0) + 1));
  const srcCount: Record<string, number> = {}; src.forEach((n) => (srcCount[n] = (srcCount[n] ?? 0) + 1));
  const issues: SemIssue[] = [];
  for (const [n, c] of Object.entries(srcCount)) if ((tgtCount[n] ?? 0) < c) issues.push({ severity: "P0", check: "number_omitted_or_changed", detail: `source number "${n}" missing/changed in target` });
  for (const [n, c] of Object.entries(tgtCount)) if ((srcCount[n] ?? 0) < c) issues.push({ severity: "P0", check: "number_invented", detail: `target has number "${n}" absent from source` });
  return issues;
}

/** English claim-strength hedge→certainty (source-side heuristic; complements the judge). */
const HEDGE = /\b(may|might|could|can|often|sometimes|typically|usually|generally|about|approximately|around)\b/i;
export function claimStrengthSourceHasHedge(source: string): boolean { return HEDGE.test(source); }

export type JudgeFn = (system: string, user: string) => Promise<{ text: string }>;

/**
 * LLM-judge verifier. Sends EN source + target; returns structured findings.
 * Provider-agnostic via `callFn` (a Gemini/other structured call). Separate model
 * instance from the translator (§38). Any non-equivalence or low confidence → flag.
 */
export async function semanticJudge(source: string, target: string, locale: string, callFn: JudgeFn): Promise<SemIssue[]> {
  const sys = `You are a translation VERIFIER (not a translator). Compare an English SOURCE with its ${locale} TRANSLATION. Detect ONLY these problems: omitted meaning, added/invented meaning, contradiction, changed numbers/dates/units/names, changed strength of a claim (e.g. "may"→"will"), dropped warnings/conditions. Ignore style. Return ONLY JSON {"equivalent":true|false,"issues":["..."],"confidence":0..1}.`;
  const user = `SOURCE (English):\n${source}\n\nTRANSLATION (${locale}):\n${target}`;
  let parsed: any = {};
  try { parsed = JSON.parse((await callFn(sys, user)).text || "{}"); } catch { return [{ severity: "P1", check: "semantic_judge_unparseable", detail: "verifier returned non-JSON" }]; }
  const issues: SemIssue[] = [];
  if (parsed.equivalent === false) for (const i of parsed.issues ?? []) issues.push({ severity: "P0", check: "semantic_nonequivalence", detail: String(i).slice(0, 200) });
  if (typeof parsed.confidence === "number" && parsed.confidence < 0.6) issues.push({ severity: "P1", check: "semantic_low_confidence", detail: `verifier confidence ${parsed.confidence}` });
  return issues;
}

/** Combined: deterministic first (cheap, guaranteed), then optional judge. */
export async function semanticQa(source: string, target: string, locale: string, callFn?: JudgeFn): Promise<SemIssue[]> {
  const issues = numberIntegrity(source, target);
  if (callFn) issues.push(...(await semanticJudge(source, target, locale, callFn)));
  return issues;
}
