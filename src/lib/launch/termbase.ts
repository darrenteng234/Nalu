/**
 * Minimum termbase / translation memory (Phase 3 §10, AC16). Cross-article and
 * cross-chunk terminology consistency: a small map of preferred Malaysian-Malay
 * renderings applied at PROMPT time (a steer to the provider) and ASSERTED after
 * (QA). Not a full TM yet — a deliberate minimum that makes consistency real and
 * testable. Terms that must NOT change at all belong in translator PROTECTED_NAMES.
 */
import type { LocaleCode } from "@/lib/i18n/locales";

/** Preferred target-term map per locale. Left = English term, right = required target. */
export const TERMBASE: Partial<Record<LocaleCode, Record<string, string>>> = {
  ms: {
    // domain vocabulary — keep consistent across every article + chunk
    "prompt": "gesaan",
    "prompts": "gesaan",
    "workflow": "aliran kerja",
    "tutorial": "tutorial",
    "beginner": "pemula",
    "step-by-step": "langkah demi langkah",
    "free": "percuma", // guards against Indonesian "gratis"
    "download": "muat turun", // guards against Indonesian "unduh"
  },
};

/** Build a prompt hint listing preferred terms for the given locale (empty if none). */
export function termHint(locale: LocaleCode): string {
  const map = TERMBASE[locale];
  if (!map) return "";
  const pairs = Object.entries(map).map(([en, tgt]) => `"${en}"→"${tgt}"`);
  return ` Use these preferred terms consistently: ${pairs.join("; ")}.`;
}

export interface TermIssue { term: string; expected: string; detail: string }

/**
 * Assert termbase consistency: if the ENGLISH source contains a mapped term, the
 * target should contain the preferred rendering. Heuristic (word-boundary,
 * case-insensitive) — a P2 consistency signal, deduped by expected term.
 */
export function assertTerms(source: string, target: string, locale: LocaleCode): TermIssue[] {
  const map = TERMBASE[locale];
  if (!map) return [];
  const issues: TermIssue[] = [];
  const seen = new Set<string>();
  for (const [en, tgt] of Object.entries(map)) {
    if (seen.has(tgt)) continue;
    const inSrc = new RegExp(`\\b${en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(source);
    if (!inSrc) continue;
    const inTgt = new RegExp(tgt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(target);
    if (!inTgt) { issues.push({ term: en, expected: tgt, detail: `source has "${en}" but target missing preferred "${tgt}"` }); seen.add(tgt); }
  }
  return issues;
}
