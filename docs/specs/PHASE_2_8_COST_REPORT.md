# PHASE 2.8 — COST REPORT

Measured on the actual Phase 2.8 run (not the prior $0.0008 estimate). Provider Gemini `gemini-3.1-flash-lite`.

## Actual usage (hard numbers)
| metric | value |
|---|---|
| entities translated | 14 (× MS/TH/VI) |
| API calls | 327 (incl. retries) |
| retries | 121 |
| input tokens | 53,946 |
| output tokens | 55,436 |
| avg latency/call | 1,914 ms |
| wall time | 780 s (~13 min) |
| throughput | ~25 effective fields/min |

## By locale
| locale | in tok | out tok | calls |
|---|---:|---:|---:|
| ms | 18,706 | 17,456 | 70 |
| th | 17,620 | 19,098 | 68 |
| vi | 17,620 | 18,882 | 68 |

## Cost (pricing UNVERIFIED)
Rate used: **$0.25 / 1M input, $1.50 / 1M output** — **SPEC-QUOTED, NOT verified against live Google pricing.** Token counts above are the authoritative metric; cost is derived.

| item | value (est.) |
|---|---|
| pilot total | ~$0.097 |
| per entity (×3 locales) | ~$0.0069 |
| **projection 100 entities** | ~$0.69 |
| **projection 1,000** | ~$6.90 |
| **projection full public ~2,056** | ~$14.19 |

**Caveats:** (1) rate unverified — reverify before trusting projections; (2) two prompt pages were capped at 24k chars — untruncated very-long pages raise per-entity tokens/cost; (3) projections are translation-call cost only — exclude re-translation on source updates, semantic-verification passes, and human-review labor; (4) retries (121) inflate calls but Gemini bills tokens, not calls, so retry cost ≈ the retried request's tokens. **Net:** raw translation cost looks low ($10–20 for the full corpus × 3 locales at these rates), but **total cost of ownership is dominated by human review + re-translation, not tokens** — measure those before declaring economics.
