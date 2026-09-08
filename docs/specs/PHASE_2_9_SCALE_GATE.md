# PHASE 2.9 — SCALE GATE

**Question:** Is the NALU translation + content-processing system now safe to scale from the controlled pilot to the full public/free corpus?

## VERDICT: **NOT READY**

Every *engineering* blocker from Phase 2.8 is closed. The gate holds **NOT READY** on one thing a machine cannot self-certify — **native-language human review** — plus two integration/ops conditions (render real translated content end-to-end; adopt Batch/concurrency-2 for throughput). "Never force READY": machine-green QA is not evidence of native quality.

## §14 criteria — evidence
| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Long bodies translated without truncation | **PROVEN** | 107,991-char page → 16 chunks, lossless reassembly (`chunker.ts`) |
| 2 | Semantic QA works | **PROVEN** | number seeds ($20→$200, 5→4, 2026→2025) caught deterministically; may→will + dropped-condition caught by LLM-judge; faithful passed (`semantic-qa.ts`) |
| 3 | Native review acceptable | **NOT DONE (blocker)** | sample prepared; **no human reviewers engaged** — machine cannot certify |
| 4 | MS genuinely Malaysian | **NOT VERIFIED** | 0 contamination flags (floor only); needs native MS reviewer |
| 5 | TH natural | **NOT VERIFIED** | machine clean + renders; 11×P2 spacing; needs native TH reviewer |
| 6 | VI natural | **NOT VERIFIED** | machine clean, diacritics correct + render; needs native VI reviewer |
| 7 | 429 operationally manageable | **CHARACTERIZED** | conc2 ~54/min 0×429 (stable ceiling); conc3 → 12×429 worse; Batch API available (halves cost) — **adopt before scale** |
| 8 | Pricing verified | **PROVEN** | Google page 2026-09-07: std $0.25/$1.50, batch $0.125/$0.75 per 1M; corpus ≈ $14 std / ~$7 batch (API only) |
| 9 | Rendered multilingual QA | **PROVEN (system) / PARTIAL (real content)** | TH+VI render natively at mobile; shared components hold; real-Gemini-content not yet ingested+rendered |
| 10 | Rendered SEO | **PROVEN** | `<html lang>`, self-canonical, published-only hreflang+x-default, JSON-LD per type — from rendered HTML |
| 11 | Failure isolation | **PROVEN** | 2.8: 103×429 → 0 permanent failures; bad-model/timeout isolated |
| 12 | Idempotency | **PROVEN** | rerun skips; semantic change → only affected; whitespace change → skipped; persistent resumable cache |
| 13 | Source updates | **PROVEN** | field-hash (normalized): semantic reprocess, non-semantic skip |
| 14 | Regression tests exist | **PROVEN** | `scripts/phase29-proofs.mts` — 8/8 fixtures (MS-Indonesian, TH-script, VN-diacritics, protected-token, placeholder) + semantic + chunking; run on any model/prompt/termbase/QA/chunking change |
| 15 | Review burden scalable | **NOT VERIFIED** | depends on #3/#9 data (machine-vs-human correlation) — not yet measurable |

## Closed this phase (engineering)
Semantic-equivalence gate (deterministic + LLM-judge, separate from structural QA); section-aware lossless chunking for >24k pages; throughput characterized (conc 2 = stable max) + Batch identified; **pricing verified**; permanent regression suite; rendered multilingual + SEO QA on the shared system.

## Blockers to READY
1. **Native human review** (MS/TH/VI) across the stratified sample — the fundamental, machine-unclosable one. Feed every recurring correction back into prompt/termbase/QA/routing rules (§1). Build the §8 machine-vs-human table.
2. **Render REAL Gemini-translated content end-to-end** — ingest a translated pilot subset into Payload, render + SEO-check at 375/390/768/1024/1280/1440 (currently proven on seed content only).
3. **Adopt Batch API + concurrency-2** as the scale execution mode (throughput + half cost); cross-chunk terminology consistency check for chunked long docs.

## Minor
Shared-nav top spacing at 375px (one shared-component fix). `th`/`vi` seed slugs are English while `ms` is localized — decide slug-localization policy per locale before scale.

## Answer
**No — not yet safe to scale.** The pipeline is now technically strong end-to-end (extraction, chunked long-form translation, semantic + structural QA, failure isolation, idempotency, verified cost, multilingual render/SEO). But scaling a translation platform without **native-quality human validation** would risk shipping fluent-but-wrong or subtly non-native content across thousands of pages — precisely what this gate exists to prevent.

## HARD STOP
No bulk ingest, no bulk translation, no scheduled sync, no full-corpus publish, no brand change, no Ollama swap. Await explicit authorization after native review + real-content render + Batch adoption, then re-run this gate.
