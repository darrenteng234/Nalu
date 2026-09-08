# PHASE 2.11 — NALU OPERATIONS DASHBOARD (Spec)

**Status:** architecture spec → then MINIMUM MVP. Not an enterprise dashboard. **Principle:** AUTOMATION FIRST → EXCEPTIONS SECOND → MANUAL CONTROL WHERE NEEDED. The dashboard surfaces the ~50 exceptions out of 1,000, never 1,000 click-throughs.

## 1. Purpose & modes
One dashboard, two modes off the same data:
- **BUILD MODE** (now): objective project progress from tracked tasks + acceptance criteria; TODAY list; blockers; next action; recent activity.
- **LIVE MODE** (post-launch): content pipeline control — content states, per-locale translation states, source-sync, QA queues, automation-vs-manual metrics.

## 2. Progress calculation (defensible, never subjective)
Progress = **acceptance criteria passed / total**, per phase/area. No mood percentages.
`Phase 2.9: 8/15 criteria passed → 53.3%`. Overall = Σ passed / Σ total across active phases (or weighted by area). Every number traces to a criterion row with a pass/fail + evidence link.

## 3. Data model (Payload collections; not hardcoded in the frontend)

### `phase-tasks`
Drives BUILD mode. Fields: `phase` (e.g. "2.9"), `area` (translation|seo|qa|extraction|infra|dashboard|launch), `title`, `status` (`todo|in_progress|blocked|done`), `priority` (`high|medium|low`), `blockedBy` (text/relation), `evidence` (url/text), `updatedAt`. TODAY/BLOCKERS/NEXT are **queries over this**, not stored lists.

### `acceptance-criteria`
Fields: `phase`, `area`, `criterion` (text), `result` (`pass|fail|not_verified`), `evidence`, `updatedAt`. Progress % is computed from these. `not_verified` counts as not-passed (honest).

### `activity-log`
Append-only. Fields: `ts`, `actor` (`system|editor:<id>`), `action`, `entity` (contentId/collection), `locale?`, `detail`, `outcome` (`ok|failed|review_required`). Powers "recent activity" + the automation-vs-manual metric.

### Content authoring — reuse Source+Variant (no new page type)
`article` is a first-class **content type** in the existing Source+Variant model (not a separate hardcoded page):
- **Source** (`type: "article"`): contentId, category ref, tags, author, dates, relationships, sourceVersion.
- **Variant** (per locale): title, slug, excerpt(summary), body(sections), heroImage(media), seoTitle, seoDescription, canonical(derived), status. **Per-locale independent publish** (decision 3) — EN and MS publish independently; TH/VI can be `not_started`.
- Renders through the **same reusable detail/article template** as imported content. Authoring is done in Payload admin → **no Claude call required** (§4).

### Translation status (derived, not stored)
Per contentId, per locale, from the Variant state machine (docs/specs/03 §16): `not_started | pending | translating | qa_failed | review_required | ready | published | stale`. The dashboard reads Variant `status` + `translation.stale`; it does not maintain a parallel status store.

## 4. Content authoring workflow (Claude-free)
`Create (admin form) → Save Draft → Validate (required fields + SEO checks) → Preview → Publish`. Validation + SEO metadata generation run as Payload hooks / QA checks — **no LLM is a mandatory dependency** for ordinary authoring. Optional AI assist may be added later behind a flag. Publishing requires the state gate (§QA); a worker/editor cannot write directly to `published`.

## 5. Locale workflow (Malay-first)
Launch is **independent per locale** — no requirement for EN+MS+TH+VI together.
`EN canonical → MS → LAUNCH 1` · then `TH → LAUNCH 2` · then `VI → LAUNCH 3`. Architecture supports all four from day one; publication is independent. New article flow: `EN → MS → QA → publish` now; `TH/VI` added later per article via the automated pipeline (editor clicks "Start", the worker + QA run — **no manual copy-paste between fields**).

## 6. QA state (LIVE mode)
Queues by severity from QA runs: `P0 | P1 | P2 | P3` + `review_required`. Dashboard shows counts + links to the exception items only. Publishing blocked while P0/required-P1 open (per `03` §35).

## 7. Automation-vs-manual metric (real, not vanity)
Computed from `activity-log`: `automated` = actions with `actor=system` & `outcome=ok`; `manual` = actions with `actor=editor:*` (reviews/edits/manual publishes); `failed`/`retried` from outcomes. Shows today + this-week. If no job records exist yet, show 0/0 honestly — never fabricate.

## 8. Dashboard screens (MVP = first two only)
MVP: **Build Progress** + **Today/Blockers/Next**. Then (post-approval): Content, Translation (per locale), QA, Source-Sync, SEO, System. Nav tree documented but built incrementally. Server-rendered, token-driven (neutral tokens; **no brand**), read-mostly; actions are explicit + confirmed.

## 9. Permissions & audit
- Roles: `admin` (all), `editor` (author + submit, cannot bypass publish gate), `reviewer` (approve/reject in review queue), `viewer` (read). Payload access control per collection.
- Every state transition + publish + review writes to `activity-log` (audit). Mass actions require an explicit confirm + are rate-limited (§adversarial).

## 10. Scalability
- Dashboard queries are **aggregate/paginated** (counts via grouped queries, exception lists paginated + filtered) — never load all rows. Indexes on `(status)`, `(locale,status)`, `(type)`, `(contentId)`, `activity-log(ts)`.
- The dashboard shows **exceptions + aggregates**, so cost is O(exceptions), not O(corpus). At 100k records it renders counts + the (small) review queue, not 100k rows.

## 11. Adversarial requirements (enforced in MVP)
- **No misleading progress:** % only from acceptance criteria; `not_verified`≠pass; every % shows its `n/total`.
- **No stale TODAY:** derived live from task statuses each load, not a stored checklist.
- **No QA bypass via manual entry:** authored articles pass the same validate→SEO→publish gate; `status=published` only via the gated transition.
- **No accidental untranslated publish:** a locale publishes only when its Variant reaches `ready/published`; the UI never publishes an empty/`not_started` locale.
- **No slow queries at scale:** aggregates + pagination + indexes (§10).
- **No accidental mass actions:** bulk operations require explicit confirm + are logged + rate-limited.
- **Dashboard ≠ manual-QC bottleneck:** surfaces exceptions only; the happy path is fully automated.

## 12. Build order (this phase)
1. This spec. 2. `phase-tasks` + `acceptance-criteria` + `activity-log` collections. 3. Seed real current tasks/criteria. 4. `article` content type wired to the reusable template. 5. Minimal `/ops` Build dashboard (progress + today + blockers + next) reading the model. 6. Translation-status read (per content, from Variants). 7. Checks (lint/typecheck/build/runtime/a11y) + adversarial. **STOP at MVP.**

## 13. Out of scope (MVP)
LIVE-mode Content/QA/Source-Sync/SEO/System screens (documented, built later); AI-assisted authoring; bulk action UIs; brand. No full-corpus ingestion.
