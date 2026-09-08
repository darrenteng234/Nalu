# 06 — ADVERSARIAL REVIEW

Attack the proposed architecture (`01`–`05`) before building. Format per risk:
**ASSUMPTION → WHY IT COULD FAIL → HOW TO DETECT → HOW TO MITIGATE → VERIFY BEFORE SCALE-UP.**
Bias: prefer **automated/system-level** validation over page-by-page manual QC; the design must minimize manual work as the dataset grows.

---

## SEO analysis — why Techpresso ranks, and how we match it (multilingual)

Observed mechanisms (`TECHPRESSO_MASTER_MAP.md` §14), not assumptions:
1. **Programmatic page breadth** — templates × data (tool×role prompt matrix, compare pairs, is-X-worth-it, ai-for-role) → thousands of long-tail-targeted URLs.
2. **Per-type JSON-LD** — Course/SoftwareApplication/Review+Rating/FAQPage/Breadcrumb/CollectionPage/BlogPosting/ItemList → rich-result + AI-answer eligibility.
3. **Dense internal linking** — related blocks + footer role/prompt mesh → crawl depth + internal PageRank flow.
4. **Clean flat keyword slugs**, self-canonical, `index,follow`, comprehensive sitemap.
5. **AI-crawler-aware robots** — allows GPTBot/ClaudeBot/PerplexityBot etc. → AI-answer visibility.
6. **Freshness** — `dateModified`, "new weekly".

**How we reproduce + extend to multilingual:** same programmatic breadth per locale; per-locale titles/desc/slugs/keywords; per-type schema with `inLanguage`; hreflang clusters (source lacks these entirely — our advantage); per-locale sitemaps + index; internal links resolved to locale slugs; freshness surfaced. **Multilingual-specific SEO risks handled below (R5, R9, R10).** SEO is treated as a subsystem (built Phase 8, validated `04` §D/§E/§J), not final polish.

---

## Risks

### R1 — Content model / "programmatic breadth = thin/duplicate content"
- **ASSUMPTION:** templated pages at scale rank like Techpresso's.
- **WHY FAIL:** Google may treat mass-templated, thin, or near-duplicate pages (esp. auto-translated) as spam/doorway → deindex; multilingual multiplies the thin-content surface.
- **DETECT:** `04` `content.duplicate` (shingling), thin-content length checks, per-locale index coverage in Search Console, crawl-sample.
- **MITIGATE:** ensure each page has substantive unique value (real prompts/tutorial overviews/comparison tables), not boilerplate; priority-tier which pages to publish (`03` §AC); allow `noindex` on genuinely thin variants; naturalness gates so translations aren't robotic.
- **VERIFY BEFORE SCALE:** on pilot, duplicate score below threshold; sample pages pass a "would a human find this useful in this language?" review.

### R2 — Auto-translation quality (the core product risk)
- **ASSUMPTION:** LLM translation + automated QA yields native-quality content without 100% human review.
- **WHY FAIL:** subtle unnaturalness, Indonesian-in-Malay, wrong register, mistranslated claims — at scale, undetected, damaging trust + SEO.
- **DETECT:** `03` §I/§J gates, LLM-judge naturalness, back-translation similarity, locale lexicon/diacritic/spacing checks, stratified sampling with failure-rate feedback.
- **MITIGATE:** risk-tiered mandatory human review (Tier A), heavy launch-batch review then taper, termbase enforcement, TM reuse of approved segments, regenerate-on-low-confidence.
- **VERIFY BEFORE SCALE:** native reviewer signs off pilot per locale; stratum failure rates acceptable; Malay-not-Indonesian detector validated on adversarial samples.

### R3 — Access-boundary / copyright
- **ASSUMPTION:** we only use public content; permission covers it.
- **WHY FAIL:** accidental ingestion of gated fields; over-close reproduction of public copy could still raise IP concerns; misrepresenting gated content as ours.
- **DETECT:** `04` `extract.scope_guard`, `schema.no_fabrication`, `asset.no_gated_media`; audit of extracted fields.
- **MITIGATE:** scope-guard at ingest (public URLs/fields only), never bypass access controls, transcreate rather than copy verbatim where feasible, explicit boundary notice where Instructions would sit, keep permission scope documented (`01` §5).
- **VERIFY BEFORE SCALE:** feed gated-URL/field fixtures → rejected; legal/permission scope reconfirmed for public reproduction + translation.

### R4 — Scaling (2k → 100k pages × N locales)
- **ASSUMPTION:** ISR + data-first scales.
- **WHY FAIL:** build/render times, DB hot spots, CMS UI slowness, sitemap size limits (50k URLs/file), translation cost/throughput.
- **DETECT:** build-time metrics, DB query plans, sitemap file counts, cost dashboards.
- **MITIGATE:** on-demand ISR (don't pre-render all), paginated/split sitemaps + index, DB indexing on (content_id, locale, type, status), batched rate-limited translation, priority tiers.
- **VERIFY BEFORE SCALE:** load-test render + a 10× synthetic dataset; confirm sitemap sharding; cost projection per locale.

### R5 — Multilingual indexing / hreflang correctness
- **ASSUMPTION:** hreflang clusters + per-locale canonicals are correct.
- **WHY FAIL:** asymmetric/incorrect hreflang, hreflang to unpublished/404, wrong canonical (cross-locale), duplicate-content across locales if a locale falls back to English → Google merges/ignores.
- **DETECT:** `04` `hreflang.cluster_valid` (symmetry, published-only, 200-only), `canonical.self`, Search Console international targeting.
- **MITIGATE:** clusters by content_id, published-only; never fall back to English *content on a target-locale URL* for indexable pages (decision 3: omit page instead); self-canonical per locale.
- **VERIFY BEFORE SCALE:** pilot hreflang symmetric + valid; a missing-variant fixture produces correct (en+x-default only) cluster, no phantom URLs.

### R6 — Source synchronization / change detection
- **ASSUMPTION:** we can detect source changes reliably.
- **WHY FAIL:** source has no public change API; sitemap/`dateModified` may be unreliable; over-frequent checks waste cost; missed changes → stale translations.
- **DETECT:** field-hash diff (not just dateModified), sitemap diff, `stale.sweep`.
- **MITIGATE:** hash-based detection as source of truth; schedule = check frequency, not assumed update cadence; changed-field-only re-translation.
- **VERIFY BEFORE SCALE:** simulate a source edit on a pilot entity → only changed fields marked stale + re-translated; unchanged untouched.

### R7 — Duplicate content (within + across locales)
- **ASSUMPTION:** templating won't create harmful duplicates.
- **WHY FAIL:** near-identical prompt pages; identical metadata; English leakage making target pages duplicate English ones.
- **DETECT:** `04` `content.duplicate`, `seo.title_unique`/`desc_unique`, `lang.untranslated`.
- **MITIGATE:** unique metadata generation, meaningful per-page content, language-leakage gate, canonical discipline.
- **VERIFY BEFORE SCALE:** pilot: 0 duplicate titles/desc per locale; no untranslated leakage.

### R8 — Database / content-model rigidity
- **ASSUMPTION:** Source+Variant handles all types + future ones.
- **WHY FAIL:** a new source page type or field shape doesn't fit; relationship explosion; migration pain.
- **DETECT:** `classify.unknown_type` triage; schema-fit review on new types.
- **MITIGATE:** generic Source+Variant + edge table + typed field bags; new type = additive (1 table/template/recipe); triage queue for unknowns (never auto-fit).
- **VERIFY BEFORE SCALE:** add a synthetic new type end-to-end without altering existing tables.

### R9 — Localized-slug maintenance / redirects
- **ASSUMPTION:** localized slugs + history redirects keep links stable.
- **WHY FAIL:** slug churn from re-translation → redirect chains, lost equity, broken internal links if resolved by slug.
- **DETECT:** `redirects.slug_history`, `links.internal_resolve`, redirect-chain length check.
- **MITIGATE:** links by content_id (never slug); freeze slug after first publish unless justified; collapse redirect chains; 301 old→current.
- **VERIFY BEFORE SCALE:** change a pilot slug → 301 works, internal links still resolve, no chain >1 hop.

### R10 — CMS/vendor & API dependency
- **ASSUMPTION:** Payload+Postgres (or Sanity) + one LLM vendor are fine.
- **WHY FAIL:** vendor lock-in, pricing/limits changes, CMS scaling limits, single-LLM outage/regression.
- **DETECT:** cost/latency/error dashboards; provider status.
- **MITIGATE:** keep Postgres as source of truth (CMS is an editing layer, replaceable); abstract the translation LLM behind an interface (swap/添加 providers); TM reduces LLM calls; export/backup content as portable JSON.
- **VERIFY BEFORE SCALE:** prove content export/restore; prove a second LLM provider can be slotted for one locale.

### R11 — Cost (translation + rendering + review)
- **ASSUMPTION:** cost is manageable.
- **WHY FAIL:** N locales × 100k pages × re-translations × back-translation checks → large LLM spend; human review cost if sampling too high.
- **DETECT:** per-run cost dashboard; cost/1k-segments; review-hours tracking.
- **MITIGATE:** TM reuse, changed-field-only re-translation, priority tiers, batch pricing, cache back-translations, tune sampling to failure rates.
- **VERIFY BEFORE SCALE:** project full-corpus cost from pilot per-segment cost × volume × locales; confirm within budget before Phase 12.

### R12 — Operational / failure modes
- **ASSUMPTION:** pipeline is resumable and isolates failures.
- **WHY FAIL:** interrupted import corrupts data; one locale/page failure cascades; accidental bulk deletion.
- **DETECT:** `ingest_run` status, `deletion.guard`, per-entity error logs.
- **MITIGATE:** idempotent upserts, per-segment isolation, deletion guard (>X% abort), soft-delete only, transactional writes + version snapshots.
- **VERIFY BEFORE SCALE:** kill an import mid-run → resume clean; force a page failure → isolated; trigger deletion guard.

### R13 — Rendering / mobile / a11y / performance regressions
- **ASSUMPTION:** templates stay fast/accessible at scale.
- **WHY FAIL:** heavy pages, layout regressions across locales (text expansion), a11y misses (lang attr, contrast), Core Web Vitals breaches.
- **DETECT:** `04` §I (axe, Lighthouse CI, snapshot diffs) on fixtures+sample.
- **MITIGATE:** performance budgets, logical-property CSS for text expansion/scripts, per-locale snapshot baselines, `<html lang>`.
- **VERIFY BEFORE SCALE:** fixtures pass a11y+perf budgets in all locales; Thai/Vietnamese text expansion doesn't break layouts.

### R14 — "English fallback" temptation vs decision 3
- **ASSUMPTION:** independent per-locale publish is respected.
- **WHY FAIL:** to fill gaps, someone serves English content on a `/ms/` URL → duplicate content + bad UX + hreflang mess.
- **DETECT:** `lang.leakage` on rendered target pages; index coverage.
- **MITIGATE:** hard rule — a target-locale indexable page shows target content or the page doesn't exist yet (omit); language switcher may link to en, but the en content stays on `/en`.
- **VERIFY BEFORE SCALE:** attempt fallback in pilot → gate blocks indexable English-on-ms.

---

## Assumptions most likely to be wrong (watchlist)
1. Auto-translation is "good enough" without native review → **treat as false for Tier A; sample hard elsewhere.**
2. Programmatic pages will rank → **only with genuine per-page value; monitor index coverage.**
3. Source is stable/greppable for change detection → **use hashes, expect messiness.**
4. Full-corpus translation cost is trivial → **project from pilot before committing.**
5. Public reproduction is unambiguously fine → **reconfirm permission scope; transcreate, don't copy.**

## Verify-before-scale-up checklist (gate to Phase 12)
- [ ] Pilot: every page type × en/ms/th/vi built + published, 0 P0/P1.
- [ ] Native reviewer sign-off per locale (Malay ≠ Indonesian verified adversarially).
- [ ] Duplicate/thin-content below thresholds; metadata unique per locale.
- [ ] hreflang symmetric, published-only, no 404s; canonicals self; missing-variant fixture correct.
- [ ] Scope-guard rejects gated fixtures; no gated content/media present.
- [ ] Change-detection: source edit → only changed fields re-translated.
- [ ] Slug change → 301, links resolve by content_id, no chains.
- [ ] Resumable import + failure isolation + deletion guard proven.
- [ ] a11y + Core Web Vitals within budget in all locales.
- [ ] Full-corpus cost projection within budget.
- [ ] Content export/restore + second-LLM-provider swap proven.

**Overall verdict:** the data-first Source+Variant model + field-level versioned translation pipeline + system-level automated QA + risk-based sampling is sound and minimizes manual QC at scale. The dominant real risks are **translation naturalness (R2)**, **thin/duplicate multilingual content (R1/R7)**, **hreflang/indexing correctness (R5/R14)**, and **cost (R11)** — all detectable by the `04` suite and gated by the pilot before scale-up.
