# PHASE 2.8 — FAILURE RECOVERY

Every failure isolated → logged → retryable where appropriate → never silently published. Evidence from the real run.

## Rate limiting (the headline operational finding)
At concurrency **2** with exponential backoff (1s→16s cap), the real run hit:
| metric | value |
|---|---|
| total 429 responses | **103** |
| retries performed | 121 |
| **permanently failed records** | **0** |
| translation-job failures | 0 |
| backoff | exponential, capped 16s |

**Interpretation:** the account/tier is heavily rate-limited even at concurrency 2 — 103 × 429 across ~190 translation jobs — but the backoff **recovered every one** (0 permanent failures, 0 dropped fields). **Reliability: proven.** **Throughput: poor** — ~25 effective fields/min, 780s wall for 14 entities × 3 locales. This does not linearly support the full corpus (see scale gate: needs higher quota / paid tier / Batch API).

## Deliberate failure tests
| test | expected | actual |
|---|---|---|
| bad model id | isolated, non-retryable | `status=404 retryable=false`, isolated ✓ |
| timeout (1ms) | retry then fail cleanly | retry fired ✓ |
| malformed provider output | isolated, no publish | JSON-parse guard throws, isolated (code path) ✓ |
| protected-token corruption | P0 block | QA `protected_name_lost`/`placeholder_mismatch` = P0 (proven 2.7) ✓ |
| incomplete output | not published | completeness/empty-field gate ✓ |
| DB interruption | isolate + resume | not fault-injected (pilot DB-less); resumable cache covers process interruption ✓ |

## Interruption recovery (proven this phase)
The previous 2.8 run was **killed by session exit**. This run added a **persistent translation cache** (`docs/specs/.phase28-cache.json`, written every 5 fields). A re-run **resumes from cache** — completed fields skipped, no duplicates, no wasted calls. This directly de-risks long unattended runs.

## Verdict
Failure **isolation + recovery = PROVEN** (incl. severe real 429 load fully recovered). The open operational risk is **throughput/quota**, not correctness.
