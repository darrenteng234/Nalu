# PHASE 2.8 — SCALE GATE

**Question:** Can NALU now safely process a substantially larger public corpus with Gemini, maintaining extraction completeness, MS/TH/VI quality, semantic integrity, SEO correctness, failure isolation, and scalable automated QA?

## VERDICT: **NOT READY**

Not because the machine failed — it largely succeeded — but because the two things that actually determine safe scale are **not yet evidenced**: **native-language quality (no human review yet)** and **production throughput (severe rate-limiting)**. Declaring READY on green automated QA + 200-OK calls is exactly what the phase forbids.

## Evidence by criterion
| criterion | status | evidence |
|---|---|---|
| Real full-body extraction | **PROVEN** | 14/14 complete; bodies 1.1k–108k chars; gated `/dashboard` refused |
| Gated exclusion | **PROVEN** | refused before fetch; paywalled instructions absent from render |
| Real MS translation | **PROVEN (machine)** | 14 entities, full bodies; QA P0/P1 = 0 |
| Real TH translation | **PROVEN (machine)** | QA P0/P1 = 0; 11×P2 spacing (native to confirm) |
| Real VI translation | **PROVEN (machine)** | QA P0/P1 = 0 |
| **Native review** | **NOT DONE** | sample prepared (`PHASE_2_8_NATIVE_REVIEW.md`); no human sign-off — **blocker** |
| Semantic-equivalence QA | **NOT WIRED** | structural/lexical only; back-translation/LLM-judge specified, unbuilt |
| Failure isolation | **PROVEN** | 103×429 → 0 permanent failures; bad-model/timeout isolated |
| Idempotency | **PROVEN** | rerun skips all; semantic change → only affected re-translated; non-semantic (whitespace) → skipped |
| Source updates | **PROVEN** | field-hash (whitespace-normalized): semantic reprocess, non-semantic skip |
| Rate-limit handling | **PROVEN reliable / POOR throughput** | recovered all 429; ~25 fields/min — **won't scale as-is** |
| Cost | **MEASURED, rate UNVERIFIED** | 54k in/55k out tok, ~$0.097 pilot, ~$0.0069/entity; TCO excludes review |
| SEO (localized) | **NOT EXERCISED** | pilot DB-less; translations not rendered |
| Rendered multilingual QA | **NOT EXERCISED** | Steps 13–14 not run this pilot |
| Long-page handling | **PARTIAL** | >24k-char pages truncated — chunking not built |

## Blockers to READY
1. **Native human review** of MS/TH/VI (mandatory) — is Malay truly Malaysian, Thai/Vietnamese natural in technical + long content? Machine cannot certify.
2. **Throughput/quota** — 103×429 at concurrency 2; production needs a higher/paid quota or the **Batch API** + adaptive concurrency.
3. **Semantic-equivalence gate** — wire back-translation/LLM-judge; prove it catches a seeded meaning change.
4. **Long-page chunking** — segment >24k-char bodies without structure loss.
5. **SEO + rendered multilingual QA** — ingest a translated subset into Payload, render at 375/390/768/1024/1280/1440, verify hreflang(published-only)/canonical/slug/JSON-LD/sitemap + Thai wrapping / VN diacritics / Malay length.
6. **Verify live Gemini pricing** before trusting cost projections.

## What IS proven (strong)
End-to-end real full-body pipeline: headless extraction → completeness gate → EN master → direct-pivot MS/TH/VI → field-semantic QA (P0/P1 clean) → failure isolation → idempotency → source-update → resumable unattended runs. The architecture works on genuinely long real content and recovers from heavy provider rate-limiting without data loss.

## Path to READY
Native review (blocker 1) + semantic gate (3) + a throughput plan (2) are the critical three. Then a **larger controlled pilot (~50–100, prompt-page-weighted)** on production quota, with SEO/rendered QA (5) and long-page chunking (4), then re-run this gate.

## HARD STOP
No bulk ingest, no bulk translation, no scheduled sync, no full-corpus publish, no brand change, no Ollama swap. Await explicit authorization after the blockers close and the gate is re-run.
