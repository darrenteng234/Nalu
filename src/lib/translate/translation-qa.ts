/**
 * Field-semantic translation QA (Phase 2.6 §14/§15). Understands field roles:
 * a proper-noun title may equal English; a body should normally differ. Detects
 * leakage, protected-token corruption, locale contamination, script/diacritic
 * problems, placeholder/format loss. Machine-readable P0/P1/P2.
 */
import type { TranslateResult } from "./translator";
import { PROTECTED_NAMES } from "./translator";

export interface TQAIssue { severity: "P0" | "P1" | "P2"; check: string; field?: string; detail: string }

// Malaysian-Malay must not contain these Indonesian forms (docs/specs/03 §X).
const INDONESIAN_MARKERS = ["bisa", "kalian", "gratis", "ponsel", "unduh", "coba", "dgn", "banget", "gimana", "kayak", "doang"];
const LATIN_RE = /[A-Za-z]/;

// English STOP-WORD density — a cross-script leakage signal that does NOT
// false-positive on latin-script targets (ms/vi are latin, so counting latin
// words is invalid; §24). These function words do not occur in Malay/Vietnamese/Thai.
const EN_STOPWORDS = new Set(["the","and","with","your","you","for","are","this","that","from","have","will","can","not","but","how","what","when","which","into","over","than","then","them","they","our","their","its","was","were","been","would","should","could"]);
function englishLeakRatio(text: string): number {
  const words = text.replace(/§\d+§/g, "").toLowerCase().split(/[^a-z]+/).filter(Boolean);
  if (words.length < 6) return 0;
  const stop = words.filter((w) => EN_STOPWORDS.has(w)).length;
  return stop / words.length; // high density of English function words ⇒ likely untranslated English
}

export function translationQa(source: Record<string, string>, result: TranslateResult): TQAIssue[] {
  const issues: TQAIssue[] = [];
  const loc = result.targetLocale;

  for (const f of result.fields) {
    const src = source[f.key] ?? "";
    const tgt = f.text ?? "";

    // P0: empty required
    if ((f.policy === "translate" || f.policy === "localize") && !tgt.trim()) {
      issues.push({ severity: "P0", check: "empty_field", field: f.key, detail: "translatable field is empty" });
      continue;
    }
    // P0: protected-token / name corruption — every protected name in source must survive
    for (const name of PROTECTED_NAMES) {
      const inSrc = new RegExp(`\\b${name}\\b`).test(src);
      if (inSrc && !new RegExp(`\\b${name}\\b`).test(tgt)) {
        issues.push({ severity: "P0", check: "protected_name_lost", field: f.key, detail: `protected name "${name}" missing in ${loc}` });
      }
    }
    // P0: placeholder integrity
    const srcPh = (src.match(/\{\{[^}]+\}\}|\[[A-Z0-9_]+\]/g) ?? []).length;
    const tgtPh = (tgt.match(/\{\{[^}]+\}\}|\[[A-Z0-9_]+\]/g) ?? []).length;
    if (srcPh !== tgtPh) issues.push({ severity: "P0", check: "placeholder_mismatch", field: f.key, detail: `placeholders ${srcPh}→${tgtPh}` });

    // field-semantic: body-like fields should normally differ from English
    const bodyLike = ["summary", "body", "description"].includes(f.key) || f.key.startsWith("section") || f.key.startsWith("faq_a");
    if (bodyLike && f.policy === "translate" && tgt.trim() && tgt.trim() === src.trim()) {
      issues.push({ severity: "P1", check: "untranslated_body", field: f.key, detail: "translatable body identical to English" });
    }
    // P1: English leakage — high English stop-word density (script-independent)
    if (bodyLike && englishLeakRatio(tgt) > 0.15) {
      issues.push({ severity: "P1", check: "english_leakage", field: f.key, detail: `high English stop-word density in ${loc} body` });
    }
    // P1: length sanity
    if (bodyLike && src.length > 40) { const r = tgt.length / src.length; if (r < 0.4 || r > 3) issues.push({ severity: "P2", check: "length_ratio", field: f.key, detail: `len ratio ${r.toFixed(2)}` }); }

    // locale-specific
    if (loc === "ms") {
      const hit = INDONESIAN_MARKERS.find((w) => new RegExp(`\\b${w}\\b`, "i").test(tgt));
      if (hit) issues.push({ severity: "P1", check: "ms_indonesian_contamination", field: f.key, detail: `Indonesian marker "${hit}" in Malay` });
    }
    if (loc === "th" && tgt.trim()) {
      if (!/[฀-๿]/.test(tgt)) issues.push({ severity: "P1", check: "th_no_thai_script", field: f.key, detail: "no Thai characters in Thai field" });
      // space-per-word heuristic: Thai shouldn't have many single-space-separated Thai chunks
      const thaiSpaced = (tgt.match(/[฀-๿]+\s[฀-๿]+/g) ?? []).length;
      if (thaiSpaced > 5) issues.push({ severity: "P2", check: "th_spacing", field: f.key, detail: "suspicious space-per-word Thai" });
    }
    if (loc === "vi" && tgt.trim()) {
      const diacritics = (tgt.match(/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/gi) ?? []).length;
      const letters = (tgt.match(/[A-Za-zÀ-ỹ]/g) ?? []).length;
      if (letters > 30 && diacritics / letters < 0.08) issues.push({ severity: "P1", check: "vi_low_diacritics", field: f.key, detail: "suspiciously few Vietnamese diacritics" });
    }
    void LATIN_RE;
  }
  return issues;
}
