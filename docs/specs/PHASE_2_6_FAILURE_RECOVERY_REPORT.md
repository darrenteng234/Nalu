# PHASE 2.6 — FAILURE RECOVERY REPORT

Principle (§21): one failed item ≠ whole-batch failure; retries safe. Evidence from pilot runs + code paths.

| # | Failure | Test | Expected | Actual | Pass | Evidence |
|---|---|---|---|---|---|---|
| 1 | Extraction failure (no body) | body-type below MIN | EXTRACTION_FAILED, not published, retryable | completeness gate → EXTRACTION_FAILED; no publish | ✅ | `contracts.checkCompleteness` |
| 2 | Variant write failure (slug collision) | real `marketers` vs synthetic | item isolated; Source→`error`; batch continues | 1 isolated, 8 succeeded; Source `ingestStatus=error` | ✅ | 2.5/2.6 ingest logs |
| 3 | Duplicate slug | unique `(locale,type,slug)` | rejected, isolated | ValidationError isolated | ✅ | ingest |
| 4 | Missing source | relationship target absent | render omits; QA P2 unresolved (not crash) | omitted; P2 | ✅ | `getRelated` + qa |
| 5 | Provider not configured | no API key | validate=false; translate throws (no silent bad output) | `ClaudeTranslator` throws; `getTranslator` → mock | ✅ | translator |
| 6 | Provider HTTP error | non-200 from API | throw, item isolated, retryable | `translate` throws on `!res.ok`; caught per item | ✅ (code path) | translator |
| 7 | Malformed translation | seeded bad output | QA P0/P1 blocks publish | translationQa flags; publish gated | ✅ | phase26-tests |
| 8 | Source removed | discovery diff | no auto-delete; → `source_missing`; guard on mass loss | 1 missing → transitioned; all missing → **mass-guard aborted** | ✅ | `reconcileRemovals` |
| 9 | Partial batch failure | one of N items throws | others complete | per-item try/catch in pipeline + translateBatch sequential isolation | ✅ | pipeline/translator |
| 10 | Retry after failure | re-run | idempotent upsert; errored item retried; no dup | re-run → same set, no duplicates; errored retried | ✅ | 2.5/2.6 idempotency |
| 11 | DB interruption | connection drop mid-run | item fails + isolates; re-run resumes (upsert) | code-level (per-item try/catch + upsert-by-id); **not fault-injected in-sandbox** | ⚠️ code-only | pipeline |

## Idempotency (§22)
- Re-run pilot ingest → same records, **no duplicates** (upsert by contentId / (contentId,locale)). Evidence: 2.5 re-run (published 0 / skipped 40); 2.6 re-ingest stable.
- Change one English field → only affected fields reprocess (field-hash change → sourceVersion bump → targeted). Evidence: 2.5 Lumina hash bump → only that entity re-translated (36 skipped).

## Gaps
- **#11 DB-interruption not fault-injected** (no easy way to sever the local DB mid-write here); relies on per-item isolation + idempotent upsert by design. REQUIRED BEFORE SCALE: a real fault-injection test in CI.
- **#6 provider HTTP error** is a verified code path, not a live API failure (no key). Re-verify once B2 wired.
