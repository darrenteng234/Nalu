/**
 * Article quality gate (Phase 4 §4). Advisory checks surfaced to the founder in
 * plain language before Publish. Categories: STRUCTURE, CONTENT, SEO, AI_ANSWER,
 * COMMERCIAL. NO fake "GEO score" — AI-answer readiness is a set of concrete,
 * honest checks (direct answer present, clear structure, evidence for claims).
 * Severity: `block` (Publish must not proceed), `warn`, `info`.
 * Does NOT force FAQs/headings for SEO and never keyword-stuffs.
 */
import type { ParsedArticle } from "@/lib/studio/parse";

export type Severity = "block" | "warn" | "info";
export type Category = "STRUCTURE" | "CONTENT" | "SEO" | "AI_ANSWER" | "COMMERCIAL";
export interface Finding { category: Category; severity: Severity; check: string; detail: string }
export type CommercialState = "COMMERCIAL_OPPORTUNITY" | "NO_COMMERCIAL_OPPORTUNITY" | "REVIEW_REQUIRED";

export interface QualityInput {
  title: string;
  parsed: ParsedArticle;
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
  noindex?: boolean;
  recommendedTools?: Array<{ toolSlug: string; why?: string; cta?: string }>;
  bodyText?: string; // full concatenated text for heuristics
}
export interface QualityReport {
  findings: Finding[];
  commercialState: CommercialState;
  counts: { block: number; warn: number; info: number };
  publishable: boolean; // false if any block
}

const JUNK = [/as an ai (language )?model/i, /i (?:cannot|can't) (?:help|assist)/i, /i'?m sorry/i, /lorem ipsum/i, /here is (?:the|your) (?:article|rewrite)/i, /\bTODO\b/, /\[insert .+?\]/i];
const OVERCLAIM = /\b(guaranteed|100% (?:free|safe|accurate)|the best ever|never fails|instantly rich|risk-free)\b/i;
const COMMERCIAL_SIGNAL = /\b(pricing|price|subscription|free plan|best .* tool|vs\.?|alternative to|top \d+ .* tools?|which .* tool)\b/i;

function bodyOf(input: QualityInput): string {
  if (input.bodyText) return input.bodyText;
  const secs = input.parsed.sections.map((s) => [s.heading, s.body, ...(s.items ?? [])].filter(Boolean).join(" ")).join("\n");
  const faq = input.parsed.faq.map((f) => `${f.q} ${f.a}`).join("\n");
  return [input.title, input.parsed.summary, secs, faq].filter(Boolean).join("\n");
}

export function analyzeArticle(input: QualityInput): QualityReport {
  const f: Finding[] = [];
  const add = (category: Category, severity: Severity, check: string, detail: string) => f.push({ category, severity, check, detail });
  const body = bodyOf(input);
  const wordCount = body.split(/\s+/).filter(Boolean).length;
  const sections = input.parsed.sections;

  // ── STRUCTURE ────────────────────────────────────────────────
  if (!input.title || !input.title.trim()) add("STRUCTURE", "block", "h1_missing", "The article has no title (one clear H1 is required).");
  else if (input.title.length > 120) add("STRUCTURE", "warn", "h1_long", "The title is very long; consider tightening it.");
  const headed = sections.filter((s) => s.heading).length;
  if (wordCount > 300 && headed === 0) add("STRUCTURE", "warn", "no_subheadings", "A longer article reads better with a few section headings.");
  const longParas = sections.filter((s) => (s.body ?? "").length > 700).length;
  if (longParas) add("STRUCTURE", "info", "long_paragraphs", `${longParas} paragraph(s) are very long — consider splitting for readability.`);
  const dupHeads = new Set<string>(); for (const s of sections) { const h = (s.heading ?? "").trim().toLowerCase(); if (h && dupHeads.has(h)) add("STRUCTURE", "warn", "duplicate_heading", `Repeated heading "${s.heading}".`); else if (h) dupHeads.add(h); }

  // ── CONTENT ──────────────────────────────────────────────────
  if (wordCount < 60) add("CONTENT", "block", "too_thin", "The article is very short — likely too thin to be useful or to rank.");
  for (const rx of JUNK) if (rx.test(body)) { add("CONTENT", "block", "generated_junk", `Detected leftover/placeholder text (${rx.source.slice(0, 30)}…). Remove it before publishing.`); break; }
  if (OVERCLAIM.test(body)) add("CONTENT", "warn", "unsupported_claim", "Contains an absolute/overclaiming phrase; make sure it is supported.");
  // duplicate section bodies
  const seenBodies = new Set<string>(); for (const s of sections) { const b = (s.body ?? "").trim(); if (b.length > 80) { if (seenBodies.has(b)) add("CONTENT", "warn", "duplicate_section", "Two sections contain identical text."); else seenBodies.add(b); } }
  // claims (numbers/percent/stats) without any link → suggest sourcing
  const hasStats = /\b\d+(?:\.\d+)?%|\b\d{4}\b|\b\d[\d,]{2,}\b/.test(body);
  const hasLink = /https?:\/\//.test(body);
  if (hasStats && !hasLink) add("CONTENT", "warn", "unsourced_stats", "Contains figures/dates but no source links — add attribution where claims are made.");

  // ── SEO ──────────────────────────────────────────────────────
  if (!input.seoTitle) add("SEO", "warn", "seo_title_missing", "No SEO title yet (auto-prepared from the title on save).");
  else if (input.seoTitle.length > 60) add("SEO", "info", "seo_title_long", `SEO title is ${input.seoTitle.length} chars (aim ≤ 60).`);
  if (!input.slug) add("SEO", "block", "slug_missing", "No URL slug — cannot publish without one.");
  if (!input.seoDescription) add("SEO", "warn", "meta_missing", "No meta description yet (auto-prepared on save).");
  else if (input.seoDescription.length > 160) add("SEO", "info", "meta_long", `Meta description is ${input.seoDescription.length} chars (aim ≤ 160).`);
  if (input.noindex) add("SEO", "info", "noindex", "This page is set to NOT be indexed by search engines.");
  // structured-data consistency: FAQ schema only when a real FAQ exists (handled by renderer; flag mismatch intent)
  if (input.parsed.faq.length === 0) add("SEO", "info", "no_faq", "No FAQ — that's fine; FAQ is only added when genuinely useful.");

  // ── AI_ANSWER (honest checks, not a fake score) ──────────────
  if (!input.parsed.summary) add("AI_ANSWER", "warn", "no_direct_answer", "No opening summary/direct answer — AI answers and readers prefer a clear lead.");
  if (/\?$/.test(input.title.trim()) && wordCount < 120) add("AI_ANSWER", "warn", "question_unanswered", "The title asks a question but the article is short — make sure it clearly answers it.");
  if (headed === 0 && wordCount > 300) add("AI_ANSWER", "info", "structure_for_extraction", "Clear section headings help AI answers extract and cite your content.");

  // ── COMMERCIAL ───────────────────────────────────────────────
  const hasRec = (input.recommendedTools?.length ?? 0) > 0;
  const looksCommercial = COMMERCIAL_SIGNAL.test(body);
  let commercialState: CommercialState;
  if (hasRec) { commercialState = "COMMERCIAL_OPPORTUNITY"; add("COMMERCIAL", "info", "has_recommendation", `${input.recommendedTools!.length} tool recommendation(s) attached (disclosed).`); }
  else if (looksCommercial) { commercialState = "REVIEW_REQUIRED"; add("COMMERCIAL", "warn", "commercial_but_no_rec", "This reads like commercial content but has no tool recommendation — attach one if genuinely relevant (don't force it)."); }
  else { commercialState = "NO_COMMERCIAL_OPPORTUNITY"; add("COMMERCIAL", "info", "informational", "No obvious commercial opportunity — that's fine; do not force affiliate links."); }

  const counts = { block: f.filter((x) => x.severity === "block").length, warn: f.filter((x) => x.severity === "warn").length, info: f.filter((x) => x.severity === "info").length };
  return { findings: f, commercialState, counts, publishable: counts.block === 0 };
}
