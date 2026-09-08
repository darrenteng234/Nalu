# 05 — MASTER BUILD INSTRUCTION

**Audience:** Claude Code (or an engineer) building the product. **Implementation-ready.**
**Preconditions:** `01`–`04` + `06` reviewed. Access boundary (`01` §5) enforced throughout: public content only, no gated extraction, no access-restriction bypass.
**Golden rules:**
- **Pilot before scale.** Build + validate a representative pilot (every page type × en/ms/th/vi) BEFORE importing the full public dataset.
- **Idempotent + resumable.** Any step re-runs safely; interruption never corrupts existing content; per-entity/per-locale failures isolate.
- **Per-locale independence.** One locale failing must not block others; one page failing translation is isolated, not fatal.
- **No page-by-page manual QC** — rely on `04` automation + `03` risk sampling.

Overall lifecycle the system must embody: `DISCOVER → DETECT CHANGE → EXTRACT → STRUCTURE → TRANSLATE → LOCALIZE → VERIFY → REVIEW (when required) → PUBLISH → MONITOR → UPDATE`.

---

## PHASE 0 — Environment / repository
- Verify: Node (repo `.nvmrc` = 24; local is 25 — pin one, prefer `nvm use 24` to match template), Next.js 16.3.0 template builds (`npm run check`).
- Confirm the untouched cloner template is the base; remove/detach template git remote before first project commit.
- Provision: Postgres, the CMS (Payload recommended, `01`/`02`), env/secrets (DB URL, LLM API key, analytics). **Never commit secrets.**
- Set up CI with the `04` gate hooks (lint/typecheck/build + content checks).
- **Exit gate:** clean build, DB reachable, CMS admin loads, CI green on empty content.

## PHASE 1 — Architecture / data model
- Implement the Source+Variant schema (`02`): tables, `content_id` (ULID), `slug_history`, relationships edge table, taxonomy, `nav_menu`, `version_history`, `ingest_run`, `triage_queue`.
- Implement publication states (`02` §6), version axes + field-hash storage (`02` §7), CMS localization + drafts/versions + roles mapped to states.
- Implement locale config (`en` pivot; `ms`,`th`,`vi`) + path-prefix routing scaffolding (`[locale]` segment).
- **Exit gate:** migrations apply; CRUD an entity + variants via CMS; version history records; unit tests on model invariants (unique (locale,slug,type); ref integrity).

## PHASE 2 — Content ingestion pipeline (public-only)
- Build the extractor: reads **public URLs/fields only**; scope-guard rejects any gated field (`04` A `extract.scope_guard`).
- `DISCOVER`: read public sitemap + hubs → URL set. `CLASSIFY`: map URL→type by pattern; unknown → `triage_queue` (no auto-template).
- `EXTRACT → STRUCTURE`: normalize to Source + English Variant drafts + relationships by `content_id` + per-field hashes.
- Idempotent upsert by `content_id`; `ingest_run` tracks per-entity status; resume on interruption; per-entity failure isolates.
- **Exit gate:** dry-run on a handful of public URLs of each type produces valid Source+EN drafts; scope-guard tests pass (feed it a gated URL fixture → rejected); re-run is a no-op (idempotent).

## PHASE 3 — English canonical content
- Populate English Variants (from extraction) to `approved` for the **pilot set** (see Phase 10). English is the pivot; no translation yet.
- Run `04` source/completeness/duplicate/link checks on English.
- **Exit gate:** pilot English entities `approved`, 0 P0/P1 on English dataset.

## PHASE 4 — Multilingual system
- Implement `[locale]` routing for all locales (`/en`,`/ms`,`/th`,`/vi`); root 302 by Accept-Language; `x-default=en`.
- Implement hreflang cluster generation (by `content_id`, published-only), per-locale canonical, per-locale sitemap generation, `<html lang>`.
- Language switcher (entity-aware; falls back to locale home).
- **Exit gate:** English pilot renders under `/en`; empty ms/th/vi routes behave per decision 3 (no crash, valid hreflang with only en + x-default).

## PHASE 5 — Translation / localization pipeline
- Implement the `03` pipeline: segment → mask protected tokens → translate (EN→target, independent per locale, glossary+locale rules injected) → unmask → automated verification (`03` §I) → localization verification (`03` §J) → confidence (`03` §H) → route (risk model `03` §AC) → publish → audit trail.
- Implement TM, termbase (per locale, incl. Malay-not-Indonesian banned list, Thai/vi validators), field-level staleness + section-level re-translation.
- Wire severity gates (P0/P1 block) and the human-review queue.
- **Exit gate:** translate the pilot into ms/th/vi; all `03` gates enforced; audit trail populated; Tier-A items routed to review; a deliberately broken segment (lost token, hallucinated link, Indonesian word in ms, missing vi diacritics) is caught and blocked.

## PHASE 6 — Page templates
- One template per type (`01` §6): homepage, tutorial(overview), prompt_page/prompt, collection/learning-path, tool, compare, compare_tools, review, ai_for_role, blog, community(read-only), free_tool(shell).
- Templates render entity variants; emit per-type JSON-LD recipe with `inLanguage`; resolve internal links to locale slugs; "Related" blocks; footer role/prompt mesh.
- Tutorials render **public Overview only**; where Instructions would be, show owned content or a clear boundary notice (never gated text).
- **Exit gate:** every template renders its fixture (`04` §4) correctly in all locales; golden snapshots stored.

## PHASE 7 — Navigation / search
- Data-driven header/footer from `nav_menu`; localized labels; per-locale slug resolution; language switcher.
- Our own public search (`/{locale}/search`) over published variants (Postgres FTS to start); empty-state + suggestions. (Search may land at end of pilot; nav/hub discovery must work regardless.)
- **Exit gate:** nav/footer correct per locale; search returns locale-scoped published results on pilot.

## PHASE 8 — SEO
- Implement, per locale: unique titles/descriptions, H1/heading order, canonical, hreflang, per-locale sitemaps + index, robots (allow public, disallow app routes), breadcrumbs, OG/Twitter, structured-data recipes, freshness (`dateModified`).
- Reproduce Techpresso's ranking mechanisms (documented in `TECHPRESSO_MASTER_MAP.md` §14, analyzed in `06` §SEO): programmatic breadth, per-type schema, dense internal linking, long-tail slug coverage — made multilingual.
- **Exit gate:** `04` §D/§E/§J checks pass on pilot; schema validates; no duplicate titles/desc within a locale; sitemaps well-formed.

## PHASE 9 — Automated QA
- Wire the full `04` suite into CI + pre-publish + post-build crawl (fixtures+sample) + post-deploy.
- Implement dashboards/reports, deletion guard, stale sweep, sampling.
- **Exit gate:** full suite runs green on pilot; deletion guard + stale sweep tested; report/dashboard produced.

## PHASE 10 — Representative content import (PILOT)
- Import a **pilot dataset**: ≥1 (ideally 3–5) real public entity per type, chosen to exercise relationships (a tool + its tutorials + related prompt page + a role page linking them + a collection using them + a compare + a review), across **en + ms + th + vi**.
- Run full pipeline end-to-end on the pilot.
- **Exit gate:** pilot fully built, translated, validated; all `04` gates green; Tier-A human review done; SEO/schema/hreflang correct; perf/a11y within budget.

## PHASE 11 — Validation
- Adversarial validation of the pilot against `06`: check the top risks are detectable/mitigated (duplicate content, hreflang symmetry, language leakage, stale handling, orphan detection, scope-guard, cost).
- Fix architecture issues found **before** scaling.
- **Exit gate:** `06` "verify before scale-up" checklist satisfied on pilot; sign-off to scale.

## PHASE 12 — Scale-up / import
- Only after Phase 11 passes: batch-import the full public dataset by type, priority-tiered (`03` §AC): high-value first (tools, tutorials, roles, then the large prompt corpus).
- Batched, rate-limited (LLM cost/throughput), idempotent, resumable; per-entity/per-locale isolation; publish per locale independently as each passes gates.
- Continuous `04` monitoring; sampling ramps/tapers by stratum failure rate.
- **Exit gate:** target coverage reached per type/locale with gate compliance; dashboards healthy.

## PHASE 13 — Deployment readiness
- Live sitemaps/robots; ISR/on-demand revalidation on publish; monitoring/alerting; analytics events (`01` §21); backup/restore for DB+CMS; runbook for source-sync + re-translation.
- Scheduled **source synchronization** (DISCOVER→DETECT CHANGE→…): detect actual changes (not assume daily), queue re-translation of changed fields only.
- **Exit gate:** production deploy green; post-deploy crawl-sample passes; source-sync job scheduled; rollback tested.

---

## Cross-cutting requirements
- **Resumable/idempotent** at every phase (`ingest_run`, upsert by `content_id`, per-segment isolation).
- **Failure isolation:** locale-independent, page-independent; failures queue, never cascade.
- **Boundary enforcement:** scope-guard in extraction + `04` `scope_guard`/`no_gated_media`; never represent gated content as present.
- **No manual page-by-page QC.**
- **Secrets** via env only.
