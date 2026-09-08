/**
 * Smart content preparation (Phase 4 §3). Derives the technical fields the
 * founder should never have to think about — deterministically, without
 * inventing facts. Slug, SEO title, meta description, dates, alt-text
 * suggestion, key-takeaway + internal-link candidates. LLM enrichment is NOT in
 * this critical path (kept deterministic + testable); it can be layered later as
 * optional suggestions. Canonical / hreflang / OG / breadcrumbs are already
 * produced by the render layer (metadata.ts / jsonld.ts) — not duplicated here.
 */
import type { ParsedArticle } from "./parse";

export function slugify(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD").replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "article";
}

/** Truncate on a word boundary to <= max chars. */
export function clamp(s: string, max: number): string {
  const t = (s || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).trim();
}

export interface PreparedMeta {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  keyTakeaway?: string;
  altSuggestion: string;
  datePublished: string;
  dateModified: string;
}

export function prepareMeta(title: string, parsed: ParsedArticle, opts: { now?: string } = {}): PreparedMeta {
  const now = opts.now ?? new Date().toISOString();
  const firstBody = parsed.summary || parsed.sections.find((s) => s.body)?.body || "";
  return {
    slug: slugify(title),
    seoTitle: clamp(title, 60),
    seoDescription: clamp(firstBody || title, 155),
    // key takeaway is a suggestion drawn from the article's own first paragraph — not invented
    keyTakeaway: firstBody ? clamp(firstBody, 220) : undefined,
    altSuggestion: clamp(title, 100),
    datePublished: now,
    dateModified: now,
  };
}

/** Internal-link candidates: published entities whose title shares a significant word with this one. */
export interface LinkCandidate { contentId: string; title: string; slug: string; type: string; score: number }
const STOP = new Set(["the","and","for","with","your","you","how","what","best","2024","2025","2026","ai","to","of","in","a","an","is","on"]);
export function internalLinkCandidates(title: string, body: string, pool: Array<{ contentId: string; title: string; slug: string; type: string }>): LinkCandidate[] {
  const words = new Set(`${title} ${body}`.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOP.has(w)));
  const out: LinkCandidate[] = [];
  for (const p of pool) {
    const pw = p.title.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOP.has(w));
    const overlap = pw.filter((w) => words.has(w)).length;
    if (overlap > 0) out.push({ ...p, score: overlap });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 5);
}
