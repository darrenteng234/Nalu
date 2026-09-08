/**
 * GET /studio/verify — Phase 4 regression suite (Step 15). Network-free unit
 * checks over the studio primitives incl. seeded failures the suite must catch.
 * Dev-gated. Integration paths (publish gate, MS gate, affiliate redirect, click
 * logging, duplicate slug) are proven in the browser proof + /launch/verify.
 */
import { parseArticle, stripHtml } from "@/lib/studio/parse";
import { slugify, clamp, prepareMeta, internalLinkCandidates } from "@/lib/studio/prepare";
import { analyzeArticle } from "@/lib/quality/analyze";

interface Case { name: string; pass: boolean; detail: string }

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production" && req.headers.get("x-pilot-token") !== process.env.PILOT_TOKEN) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const cases: Case[] = [];
  const t = (name: string, pass: boolean, detail = "") => cases.push({ name, pass, detail });

  // ── parse ────────────────────────────────────────────────────────────
  const a1 = parseArticle("# My Title\n\nIntro paragraph here.\n\n## Section One\nBody text.\n\n- item a\n- item b");
  t("parse.h1_title", a1.title === "My Title");
  t("parse.summary", (a1.summary ?? "").startsWith("Intro paragraph"));
  t("parse.section_heading", a1.sections.some((s) => s.heading === "Section One"));
  t("parse.bullets", a1.sections.some((s) => (s.items ?? []).includes("item a") && (s.items ?? []).includes("item b")));
  const faqA = parseArticle("# T\n\nBody.\n\n## FAQ\nQ: Is it free?\nA: Yes, free.");
  t("parse.faq", faqA.faq.length === 1 && faqA.faq[0].q === "Is it free?" && /Yes/.test(faqA.faq[0].a));
  t("parse.xss_stripped.CAUGHT", !parseArticle("Hello <script>alert(1)</script> world").sections.some((s) => /script|alert\(1\)/.test(s.body ?? "")), "seeded: pasted <script>");
  t("parse.html_stripped", !/[<>]/.test(stripHtml("<b>bold</b> <a href=x>link</a>")));

  // ── slug / clamp / prepare ───────────────────────────────────────────
  t("slug.basic", slugify("Best AI Tools for Work!") === "best-ai-tools-for-work");
  t("slug.diacritics", slugify("Café résumé") === "cafe-resume");
  t("slug.empty_fallback", slugify("!!!") === "article", "seeded: no slug chars");
  t("clamp.wordboundary", clamp("one two three four five", 12).length <= 12 && !clamp("one two three four five", 12).endsWith(" "));
  const meta = prepareMeta("A Great AI Title", parseArticle("Intro body with detail that is reasonably long enough to matter."), { now: "2026-01-01T00:00:00.000Z" });
  t("prepare.slug", meta.slug === "a-great-ai-title");
  t("prepare.seoTitle", meta.seoTitle.length <= 60 && meta.seoTitle.length > 0);
  t("prepare.meta_desc", meta.seoDescription.length > 0 && meta.seoDescription.length <= 155);
  t("prepare.dates", meta.datePublished === "2026-01-01T00:00:00.000Z");

  // ── internal links ───────────────────────────────────────────────────
  const cand = internalLinkCandidates("Best AI writing assistants", "review of writing tools", [
    { contentId: "c1", title: "AI writing tools compared", slug: "s1", type: "compare_tools" },
    { contentId: "c2", title: "Cooking recipes", slug: "s2", type: "article" },
  ]);
  t("links.overlap", cand.length === 1 && cand[0].contentId === "c1", "cooking is not related");

  // ── quality gate ─────────────────────────────────────────────────────
  const good = analyzeArticle({ title: "Best AI writing tools for Malaysian SMEs", parsed: parseArticle("A clear intro that answers the question directly for readers.\n\n## Why it matters\nBecause small teams save time. Here is a detailed explanation with enough words to not be thin content at all, covering several practical points that a reader would find genuinely useful in practice."), seoTitle: "Best AI writing tools", seoDescription: "A practical guide.", slug: "best-ai-writing-tools" });
  t("quality.clean_publishable", good.publishable && good.counts.block === 0);

  t("quality.missing_title.BLOCK", analyzeArticle({ title: "", parsed: parseArticle("some body text here that is long enough to pass the thin gate easily with many words words words words words words words"), slug: "x" }).counts.block > 0, "seeded: no title");
  t("quality.thin.BLOCK", !analyzeArticle({ title: "Hi", parsed: parseArticle("too short"), slug: "hi" }).publishable, "seeded: thin content");
  t("quality.junk.BLOCK", analyzeArticle({ title: "T", parsed: parseArticle("As an AI language model, here is your article about stuff and things and more padding to exceed the word count minimum so only the junk check fires here."), slug: "t" }).findings.some((f) => f.check === "generated_junk"), "seeded: AI boilerplate");
  t("quality.slug_missing.BLOCK", analyzeArticle({ title: "T", parsed: parseArticle("long enough body content with plenty of words to avoid the thin gate so slug is the only blocker in this particular test case here now"), slug: "" }).findings.some((f) => f.check === "slug_missing"), "seeded: no slug");
  t("quality.overclaim.WARN", analyzeArticle({ title: "T", parsed: parseArticle("This tool is guaranteed to make you instantly rich with zero effort and it never fails ever in any situation whatsoever for anyone at all."), slug: "t" }).findings.some((f) => f.check === "unsupported_claim"), "seeded: overclaim");
  t("quality.unsourced_stats.WARN", analyzeArticle({ title: "T", parsed: parseArticle("Studies show 87% of teams improved and 12000 users agreed in 2026 according to research done somewhere but no link is provided at all here."), slug: "t" }).findings.some((f) => f.check === "unsourced_stats"), "seeded: stats no source");

  // commercial states
  t("commercial.opportunity", analyzeArticle({ title: "Best AI tool", parsed: parseArticle("body body body body body body body body body body body body body body body body"), slug: "b", recommendedTools: [{ toolSlug: "jasper" }] }).commercialState === "COMMERCIAL_OPPORTUNITY");
  t("commercial.review_required.CAUGHT", analyzeArticle({ title: "Best AI writing tool comparison", parsed: parseArticle("Which tool should you pick? Here we compare pricing and the best AI tool alternatives for your team in detail across many words."), slug: "b" }).commercialState === "REVIEW_REQUIRED", "seeded: commercial signal, no rec");
  t("commercial.informational", analyzeArticle({ title: "How photosynthesis works", parsed: parseArticle("Plants convert light into energy through a process with several steps that we explain clearly here for students and curious readers alike."), slug: "b" }).commercialState === "NO_COMMERCIAL_OPPORTUNITY");

  const passed = cases.filter((c) => c.pass).length;
  const failed = cases.filter((c) => !c.pass);
  return Response.json({ ranAt: new Date().toISOString(), total: cases.length, passed, failed: failed.length, failing: failed, cases }, { status: failed.length ? 422 : 200 });
}
