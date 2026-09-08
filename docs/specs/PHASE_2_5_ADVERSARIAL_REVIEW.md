# PHASE 2.5 — ADVERSARIAL REVIEW

Format: **ASSUMPTION → FAILURE MODE → DETECTION → SYSTEMIC FIX → VERIFICATION.** Bias: fix a *class* of problem at the system level, never patch individual pages. All findings below came from running the pipeline against **real** public content.

---

## Found this phase (real content broke assumptions)

### R-1 Raw HTML contains the article body
- **ASSUMPTION:** fetching the public URL yields the readable body.
- **FAILURE:** bodies are RSC-streamed → **0/9** body extraction from raw HTML.
- **DETECTION:** extractor field-coverage report flagged `bodyText` on every page.
- **SYSTEMIC FIX:** body marked FLAGGED (never faked); requires a **rendered-DOM (headless) extractor** — specified as a scale blocker, not worked around. Metadata/schema/heading path stays raw-HTML (cheap).
- **VERIFICATION:** coverage 0/9 recorded; pages render with heading outline while body stays honestly empty.

### R-2 An item either fully ingests or fully skips
- **ASSUMPTION:** per-item failure isolation is enough.
- **FAILURE:** a mid-item variant failure (slug collision) left an **orphan Source** with no EN master → false P0.
- **DETECTION:** QA `completeness.en_master` flagged 1 missing.
- **SYSTEMIC FIX:** on variant failure → Source `ingestStatus=error` (retryable); completeness ignores errored sources; a P2 `ingest.errored` tracks them.
- **VERIFICATION:** re-run → marketers isolated/errored, completeness 0 missing, QA green.

### R-3 A relationship target that isn't present is a defect
- **ASSUMPTION:** every relationship must resolve.
- **FAILURE:** real pages link to ~30 others; a partial pilot ingests few → 59 "dangling" → false P1.
- **DETECTION:** QA `relationships.integrity` fired 59.
- **SYSTEMIC FIX:** split — malformed edge (no target id) = P1; **unresolved** target = P2 (renderer already omits, decision 3).
- **VERIFICATION:** malformed 0 (P1 pass); unresolved 59 (P2 info).

### R-4 (carried) "translated == English" ⇒ leakage
- Already fixed Phase 2 (protected proper nouns exempt; body-equality is the signal). Re-confirmed on combined set: 0 false positives.

---

## Mandated challenge categories

### Content — can real source structure break the model?
Partly, yes: **body doesn't extract** (R-1). Metadata/heading/FAQ/relationship structure survived diverse real pages (short→long, 1–17 headings, 2–88 images, dated/undated) with **0 parse anomalies**. Model held; extraction depth is the gap. **Before scale:** headless body extractor + normalization tests over more page shapes.

### Translation — fluent-but-wrong localization?
**Not proven either way** — no live provider (G1). The *detection* layer for this (back-translation/semantic-equivalence, MS-vs-Indonesian lexicon, Thai spacing, VN diacritics) is **specified but unimplemented** (G5). **Before scale:** implement §03 gates AND seed known-bad translations to prove they're caught.

### SEO — duplicate / thin / indexation problems?
Controlled: per-locale canonical (self), hreflang published-only (verified EN-only page emits only en + x-default), unique titles/descriptions per locale (QA), BreadcrumbList added, sitemap excludes drafts. **Risk at scale:** heading-only bodies (until R-1 fixed) = **thin pages** → must not publish thin real pages; gate on body presence before publish.

### Identity — can localized slugs break content identity?
No: links + hreflang resolve by `content_id`, slug history → 308 (proven Phase 2). Real collision (`marketers`) was caught by the uniqueness guard + isolated. **Before scale:** slug-generation must namespace to avoid cross-set collisions during migration.

### Updates — can source changes create stale translations?
Mechanism proven (Phase 2: field-hash change → sourceVersion bump → only affected entity retranslated; unchanged skipped; stale detected). **Not yet exercised on real content** (no real translations). **Removal policy undefined** (G6) — decision required.

### Scale — 2k → 20k → 100k?
Structural risks known & mostly mitigable in code: **N+1 source lookups** (fix before scale), single sitemap (shard before scale), `force-dynamic` (→ISR), Payload admin at 100k (pagination). None are architectural dead-ends; all are REQUIRED-BEFORE-SCALE items with known fixes.

### QA — can systemic errors escape automated detection?
The suite caught 3 real issues this phase (R-1/2/3) → evidence it has teeth. **Blind spots it did NOT test** (see below) remain the real risk.

### Operations — can one failed record stop the pipeline?
No: per-item + per-locale isolation verified (marketers failed; 8 succeeded; re-run idempotent).

### CMS — can editors operate the result?
Untested at volume. Payload admin works at pilot scale; **admin performance/UX at 10k+ not evaluated** (G-CMS, before scale).

### Future languages — add KO/JA/ID/FIL without redesign?
Architecturally yes: locale = config list + Variant rows; templates/queries locale-agnostic. **Untested:** CJK/Korean typography + per-locale validators + ID-vs-MS contamination. Adding a locale needs its §X-style rule block first.

---

## What did our tests FAIL to test? (blind spots — the honest part)

1. **Real body content** end-to-end (extraction→translation→render) — untested because body doesn't extract (R-1).
2. **Real automated translation quality** — untested (no provider). A green structural suite says nothing about fluency/accuracy.
3. **MS↔Indonesian contamination, Thai spacing, VN diacritics** on real machine output — validators unimplemented.
4. **Malformed/hostile markup** beyond this 9-page sample (nested lists, embedded media, mixed-language body, very long articles) — not stress-tested at the body level.
5. **a11y/perf** — no axe/Lighthouse run; only structural a11y present.
6. **Deletion / source-removal** flow — not implemented/tested.
7. **Scale behaviour** (query latency, admin, sitemap) at 10k+ — not measured.
8. **CMS editor workflow** with real reviewers — not exercised.

**Fixtures to add before scale** (a test is only valuable if it can catch a realistic failure): a headless-extracted real body; a deliberately Indonesian-contaminated `ms` string; a VN string with stripped diacritics; a Thai string with Latin-style spacing; a source-removed event; a 100-relationship page; a 10k-row query benchmark.

**Overall:** the architecture **survived real content structurally** and its QA **caught real failures**, but the two things that most determine success at scale — **real body extraction** and **real translation quality detection** — are **not yet proven**. That drives the Scale Gate.
