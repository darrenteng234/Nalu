# 00 — PHASE 0 VALIDATION

**Scope:** validation ONLY. No build, no DB creation, no import, no scraping, no translation. **No files were modified** during this phase (all recommended changes are proposals below).
**Date:** 2026-09-05.
**Method:** inspected the actual repo (`~/Desktop/NATIVE/Website project/techpresso-clone`), its `package.json`/lockfile/configs/app tree, installed versions, and verified stack compatibility against the live npm registry + Payload source.
**Certainty tags:** [Certain] = verified from repo/registry; [Likely] = strong inference from evidence; [Guessing] = unverified.

---

## 1. Environment status
- [Certain] Repo = untouched cloner template. App tree is a minimal scaffold: `src/app/{layout.tsx,page.tsx,globals.css,favicon.ico}`, `src/components/ui/button.tsx`, `src/lib/utils.ts`, empty `src/{types,hooks}`.
- [Certain] `package-lock.json` present (npm). Deps installed (`next@16.3.0`, `react@19.2.4` confirmed in `node_modules`).
- [Certain] `next.config.ts` → `output: "standalone"`.
- [Certain] Local tooling: `node v25.9.0`, `npm 11.12.1`, `psql` present (`/usr/local/bin/psql`), **no docker** on PATH.
- [Certain] `.nvmrc` = `24`; `engines.node` = `>=24`. **Running Node (25.9) ≠ pinned Node (24).**
- [Certain] No Payload, no `pg` installed yet (expected — not to be added in Phase 0).

## 2. Dependency compatibility
| Dep | Repo | Verdict |
|---|---|---|
| next | 16.3.0 | [Certain] OK |
| react / react-dom | 19.2.4 | [Certain] OK — Next 16.3 peer `react` = `^18.2 || ^19` |
| tailwindcss | ^4 (+ @tailwindcss/postcss) | [Certain] OK |
| shadcn / base-ui / lucide / cva / clsx / tailwind-merge | current | [Certain] OK, presentation only |
| typescript | ^5 | [Certain] OK |
- [Certain] Existing deps are mutually compatible and are a valid base for the product.

## 3. Node compatibility
- [Certain] Next 16.3.0 `engines.node` = `>=20.9.0`. Payload 3.88.0 `engines.node` = `^18.20.2 || >=20.9.0`. **Node 25.9 satisfies both.**
- **FINDING (F1):** Node 25 is an **odd/Current release line — NOT LTS.**
  - **IMPACT:** shorter support/patch window, not recommended for production; possible native-module/tooling rough edges.
  - **EVIDENCE:** `node -v` = v25.9.0; `.nvmrc`=24; Node release policy (odd = non-LTS).
  - **RECOMMENDATION:** pin **Node 24 LTS** (matches `.nvmrc`, LTS since Oct 2025, satisfies Next & Payload). Node 22 LTS is an acceptable fallback. Do NOT silently change; apply via `nvm use 24` + document.
  - **VERIFY:** `node -v` → v24.x before Phase 1; `npm run check` green on Node 24.

## 4. Next.js compatibility
- [Certain] Next 16.3.0 installed; App Router + RSC — matches the source product and our spec.
- [Certain] `@payloadcms/next@3.88.0` peer `next` range **includes `>=16.2.6 <17.0.0`** → Payload stable officially supports Next 16.3.0.
- [Likely] Next 16 is recent; 16.2.6 Payload support is newly added → pin exact versions and watch minor churn (see F7).

## 5. Payload compatibility
- [Certain] **Stable latest = `payload@3.88.0`** (`dist-tags.latest`). Canary `4.0.0-canary.31` exists — **do not use canary.**
- [Certain] `@payloadcms/next@3.88.0` supports Next `>=16.2.6 <17`; `@payloadcms/db-postgres@3.88.0` peers `payload@3.88.0`.
- [Certain] Payload 3 installs **into** the Next app (App Router route group + a `payload.config.ts`), sharing React 19 — compatible with this template's structure.
- **Verdict:** [Certain] **Payload 3.88 + Next 16.3 + Postgres is a supported, GO combination.**

## 6. PostgreSQL compatibility
- [Certain] `@payloadcms/db-postgres@3.88.0` is the official Postgres adapter (Drizzle-based).
- [Certain] `psql` available locally → a dev Postgres path exists for the pilot. No docker (not required).
- [Guessing] local Postgres **server** running/version — not checked (no server started in Phase 0). Verify before Phase 1 pilot.

## 7. Repository / template assessment
- **RETAIN:** Next App Router scaffold, `tsconfig.json`, `eslint.config.mjs`, Tailwind v4 setup, `src/lib/utils.ts`, shadcn `button.tsx`, `next.config.ts` (keep `standalone`), `package-lock.json`.
- **REPLACE:** default `src/app/page.tsx` + `layout.tsx` metadata (become the localized homepage + root layout with `[locale]`).
- **REMOVE / IGNORE (template cruft, not our product):** multi-agent config dirs (`.aider*`, `.amazonq`, `.augment`, `.cline*`, `.codex`, `.continue`, `.cursor`, `.gemini`, `.kiro`, `.opencode`, `.roo`, `.windsurf*`), localized template READMEs (`README.*.md`), `CHANGELOG.md`, the `.claude/skills/clone-website` skill, `AGENTS.md`/`GEMINI.md` template stubs, `docs/research/INSPECTION_GUIDE.md` + `comparison.png`. **Keep** `docs/specs/*` and the `TECHPRESSO_*` recon files.
- **FINDING (F4):** git remote still points at the template repo.
  - **IMPACT:** accidental push to upstream template; wrong history.
  - **EVIDENCE:** cloned from `JCodesMore/ai-website-cloner-template`.
  - **RECOMMENDATION:** `git remote remove origin` (+ add our repo) before Phase 1. Reported, not yet done.
  - **VERIFY:** `git remote -v` shows our repo or none.

## 8. Architecture feasibility (vs `02_CONTENT_SYSTEM.md`)
[Certain] Payload 3 + Postgres can support the Source+Variant model. Mapping:
| Requirement | Mechanism | Verdict |
|---|---|---|
| stable content_id | custom immutable ULID field, unique index | [Certain] OK |
| source entities | `Source*` collections | [Certain] OK |
| language variants | **explicit `Variant` collection keyed (content_id, locale)** | [Certain] OK (see F3) |
| independent publication | per-Variant `status` field + query filter | [Certain] OK via Source+Variant (see F3) |
| translation states | custom enum fields per variant/field | [Certain] OK |
| version history | Payload drafts/versions + `version_history` | [Certain] OK |
| source/translation/localization versions | custom fields + field hashes | [Certain] OK |
| source-change detection | custom hash diff in jobs | [Certain] OK |
| section-level updates | field/block-keyed segments | [Likely] OK (custom logic) |
| redirects | redirects collection / `@payloadcms/plugin-redirects` + slug_history | [Certain] OK |
| canonical / hreflang | computed at render from content_id cluster | [Certain] OK |
| scheduled ingestion | **Payload Jobs Queue** + cron | [Certain] OK |
| failed-job isolation | jobs queue per-task status/retry | [Certain] OK |
| idempotent / resumable imports | upsert by content_id + `ingest_run` | [Certain] OK |
| future languages | Payload `localization.locales` + new Variant rows | [Certain] OK |
| tens of thousands of entities | Postgres + indexes; ISR render | [Likely] OK (see F6/scaling) |

- **FINDING (F3):** Payload's **built-in localization** stores locales as fields **within one document**, and **publish status is per-document, not per-locale**. Our decision-3 (independent per-locale publish) does not map cleanly onto built-in localization alone.
  - **IMPACT:** if we used built-in localization only, we could not publish `ms` while holding `th` — violating decision 3.
  - **EVIDENCE:** Payload localization model (field-level locales, doc-level draft/publish).
  - **RECOMMENDATION:** use the **explicit Source + per-locale Variant collection** design already in `02` §1 (each Variant is its own document with its own `status`). Optionally still enable Payload localization for admin convenience, but the **publish gate is the Variant's own status**. This is a design confirmation, **not a blocker**.
  - **VERIFY:** Phase 1 model test — publish a Variant in one locale while another stays draft; confirm only the published one renders/indexes.

## 9. Translation-system feasibility (vs `03`)
- [Certain] Implementable on this stack: **Payload Jobs Queue** runs the segment→mask→translate(LLM)→unmask→verify→score→route→publish pipeline; states/confidence/versions are custom fields; TM + termbase are collections; human review uses admin UI + status transitions; rollback via version history.
- [Certain] English-pivot, independent per-locale jobs, field-level staleness, section-level re-translation all expressible as jobs keyed by (content_id, locale, field).
- [Likely] LLM calls (Claude) from job handlers are straightforward (server-side fetch); cost/rate controls at queue level.
- **No translation performed.** Feasibility only. **GO.**

## 10. QA-system feasibility (vs `04`)
- [Certain] Data/integrity checks (completeness, scope-guard, duplicate, links, hreflang symmetry, canonical, uniqueness, versions, orphans, slug/lang collisions) = Node scripts over Postgres → runnable in CI + pre-publish + import gates.
- [Certain] Schema validity, metadata, structured-data checks = parse rendered output / entity recipes.
- [Likely] Rendered checks (axe a11y, Lighthouse CI perf, visual snapshot, crawl-sample) run **post-build on fixtures + sample** — standard, CI-compatible.
- **GO.** Machine-readable checks + thresholds are realistic; no page-by-page manual QC required.

## 11. Scheduled-sync feasibility
- [Certain] **Payload Jobs Queue + cron** supports DISCOVER→DETECT CHANGE→…→UPDATE on a schedule; hash-based change detection avoids assuming a fixed source cadence. **GO.**

## 12. Scaling assessment
- [Certain] Rendering: Next SSG + ISR/on-demand revalidation renders 2k→100k pages without per-request cost; sitemaps shard (50k/file + index).
- [Likely] Postgres handles tens of thousands of rows easily with indexes on `(content_id, locale, type, status, slug)`.
- **FINDING (F6):** Payload **admin UI** list/query performance can degrade at very high document counts.
  - **IMPACT:** editor UX slow at 100k+ docs.
  - **EVIDENCE:** general CMS admin behavior at scale [Likely].
  - **RECOMMENDATION:** proper indexes, admin list pagination/filtering, avoid unbounded relationship queries; the editor works on filtered subsets, not the whole corpus. Editors rarely need to scroll all rows.
  - **VERIFY:** Phase 11 load test with a 10× synthetic dataset; measure admin list + query latency.

## 13. Security / access-boundary assessment
- [Certain] Boundary (B1) is enforceable: ingestion reads **public URLs/fields only**; `04` `extract.scope_guard`/`schema.no_fabrication`/`asset.no_gated_media` block gated leakage; no auth/paywall/gated-API access anywhere in the design.
- [Certain] Secrets (DB URL, LLM key) via env only; none committed.
- **FINDING (F1 security angle):** non-LTS Node 25 has a shorter security-patch window → prefer Node 24 LTS for production.
- [Certain] No expansion of the access boundary is required by the architecture. If any future step seems to need gated data, it will be flagged, not assumed.

## 14. Problems discovered (summary)
- **F1** Node 25 is non-LTS → pin Node 24 LTS. (Non-blocking, recommended.)
- **F2** Payload has a canary v4; **must use stable 3.88.x**, not canary. (Guardrail.)
- **F3** Built-in Payload localization ≠ independent per-locale publish → use explicit Source+Variant collections (already in spec). (Design confirmation.)
- **F4** Git remote still the template → detach before Phase 1. (Hygiene.)
- **F5** Next 16 + Payload-16 support are both **very new** → pin exact versions; expect ecosystem churn. (Watch.)
- **F6** Payload admin at 100k docs needs indexing/pagination discipline. (Scale.)
- **F7** [Likely] Bleeding-edge combo (Next 16 + React 19.2 + Payload 3.88 + Tailwind 4) — smaller battle-tested track record than Next 15 + Payload 3. (Risk; mitigated by pinning + pilot.)
- **F8** [Certain] Minor: `tsconfig target ES2017` is conservative but harmless.

## 15. Recommended corrections (all proposals; none applied yet)
1. Pin **Node 24 LTS** (`nvm use 24`; keep `engines`/`.nvmrc` at 24). [do before Phase 1]
2. Adopt **payload@3.88.x stable + @payloadcms/next@3.88.x + @payloadcms/db-postgres@3.88.x** (never canary). Pin exact versions in Phase 1.
3. Confirm **Source + per-locale Variant** collections (per `02`) as the publish-independence mechanism; document that Variant `status` is the publish gate.
4. **Detach template git remote**; remove template cruft (§7) at Phase 1 start.
5. Add DB indexes for `(content_id, locale, type, status, slug)` from the first migration.
6. Keep a **version lockfile discipline** (exact pins) given F5/F7; add a renovate/watch note.
7. Provision a dev Postgres for the pilot (local `psql` or a managed instance) — Phase 1 prerequisite.

## 16. Decisions that genuinely still require Darren
- **D-A [business/legal, non-blocking for Phase 1]:** confirm B1 permission also covers **public-content reproduction + translation on a separate public platform** (already the working assumption; flagged, not assumed further). No architecture depends on expanding it.
- **D-B [ops]:** dev/prod **Postgres hosting** choice (local for pilot vs managed e.g. Neon/RDS/Supabase). Recommend local for pilot, managed for prod. Reversible.
- **D-C [ops]:** **LLM provider/model** for translation (recommend Claude models via API; abstract behind an interface). Needed before Phase 5, not Phase 1.
- Everything else was decided from evidence + best practice.

## 17. Phase 1 prerequisites
1. Node pinned to 24 LTS; `npm run check` green.
2. Template cruft removed; git remote detached/repointed; first project commit.
3. Dev Postgres reachable (`DATABASE_URL`).
4. Exact-pinned Payload 3.88.x + db-postgres + pg added (Phase 1, not Phase 0).
5. Confirm Source+Variant modeling (F3) as the schema baseline.
6. `.env` for `DATABASE_URL` + (later) `LLM_API_KEY` — env only, never committed.

## 18. GO / NO-GO
**GO — conditional on the §15 corrections (primarily: pin Node 24 LTS, use Payload 3.88 stable, adopt Source+Variant for per-locale publish).**
No blocking incompatibility found. The proposed stack (Next 16.3 + React 19 + Payload 3.88 + Postgres + Tailwind 4) is officially compatible and installable. The only "hard stop" avoided was Payload/Next-16 support — **verified present in stable 3.88**.

---

## Additions to `06_ADVERSARIAL_REVIEW.md` (risks the doc missed, found in Phase 0)

- **R15 — Bleeding-edge stack churn.** ASSUMPTION: Next 16 + Payload-on-16 + React 19.2 + Tailwind 4 are stable together. WHY FAIL: Next-16 support in Payload is brand-new (`>=16.2.6`); minor releases may break; fewer community answers than Next 15. DETECT: CI `npm run check` + pinned-version diffs + pilot. MITIGATE: exact version pins, lockfile committed, upgrade only deliberately, keep a Next-15/Payload fallback path documented. VERIFY BEFORE SCALE: pilot builds green and stable across a pin refresh.
- **R16 — Payload localization vs independent publish (F3).** ASSUMPTION: the CMS can publish locales independently. WHY FAIL: built-in localization is doc-level publish. DETECT: model test in Phase 1. MITIGATE: Source+Variant collections with per-Variant status. VERIFY: one locale published while another draft renders correctly + valid hreflang.
- **R17 — Non-LTS Node (F1).** ASSUMPTION: Node 25 is fine. WHY FAIL: non-LTS support/patch window; tooling edge cases. DETECT: `node -v`, CI matrix. MITIGATE: pin Node 24 LTS. VERIFY: green build on Node 24.
- **R18 — Payload admin at scale (F6).** Covered above; add to scaling watchlist.

---

## ADVERSARIAL GATE

**Question:** *"Could this architecture realistically support the first 3 languages and eventually 10+ Asian languages, while growing from ~2,000 public source URLs to tens of thousands of localized entities without requiring page-by-page manual QC?"*

**Answer: YES — conditional on the §15 corrections.**

Specific architectural mechanisms that make it possible:
1. **Data-first Source+Variant model** — pages = template(entity); adding content or a locale is a data/config change, never new hand-built pages.
2. **Per-locale Variant documents with their own status** — independent publication (decision 3) and clean per-locale scaling; adding a locale = adding Variant rows + a locale code.
3. **Field-level versioning + hashes + TM** — source changes re-translate only changed fields; cost and re-work stay proportional to change, not corpus size.
4. **Payload Jobs Queue + cron** — DISCOVER→DETECT→EXTRACT→TRANSLATE→VERIFY→PUBLISH→MONITOR runs as isolated, retryable, resumable, idempotent jobs; one page/locale failure never cascades.
5. **System-level automated QA (`04`) + risk-based sampling (`03` §AC)** — mechanical + many semantic errors caught by machine checks; humans see only failures + a stratified sample → manual effort stays ~flat as pages grow.
6. **Next SSG + ISR + sharded per-locale sitemaps** — rendering and crawlability scale to 100k+ localized URLs without per-request cost.
7. **hreflang clusters keyed by content_id, published-only** — multilingual indexing scales to 10+ locales without link rot.

**Residual conditions to prove at the pilot (Phase 10–11) before scale-up:** translation naturalness per locale (esp. Malay≠Indonesian), thin/duplicate-content thresholds, hreflang symmetry, per-locale independent publish (F3), cost/page measured, and admin performance at 10× (F6).

---

**STOP.** Phase 0 complete. Not proceeding to Phase 1. No build started.
