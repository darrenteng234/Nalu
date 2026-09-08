# PHASE 2.5 — GAP MATRIX

**Purpose:** compare the Phase 2 implementation against what is required to safely process **real, messy, public** Techpresso content from discovery → multilingual publication without page-by-page manual QC.
**Date:** 2026-09-07. **Rule:** the synthetic Phase 2 pilot is NOT sufficient evidence; every "safe" classification is adversarially challenged against real messy content.

**Classifications:** `BLOCKER` (stops the real-content pilot) · `REQUIRED FOR REAL PILOT` (needed to run it honestly) · `REQUIRED BEFORE SCALE` · `SCALE OPTIMIZATION` · `DEFERRED`.

---

### G1 — Live translation provider (EN → MS/TH/VI)
- **REQUIREMENT:** automated native translation of real English masters into MS/TH/VI via the pipeline's `Translator`.
- **CURRENT STATE:** `Translator` interface exists; only `FixtureTranslator` (reads authored fixtures) is implemented. No live provider, **no API key** (D-C unresolved).
- **EVIDENCE:** `src/lib/pipeline/index.ts` — `FixtureTranslator` only; Phase 2 report §6.4.
- **RISK:** cannot prove the *real* translation path; real English (unseen text) cannot be auto-translated.
- **CLASSIFICATION:** **BLOCKER** (for the real *translation* pilot).
- **PROPOSED FIX:** implement `ClaudeTranslator` behind the interface (needs the user's API key/provider = a decision). For this phase, translate the tiny real sample with an **explicitly-labelled manual stand-in** to exercise downstream (slugs/hreflang/SEO/frontend/QA) — NOT counted as proof of the automated path.
- **VERIFICATION:** with a key, translate a real English master and pass all §03 gates; until then, mark translation-automation **NOT PROVEN**.

### G2 — Real public-source extractor
- **REQUIREMENT:** fetch a public URL → scope-check → extract → normalize → structure → English master, from real HTML (Next.js RSC-streamed pages).
- **CURRENT STATE:** none. Phase 2 ingested a synthetic fixture; no HTML fetch/parse.
- **EVIDENCE:** `src/pilot/fixtures.ts` is authored; no fetcher.
- **RISK:** real extraction is where most failures live (messy markup, missing fields, RSC payloads).
- **CLASSIFICATION:** **REQUIRED FOR REAL PILOT.**
- **PROPOSED FIX:** build `src/lib/extract/` — fetch (public only), parse to structured English (title, summary, sections, faq, relationships), field-level extraction-confidence + FLAG on failure.
- **VERIFICATION:** run on a diverse real sample; per-field extraction report; QA `completeness`.

### G3 — Programmatic scope enforcement (gated content)
- **REQUIREMENT:** extractor must refuse gated/member content and never invent it.
- **CURRENT STATE:** boundary documented (spec 01 §5); QA has `scope_guard` conceptually but no extractor to enforce it at fetch time.
- **EVIDENCE:** no fetch layer exists yet.
- **RISK:** accidental ingestion of gated fields; misrepresenting gated content as present.
- **CLASSIFICATION:** **BLOCKER** (must exist before any real fetch).
- **PROPOSED FIX:** extractor only requests public URLs (in `sitemap.xml`, not under robots-disallowed prefixes `/admin /api /auth /welcome /dashboard /my-list /playbooks`); any field marked gated → `OUT OF SCOPE`, never fabricated; a `scope_decision` recorded per source.
- **VERIFICATION:** feed a disallowed URL → rejected; assert no gated field stored.

### G4 — Source snapshot / provenance
- **REQUIREMENT:** auditable record: `source_url, source_type, source_identifier, retrieval_timestamp, source_hash, source_status, extraction_status, scope_decision`, + normalized snapshot.
- **CURRENT STATE:** `sources` has `sourceUrl`, `fieldHashes`, `ingestStatus` — but no retrieval timestamp, source_hash of raw, status, scope_decision, or snapshot store.
- **EVIDENCE:** `src/collections/Sources.ts`.
- **RISK:** cannot answer "exactly what public source produced this record?"; no reproducibility.
- **CLASSIFICATION:** **REQUIRED FOR REAL PILOT.**
- **PROPOSED FIX:** add a `source-snapshots` collection (or fields on Sources): url, retrievedAt, rawHash, httpStatus, scopeDecision, normalizedSnapshot(json). Extractor writes it.
- **VERIFICATION:** every pilot record links to a snapshot with a hash + timestamp.

### G5 — Full §03 translation-QA gates
- **REQUIREMENT:** English-leakage, untranslated, source-language fragments, wrong-locale, MS/ID contamination, missing, duplicated, broken formatting/links/placeholders, terminology, protected-name integrity, excessive-literal, semantic equivalence, content-loss.
- **CURRENT STATE:** QA has 9 structural checks incl. a *refined* leakage check (protected proper nouns exempt) — but not: MS/ID contamination lexicon, Thai spacing/diacritic, VN diacritic density, placeholder/code integrity, back-translation/semantic-equivalence, terminology.
- **EVIDENCE:** `src/lib/qa/index.ts` (9 checks); `03` §I/§J/§X/§Y/§Z.
- **RISK:** "fluent-looking but wrong" localization escapes; MS↔ID contamination undetected.
- **CLASSIFICATION:** **REQUIRED FOR REAL PILOT** (contamination/diacritic checks) + **REQUIRED BEFORE SCALE** (semantic-equivalence/back-translation).
- **PROPOSED FIX:** add locale validators (MS banned-ID-lexicon list, Thai script/spacing, VN diacritic density), placeholder/markdown-AST integrity, terminology adherence; back-translation gate when live provider exists.
- **VERIFICATION:** seed a known-bad translation (Indonesian word in `ms`, dropped VN diacritics) → check flags it.

### G6 — Source deletion / removal policy
- **REQUIREMENT:** source page removed → detect → apply a documented publication policy (don't leave stale content forever).
- **CURRENT STATE:** **undefined.** Change-detection handles add/update; removal handling not implemented and specs 02 §11 only say "soft-delete + redirect", without a full policy (grace period, unpublish vs redirect, sitemap removal).
- **EVIDENCE:** `02` §11; no removal code.
- **RISK:** stale pages persist, or content vanishes abruptly.
- **CLASSIFICATION:** **REQUIRED FOR REAL PILOT** — and a **DECISION** (policy not fully specified).
- **PROPOSED FIX:** define policy (recommend: source-gone → mark source `removed`, keep variants for a grace window, set `noindex`, drop from sitemap, then archive+301 to parent hub after N days). Flag for user approval.
- **VERIFICATION:** simulate removal → status transitions + sitemap drop + eventual 301.

### G7 — N+1 source lookups in data layer
- **REQUIREMENT:** query behaviour safe toward 20k–100k records.
- **CURRENT STATE:** `queries.ts` fetches the Source per variant in loops (`sourceFor` per item) — N+1.
- **EVIDENCE:** `listPublishedByType`, `allPublished`, `search` each call `sourceFor` in a loop.
- **RISK:** hub/sitemap/search latency explodes at scale.
- **CLASSIFICATION:** **REQUIRED BEFORE SCALE** (fine at pilot; *challenged:* at 100 real records a hub already does 100 extra queries → fix now to be safe).
- **PROPOSED FIX:** batch with a single `in`-query on `sources.contentId`, map in memory.
- **VERIFICATION:** query count per hub is O(1) sources fetch; measure.

### G8 — ISR / render strategy
- **REQUIREMENT:** render cost bounded at scale.
- **CURRENT STATE:** `force-dynamic` (every request renders + DB).
- **EVIDENCE:** `[locale]/layout.tsx`.
- **RISK:** per-request DB load at scale.
- **CLASSIFICATION:** **REQUIRED BEFORE SCALE.**
- **PROPOSED FIX:** switch to ISR (`revalidate`) + on-publish revalidation.
- **VERIFICATION:** cached renders; revalidation on publish.

### G9 — Sitemap sharding
- **REQUIREMENT:** ≤50k URLs/file; per-locale index.
- **CURRENT STATE:** single combined sitemap.
- **EVIDENCE:** `src/app/sitemap.ts`.
- **RISK:** invalid sitemap past 50k URLs.
- **CLASSIFICATION:** **REQUIRED BEFORE SCALE** (fine now; pilot << 50k).
- **PROPOSED FIX:** `generateSitemaps` per locale.
- **VERIFICATION:** count-based shard test.

### G10 — Migration strategy (push → SQL migrations)
- **REQUIREMENT:** production-safe schema changes.
- **CURRENT STATE:** dev schema `push` only (CLI migrate blocked by Phase-1 F-A env bug).
- **EVIDENCE:** Phase 1/2 used push.
- **RISK:** no versioned/reversible schema; unsafe for prod.
- **CLASSIFICATION:** **REQUIRED BEFORE SCALE.**
- **PROPOSED FIX:** resolve F-A (run migrate via in-Next path or fixed tooling); commit SQL migrations.
- **VERIFICATION:** `migrate` produces + applies a migration cleanly.

### G11 — Generated Payload types
- **REQUIREMENT:** typed content access.
- **CURRENT STATE:** `payload-types.ts` not generated (F-A); `any` shims in data/QA layers.
- **CLASSIFICATION:** **SCALE OPTIMIZATION** (challenged: type-safety would catch real-content field bugs earlier → REQUIRED BEFORE SCALE).
- **PROPOSED FIX:** generate types once CLI/interop fixed.
- **VERIFICATION:** remove `any` shims; typecheck green.

### G12 — Rendered QA (a11y / perf / visual)
- **REQUIREMENT:** automated a11y (axe), Core Web Vitals, multilingual visual regression.
- **CURRENT STATE:** none automated; structural QA only.
- **EVIDENCE:** `04` §I unimplemented.
- **RISK:** Thai/VN layout breakage, contrast, overflow undetected.
- **CLASSIFICATION:** **REQUIRED BEFORE SCALE** (basic a11y checks **REQUIRED FOR REAL PILOT**).
- **PROPOSED FIX:** axe + Lighthouse CI on fixtures + snapshot diffs per locale.
- **VERIFICATION:** run against real pilot pages; record results.

### G13 — Real-HTML normalization robustness
- **REQUIREMENT:** handle nested lists, links, images, embedded media, unusual punctuation, empty/long sections, malformed markup, mixed-language text.
- **CURRENT STATE:** template renders clean structured `sections[]`; no parser for messy HTML yet (G2).
- **RISK:** real markup breaks structure or leaks raw HTML into content.
- **CLASSIFICATION:** **REQUIRED FOR REAL PILOT.**
- **PROPOSED FIX:** normalize to a safe block model (heading/paragraph/list/link/image), drop/escape unknown tags, flag anomalies; never store raw source HTML for rendering.
- **VERIFICATION:** extraction validation over diverse real pages; anomaly flags.

### G14 — Breadcrumb + full SEO recipe on real pages
- **REQUIREMENT:** breadcrumb JSON-LD + all SEO fields per `14`.
- **CURRENT STATE:** JSON-LD emits per-type + FAQPage; **no BreadcrumbList**.
- **EVIDENCE:** `src/lib/seo/jsonld.ts`.
- **CLASSIFICATION:** **REQUIRED FOR REAL PILOT.**
- **PROPOSED FIX:** add BreadcrumbList (hub → entity) to `jsonLd`.
- **VERIFICATION:** breadcrumb present in head on pilot pages.

### G15 — Entity-aware language switcher
- **REQUIREMENT:** switch to the sibling localized slug.
- **CURRENT STATE:** falls back to locale home.
- **CLASSIFICATION:** **DEFERRED** (UX; challenged: not a correctness/SEO issue — hreflang is correct regardless → stays DEFERRED).
- **PROPOSED FIX:** cluster-aware switcher.
- **VERIFICATION:** manual.

### G16 — Category / hub pages for taxonomy
- **REQUIREMENT:** category + role hub pages (public types).
- **CURRENT STATE:** categories seeded; role pages render; **no category detail/hub route**.
- **CLASSIFICATION:** **REQUIRED BEFORE SCALE** (category is a public indexable type).
- **PROPOSED FIX:** add `/{locale}/categories/[slug]` listing entities in a category.
- **VERIFICATION:** render + hreflang + sitemap inclusion.

---

## Adversarial re-classification (challenging the non-blockers)

- **G7 (N+1)** — *challenged:* even the real pilot's ~15 records make a hub do ~15 extra queries; harmless now but the pattern is the exact scale trap. Kept REQUIRED BEFORE SCALE, but I will **fix it in this phase** (cheap, de-risks the scale gate).
- **G9 (sitemap)** — real pilot << 50k, single file valid. Confirmed BEFORE SCALE, not now.
- **G11 (types)** — real messy fields are exactly where `any` hides bugs → nudged toward BEFORE SCALE (not just optimization).
- **G12 (a11y)** — basic a11y (lang attr, headings, alt) must run on the **real** pilot (real content has images/long headings) → split: basic checks REQUIRED FOR REAL PILOT.
- **G15 (switcher)** — confirmed DEFERRED: hreflang/canonical are correct without it; pure UX.

## Phase 2.5 execution plan (from this matrix)
1. Build **G2/G3/G4/G13** (real scope-enforced extractor + snapshots) — the core new proof.
2. Add **G14** (breadcrumb) + **G5** locale contamination/diacritic checks + **G7** batching (cheap de-risk).
3. Run the real-content pilot: extract → English master → (manual stand-in translate, G1 blocked) → QA → SEO → frontend → change-detection/idempotency/failure-isolation.
4. **G1, G6, G8, G9, G10, G12(full), G16** → carried into the Scale Gate as conditions/decisions.

**Headline:** the real *extraction* path can be built and proven now; the real *automated translation* path is **BLOCKED on G1 (provider + key)** and **G6 (deletion policy) is an open decision** — both will shape the scale gate toward READY-WITH-CONDITIONS / NOT-READY.
