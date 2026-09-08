# PHASE 2.5 — REAL CONTENT PILOT

**Date:** 2026-09-07. **Goal:** determine whether the NALU system can process **real, messy, public** Techpresso content from discovery → English master → (multilingual) publication without page-by-page manual QC.
**Boundary:** public/free content only; gated content refused programmatically; no verbatim source bodies are reproduced in this report (structure/coverage/results only). Brand remains UNSET.
**Build:** `npm run check` GREEN. **Automated QA on combined dataset:** P0=0, P1=0 (11 checks).

---

## 1. Sample selected (why)

10 real public URLs, chosen for **structural diversity + failure discovery**, not ease:

| URL (path) | Type | Why selected |
|---|---|---|
| /tools/gumloop | tool | short page, SoftwareApplication + ItemList |
| /courses/introduction-to-claude | tutorial | medium, Course+Article, has dates |
| /reviews/is-claude-pro-worth-it | review | long (17 H2), FAQ+Review schema |
| /compare-tools/chatgpt-vs-claude | compare_tools | FAQ + Review/Rating + relationships |
| /prompts/claude-prompts | prompt_page | large, CollectionPage, lists |
| /ai-for/marketers | role_page | CollectionPage+Course+FAQ, many images |
| /collections/learn-claude | collection | learning path, 88 images (thumbnails) |
| /free-tools/prompt-optimizer | free_tool | interactive utility |
| /community/reconcile-…-wagjdx | community_post | user-submitted, slug+hash |
| **/dashboard** | (gated) | **control: must be REFUSED** |

Covers short/medium/long, FAQ-bearing vs not, dated vs not, relationship-heavy, image-heavy, and a gated control.

## 2. Extraction results (scope-enforced)

Extractor: `src/lib/extract/extractor.ts` — public fetch → scope check → parse **page metadata + JSON-LD + heading outline** (not brittle body scraping) → structured English representation. Never stores raw HTML.

**Field coverage (in-scope pages, ok/total = 9/9 unless noted):**

| Field | Coverage | Note |
|---|---|---|
| title | 9/9 | from `<title>` |
| description | 9/9 | meta description |
| canonical | 9/9 | source canonical captured |
| jsonLdTypes | 9/9 | rich per-type schema present |
| headings (H1/H2) | 9/9 | 1–17 per page |
| images (count) | 9/9 | 2–88 per page |
| relationships (internal links) | 9/9 | up to 30 same-origin content links |
| faq | 5/9 | only pages exposing FAQPage schema |
| breadcrumb | 5/9 | only pages exposing BreadcrumbList |
| datePublished / dateModified | 4/9 | only where the page exposes them |
| **bodyText** | **0/9 — FLAGGED** | **key finding, below** |
| scope-guard refusals | 1 (`/dashboard`) | gated path refused, not fetched |

**Anomalies:** 0 JSON-LD parse failures across the sample.

### KEY FINDING — body content is not extractable from raw HTML
The article/tutorial **body prose is React-Server-Component-streamed**, so it is not present in the raw HTML the extractor fetches. Metadata + schema + heading outline extract cleanly; the **body does not**. The synthetic Phase-2 pilot hid this because it authored bodies directly. Reproducing real body content requires a **rendered-DOM (headless-browser) extractor** — a hard gap (see Scale Gate G-Body).

## 3. Ingestion + English master

`/pilot/ingest-real` fetched, scope-checked, structured, and stored **8 real English masters + provenance snapshots** (1 gated refused, 1 isolated — below). English master = title, summary(=meta description), heading-outline sections (body flagged-empty), FAQ (where present), relationships (by contentId, capped), dates, SEO fields. Provenance in `source-snapshots`: sourceUrl, retrievedAt, rawHash, httpStatus, scopeDecision, extractionStatus, fieldCoverage, normalized snapshot → answers "exactly what public source produced this record?"

**Failure isolated:** `/ai-for/marketers` → `ValidationError` on the variant because its slug `marketers` **collides with the synthetic pilot's role page** (unique `(locale,type,slug)`). The item was isolated, its Source marked `ingestStatus=error` (retryable), and the other 8 completed. (In a clean production run without the synthetic set, this specific collision would not occur; the uniqueness guard + isolation are the point.)

## 4. Translation results — NOT PROVEN (blocked)

Real EN→MS/TH/VI **automated** translation was **not run**: no live translation provider/key is wired (`Translator` interface exists; only `FixtureTranslator`). This is Gap **G1 (BLOCKER)**. The translation *mechanics* (independent per-locale variants, versioning, stale-detection, slugs, hreflang, QA) remain proven on the Phase-2 synthetic set; the **real** translation path is **NOT PROVEN** and gates scale. Real bodies also don't extract yet (§2), so there is not yet real body content to translate.

## 5. Localization results

Not evaluated on real content (no real translations produced — §4). MS-not-Indonesian / Thai-spacing / VN-diacritic validators are specified (G5) but not yet implemented; required before the real translation pilot.

## 6. SEO results (real pages)

Verified on real EN pages (e.g. `/en/reviews/is-claude-pro-worth-it`):
- **Canonical** self-referential ✓
- **hreflang** alternates = published locales only (**en + x-default** for EN-only real pages) ✓ — correctly does NOT emit ms/th/vi for unpublished locales
- **JSON-LD**: per-type + **FAQPage** + **BreadcrumbList** (added this phase) + Question/Answer ✓
- **Title/description** from source metadata ✓
- **Sitemap** includes real EN URLs; drafts/unpublished excluded ✓ (17 localized content URLs across combined set)
- **Internal links / related**: resolve to published locale siblings; unresolved omitted (decision 3) ✓

## 7. Frontend results

All 8 real EN pages render **HTTP 200** through the reusable templates (tool, tutorial, review, compare, prompt, collection, free-tool, community) — **no per-page code**. Added `reviews`/`compare`/`blog` routes this phase (real review had no route before → would have 404'd; now covered). Real pages show heading-outline sections (body empty/flagged — §2) + FAQ + related.

## 8. QA results (combined synthetic + real, final)

`{"p0":0,"p1":0,"fail":0,"pass":11}` — completeness (18 active sources, 0 missing master), ingest.errored (1 isolated/retryable, P2), required-fields, slug/locale collision, hreflang cluster, SEO uniqueness, untranslated-leakage (protected names exempt), relationships.malformed (0), relationships.unresolved (59, P2 expected in partial pilot), version/stale, locale-coverage. Idempotency: re-run ingest → same 8, no duplicates.

## 9. Failures found → fixes (all systemic, not per-page)

| Failure | Fix |
|---|---|
| Body prose not in raw HTML (0/9) | FLAGGED; documented headless-extractor requirement (Scale Gate blocker) — not faked |
| Orphan Source when variant failed | on variant failure → Source `ingestStatus=error` (retryable); completeness excludes errored sources |
| "Dangling" relationships in partial pilot (59) | reclassified: unresolved target = P2 (renderer omits); only malformed edges = P1 |
| Real review/compare/blog had no route | added the missing thin routes (all public types now covered) |
| No breadcrumb JSON-LD | added BreadcrumbList to `jsonLd` |
| Slug collision synthetic↔real (`marketers`) | isolation proven; in production the synthetic set is absent |

## 10. Remaining risks (→ Scale Gate)

- **Body extraction requires headless rendering** (G-Body / new) — biggest content gap.
- **Live translation provider unwired** (G1) — real translation NOT PROVEN.
- **Deletion/removal policy undefined** (G6) — decision needed.
- **N+1 queries, ISR, sitemap sharding, migrations, generated types, rendered a11y/perf QA, locale contamination validators** — REQUIRED BEFORE SCALE.
- Automated **a11y/perf not run** (structural a11y in place: `<html lang>` per locale, skip-link, heading order; axe/Lighthouse pending).

**Conclusion:** real **extraction of metadata/structure** is proven and safe (scope-enforced, provenance-tracked, QA-green); real **body extraction** and real **automated translation** are **not yet proven**. See `PHASE_2_5_SCALE_GATE.md`.
