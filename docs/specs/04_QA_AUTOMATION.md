# 04 — QA AUTOMATION (System-level)

**Principle:** NO page-by-page manual QC. Validation is automated, machine-readable, threshold-driven, and run in CI + pre-publish + post-deploy. Humans only see **risk-sampled** items and **failures**. As the dataset grows, manual effort must stay ~flat.

Companion: `02` (data model), `03` (translation/severity), `05` (build phases).

---

## 1. Where checks run

1. **Ingest-time** (extraction) — completeness, scope, classification.
2. **Pre-translation** — source integrity.
3. **Post-translation / pre-publish** — the `03` §I/§J gates per segment (P0/P1 block).
4. **Pre-build / CI** — cross-entity integrity (links, slugs, hreflang, uniqueness, orphans).
5. **Post-build / crawl** — rendered-page checks (schema, metadata, rendering, mobile, perf, a11y) on **fixtures + sample**, not all pages.
6. **Post-deploy / scheduled** — sitemap/robots live, source-change detection, stale-translation sweep.

Every check emits: `{check_id, target(content_id/locale/url), severity(P0–P3), pass|fail, detail, threshold}` → a QA report (JSON) + dashboard. **Any P0/P1 fails the gate.**

## 2. Check catalog (machine-readable)

### A. Source extraction & data completeness
- `extract.completeness` — every required field per type present (`02` §3); missing required = P0.
- `extract.scope_guard` — no gated field/URL present in ingested data (Instructions/video/dashboard/etc.); any = P0 (also a boundary violation).
- `content.counts` — per-type counts vs expected (sitemap-derived) within tolerance; large unexpected drop = P1 (possible extraction break / accidental deletion).
- `content.duplicate` — near-duplicate detection (content hash / shingling) within a type+locale; duplicates = P2 (except intended templated similarity).
- `fields.missing` — non-null constraints on required fields; P0/P1.
- `classify.unknown_type` — sitemap URL not matching a known pattern → `triage_queue`, P1 (never auto-templated).

### B. Links, redirects, canonical
- `links.internal_resolve` — every internal ref resolves to a published variant in the same locale OR is correctly omitted/fallback (decision 3); dangling link = P1.
- `links.external_reachable` — external URLs return 2xx/3xx (sampled, rate-limited); persistent 4xx/5xx = P2.
- `links.no_orphan` — every published page reachable from nav/hub/related within N hops; orphan = P1.
- `redirects.slug_history` — every `slug_history` old slug 301s to current; broken = P1.
- `redirects.archived` — archived entity 301s to successor/hub; P1.
- `canonical.self` — each page canonical = its own localized URL; wrong/missing = P1.

### C. Multilingual / hreflang / language integrity
- `hreflang.cluster_valid` — cluster lists only published variants by content_id + `x-default=en`; symmetric (A links B ⇒ B links A); no hreflang to non-200 URLs. Fail = P1.
- `hreflang.locale_code` — valid BCP-47; matches route locale. P1.
- `lang.leakage` — rendered text language-ID matches locale; ms has no Indonesian tokens, th spacing valid, vi diacritics present (`03` §X/§Y/§Z). Fail = P1.
- `lang.untranslated` — no target segment equal to English (non-protected) / no English blocks above threshold. P1.
- `lang.collision` — no two entities share (locale, slug, type). P0.

### D. Metadata & SEO
- `seo.title_present` / `seo.desc_present` — per page, per locale. P1.
- `seo.title_unique` / `seo.desc_unique` — unique within a locale (hash set); duplicates = P1.
- `seo.length` — title/description within char/pixel budget. P2.
- `seo.keyword_present` — localized target keyword present in title/H1 (heuristic). P2.
- `seo.h1_single` — exactly one H1; logical heading order. P2.
- `robots.indexable` — public pages `index,follow`; app/utility routes `noindex`/disallowed. P1.

### E. Structured data / schema
- `schema.present` — required JSON-LD types per page type present (recipe in `01` §13). P1.
- `schema.valid` — validates against schema.org shapes (required props, types); invalid = P1.
- `schema.inLanguage` — equals page locale. P1.
- `schema.no_fabrication` — ratings/reviews/prices only emitted if truly present in-scope; no invented AggregateRating. P0 (integrity).

### F. Content/format integrity (post-translation, from `03`)
- `fmt.markdown_ast` — target AST shape == source. P0/P1.
- `token.protected_preserved` — protected names/vars/code intact (`03` §M/§N). P0.
- `prompt.integrity` — prompt variables/code byte-identical, counts match. P0.
- `content.hallucination` — target ⊆ source (links/numbers/claims). P0/P1.
- `content.numbers_units` — values preserved, format localized (`03` §S). P0 on value change.

### G. Versioning & freshness
- `version.match` — `variant.translated_from_source_version` ≥ latest source_version for each field, else `stale`. Stale published = P1 (schedule re-translate).
- `stale.sweep` — scheduled: list published variants with stale fields → re-translate queue.
- `deletion.guard` — a run that would archive/delete > X% of a type aborts pending human confirm (accidental-deletion guard). P0.
- `source.change_detect` — sitemap diff + field-hash diff produces a change set; failures to fetch = P2 (retry).

### H. Assets & media
- `asset.refs_resolve` — every image/og_image ref exists; missing = P1.
- `asset.alt_present` — images have localized alt (a11y+SEO). P2.
- `asset.no_gated_media` — no gated video/asset referenced. P0 (boundary).

### I. Rendering, mobile, a11y, performance (fixtures + sample)
- `render.no_error` — page renders without runtime/console errors (fixtures + sample). P1.
- `render.mobile_regression` — visual/layout snapshot diff at 390/768/1440 vs baseline per template; regressions = P2.
- `a11y.axe` — automated axe checks (contrast, landmarks, labels, lang attr) on fixtures; serious = P1, moderate = P2.
- `perf.web_vitals` — LCP<2.5s, CLS<0.1, INP<200ms on mid-tier mobile (Lighthouse CI on fixtures + sample); budget breach = P2.
- `render.i18n_meta` — `<html lang>` = locale; dir correct.

### J. Crawlability / sitemaps / robots (post-deploy, live)
- `sitemap.valid` — per-locale sitemaps + index well-formed; only published 200 URLs; counts match DB. P1.
- `robots.live` — robots serves; disallows app routes; references sitemaps. P1.
- `crawl.sample_200` — sampled URLs per type return 200 and render expected schema/meta. P1.

## 3. Thresholds & gates (defaults, tunable)

| Gate | Rule |
|---|---|
| Pre-publish (per variant) | 0 × P0, 0 × P1 required (per `03` §AC tier policy). P2 allowed w/ warning. |
| CI pre-build | 0 × P0 across dataset; P1 count must be 0 for changed entities, non-increasing overall. |
| Scale-up gate (pilot→full) | full check suite green on pilot; sampled crawl P0=0, P1=0; perf/a11y within budget on all fixtures. |
| Deploy gate | live sitemap/robots/crawl-sample pass; no P0. |

## 4. Representative test-fixture suite (NOT every page)

One canonical fixture per page type × 3 locales (en/ms/th/vi where applicable) with known-good expected output (golden files). Templates are validated against fixtures; the full dataset is validated by **rules + sampling**, not per-page inspection.

Fixtures (each: source entity + expected rendered HTML/meta/schema snapshot):
1. `homepage`
2. `tutorial` (public overview; incl. one `has_video=true` badge case)
3. `prompt_page` + `prompt` (with protected variables + code)
4. `tool`
5. `collection` / learning path (ordered steps)
6. `compare` (platform) and `compare_tools`
7. `review`
8. `blog`
9. `community` (read-only)
10. `free_tool` (shell)
11. `ai_for_role`

Each fixture asserts: correct template, schema recipe, hreflang cluster, canonical, localized slug, protected-token preservation, metadata uniqueness within its locale set, mobile snapshot, a11y, perf budget.

**Edge fixtures (must exist):**
- entity with a locale variant **missing** (assert decision-3 omission/fallback, valid hreflang).
- entity with a **stale** field (assert flagged, not silently served).
- prompt with **code + variables** (assert byte-identical).
- slug **change** (assert 301).
- **unknown new type** URL (assert triage, no auto-template).
- near-duplicate content (assert dedupe/flag).

## 5. Sampling / risk-based human review (system)

- Automated gates catch mechanical + many semantic errors. Humans review only:
  - all **P0/P1** that auto-repair can't resolve,
  - **risk-sampled** items per `03` §AC (Tier A mandatory; B ~10–20%; C ~2–5%; stratified),
  - **launch batches** (first N per type per new locale), tapering as stratum failure-rate drops.
- Sampling is stratified by type/tool/role/confidence; a stratum's rising failure rate auto-raises its sample %. All decisions logged (`03` §AD).

## 6. Reporting

- Each run → JSON report + a dashboard: pass/fail by check, severity counts, per-type/per-locale coverage, stale count, orphan count, duplicate count, perf/a11y trends, review-queue depth, sampling failure rates.
- Trends tracked over time; regressions alert.

## 7. CI integration

- Checks run in CI on every content batch + code change; gates block merge/deploy on P0/P1.
- Idempotent + resumable (aligns with `05`): a failed batch is isolated and re-runnable; one page's failure never blocks the rest.

## 8. Non-goals

- No requirement to manually open every page.
- No 100% human translation review.
- Manual effort scales with **risk and failures**, not with page count.
