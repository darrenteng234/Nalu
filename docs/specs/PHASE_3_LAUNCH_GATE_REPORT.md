# Phase 3 — Malay-First Launch Gate: Report

Spec: [PHASE_3_MALAY_FIRST_LAUNCH.md](./PHASE_3_MALAY_FIRST_LAUNCH.md). Scope built:
the minimum EN→MS controlled launch path with hard QA + human-review + publish
gates. No full-corpus ingestion, no TH/VI production, no LIVE-ops, no brand.

## What was built (minimum launch path)

- `src/lib/launch/publish-guard.ts` — pure `assertPublishable` + `canApprove`
  (the launch invariant, unit-testable).
- `src/collections/Variants.ts` — `beforeChange` hook: a non-EN variant may enter
  `published` ONLY from `approved` and ONLY when not stale (guards on the
  transition INTO published, not on later field updates).
- `src/lib/launch/transitions.ts` — `approveVariant` (in_review→approved; refuses
  QA-blocked mt_generated), `publishVariant` (approved→published), `unpublishVariant`,
  `markStaleForSource`. All write `activity-log`.
- `src/lib/launch/translate-article.ts` — `generateMsVariant`: real provider
  (`getTranslator`→Gemini) with in-app retry, writes MS at `mt_generated`, runs
  the gate, advances to `in_review` (clean) or holds. Never publishes.
- `src/lib/launch/gate.ts` — ordered gate: deterministic + structural QA +
  semantic QA + SEO + termbase. P0 → block.
- `src/lib/translate/retry.ts` — in-app exponential backoff (429/5xx/network) +
  `mapLimit` concurrency (≤2).
- `src/lib/launch/termbase.ts` — minimum MS termbase (prompt→gesaan, free→percuma,
  download→muat turun, …) applied at prompt + asserted in QA.
- `src/lib/launch/config.ts` — `LAUNCH_LOCALES=["en","ms"]`; architecture keeps
  `["en","ms","th","vi"]` (locales.ts untouched).
- `src/lib/pipeline/index.ts` — FIXED the Phase-2 defect where translated locales
  were written straight to `published`; they now go through approved→published.
- `src/app/launch/verify/route.ts` — 30-case regression suite (seeded failures).
- `src/app/launch/prove/route.ts` — rendered-proof driver (real Gemini + fixture).

## Step 2 — audit of 2.10 carry-over state

| # | Item | Verdict | Evidence / note |
|---|------|---------|-----------------|
| 1 | Real Gemini translation integrated with Payload content | **PASS** | `generateMsVariant` uses `getTranslator`; real MS produced (title "Menulis Gesaan AI…") |
| 2 | Real translated content renders through frontend | **PASS** | `/ms/articles/phase3-malay-first-demo` → 200, Malay body, screenshot |
| 3 | Multilingual SEO/hreflang/canonical output | **PASS** | alternates en/ms/x-default only; MS excluded while hidden; canonical self |
| 4 | Long-document chunking + reassembly | **PASS** | `chunker.ts`; regression `chunk.roundtrip.lossless` |
| 5 | Cross-chunk terminology consistency | **PARTIAL** | minimum termbase added + asserted; not yet applied per-chunk during a real long-body run |
| 6 | Gemini Batch API abstraction/readiness | **PARTIAL** | `translateBatch` interface present (sequential); real Batch API deferred (not needed for controlled launch) |
| 7 | Production-safe migrations | **FAIL/BLOCKER** | Payload CLI `ERR_REQUIRE_ASYNC_MODULE` (Node24+lexical TLA); no migrations dir |
| 8 | Payload generated types | **FAIL/BLOCKER** | same F-A; no `payload-types.ts` (code uses scoped `any`) |
| 9 | Translation memory / termbase | **PARTIAL** | minimum termbase (config + assert); full TM not built |
| 10 | Native human-review workflow | **PARTIAL** | states + gates enforce a hard stop; a native MS reviewer is an EXTERNAL dependency |
| 11 | Rollback / retranslation behaviour | **PASS** | `unpublishVariant`, `markStaleForSource`, stale re-publish blocked |
| 12 | Rate-limit/retry/idempotency | **PASS** | in-app `withRetry`/`mapLimit`; regression `retry.*`, `idempotency.*`; 429 failed clean (no partial write) |
| 13 | Cost tracking | **NOT VERIFIED** | events logged to activity-log; token/cost per call NOT yet recorded |

## Step 5 — rendered proofs (real frontend)

1 EN 200 · 2 MS 200 (Malay) · 3 EN-only (MS `in_review` → 404 hidden) ·
4 EN+MS both 200 · 5 MS draft hidden · 6 MS QA-fail publish blocked ·
7 MS review-required (`try-publish` from in_review → REJECTED) ·
8 approved→published allowed (200) · 9 EN change → MS `stale:true`, stale
re-publish blocked · 10 canonical+hreflang correct (MS excluded while hidden).

## Step 6 — regression suite

`GET /launch/verify` → **30/30 pass (HTTP 200)**. Seeded failures the suite
CATCHES: dropped/invented/mutated numbers, date mutation, placeholder leak,
untranslated body, semantic non-equivalence (may→will), Indonesian contamination,
termbase drift, missing SEO title, publish-from-unreviewed, publish-from-QA-fail,
stale publish, approve-a-QA-blocked-variant.

## Step 7 — adversarial review (systemic fixes, not one-offs)

| Attack | Result |
|--------|--------|
| bad translation returned | QA layers flag; P0 blocks (regression) |
| missing translation field | `empty_field` P0 |
| malformed / partial structured output | translator throws "non-JSON" → transient/retry or clean fail; never written |
| 429 / rate limit | `withRetry` backoff; observed real 429 → retried → failed clean, **no partial write** |
| duplicate retry | unique `(contentId,locale)` index + upsert; idempotent |
| changed source after translation | `markStaleForSource` → `stale:true` |
| stale accidentally published | hook blocks entering-published when stale (proof + regression) |
| MS published while QA failed | **FIXED** — pipeline no longer auto-publishes; hook requires `approved`; `approveVariant` refuses `mt_generated` |
| protected-token corruption | mask/restore + QA `protected_name_lost`; `placeholder_leak` P0 in gate |
| number/date mutation | `numberIntegrity` P0 (whole-document) |
| HTML/JSON-LD corruption | page renders; JSON-LD emitted by template, not translated (masked) |
| chunk-boundary terminology drift | termbase assert (`term_inconsistent`) |
| reviewer rejects after approval | `unpublishVariant` withdraws publication |
| simultaneous publish attempts | hook re-checks `approved`+fresh on each write; unique index |
| failed DB write after translation | write ordered before gate; failure isolated + logged; no publish |
| accidental locale mass publication | no path writes non-EN `published` except approved→published |

Two systemic holes were found DURING this review and fixed: (a) `approveVariant`
could rubber-stamp a QA-blocked variant → added `canApprove`; (b) the publish hook
fired on every update of a published variant, so `markStaleForSource` threw →
scoped the guard to the transition INTO published.

## Step 8 — launch gate

Criteria surfaced in `/ops` (real, not a vanity %): Phase 3 = 14/17.

- **PASS**: AC1–AC13, AC16 (13 mandatory + 1 should) — all proven with evidence.
- **PARTIAL**: cross-chunk termbase at real-long-body scale; Batch API; full TM.
- **NOT VERIFIED**: AC17 cost/usage per real call.
- **FAIL / BLOCKER**: AC15 production-safe migrations + generated types (F-A).
- **BLOCKERS (launch cannot be declared READY until cleared)**:
  1. **AC14 — native Malaysian-Malay human review** (external; no reviewer simulated).
  2. **AC15 — production-safe migrations + `payload-types.ts`** (F-A: Node24 +
     lexical top-level-await breaks the Payload CLI).

**Launch gate verdict: NOT READY** — the machinery is proven end-to-end, but two
mandatory criteria are unmet. The Malay-first path is correct and safe by design
(MS never public without human approval); it is not launchable until a native
reviewer signs off and a production migration path exists.

## Exact next action

Resolve the migration/type blocker (F-A): pin a Payload-CLI-compatible run
(e.g. a Node/loader combo without the lexical TLA failure) so `payload
migrate:create` + `generate:types` run, producing `payload-types.ts` and a
checked-in initial migration — then re-verify AC15. In parallel, route one real
MS article to a native Malaysian reviewer for AC14. STOP; do not begin
full-corpus ingestion, Thai, Vietnamese, or LIVE-ops.

## Environment note (new)

The active shell node is `/usr/local/bin/node` v25 **x64** (Rosetta); the project
pins Node 24 and the machine is arm64. Builds/dev MUST run with
`~/.nvm/versions/node/v24.15.0/bin` on PATH (arm64) — otherwise
`next build`/`dev` fail on the `lightningcss.darwin-x64.node` native binary.
