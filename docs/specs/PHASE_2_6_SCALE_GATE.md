# PHASE 2.6 — SCALE GATE

**Question:** Is the NALU system safe/reliable enough to ingest and translate the full PUBLIC/FREE Techpresso corpus?

## VERDICT: **NOT READY**

Major blockers were removed this phase (real body extraction proven; translation subsystem, field-semantic QA, deletion policy, failure isolation all built + proven). But **two determinants of at-scale correctness remain unproven or externally blocked**, so scaling now is unsafe. Correctly identifying them is the intended Phase 2.6 outcome.

## §31 READY checklist — evidence

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Real public body extraction | **PROVEN (via env browser)** / adapter unverified | review 13,367 chars, tutorial 1,579 (public); Playwright adapter coded, CI-unverified |
| 2 | Scope enforcement | **PROVEN** | `/dashboard` refused; gated Instructions absent from render |
| 3 | Real translation | **NOT PROVEN (blocked)** | no `ANTHROPIC_API_KEY`; provider cannot be validated |
| 4 | Malay localization | **NOT PROVEN** | contamination check works; real MS output untested (no provider) |
| 5 | Thai localization | **NOT PROVEN** | script/spacing checks work; real TH output untested |
| 6 | Vietnamese localization | **NOT PROVEN** | diacritic check works; real VI output untested |
| 7 | Translation QA | **PROVEN (mechanical)** | all seeded defects caught; semantic-equivalence pending provider |
| 8 | Extraction QA | **PROVEN** | completeness gate blocks body-less publish |
| 9 | SEO QA | **PROVEN** | canonical/hreflang-published-only/breadcrumb/sitemap |
| 10 | Failure recovery | **MOSTLY PROVEN** | isolation/idempotency/deletion-guard ✅; DB-interrupt/race code-only |
| 11 | Idempotency | **PROVEN** | re-run no dups; field-level retranslate |
| 12 | Deletion policy | **PROVEN** | transition + mass-deletion guard |
| 13 | Migrations | **BLOCKED (F-A)** | `ERR_REQUIRE_ASYNC_MODULE`; no CLI migration path |
| 14 | Rendered a11y checks | **PARTIAL** | structural a11y present; axe/Lighthouse not run |
| 15 | Adversarial review | **DONE** | teeth proven; blind spots named |
| 16 | No critical unresolved blocker | **FALSE** | #3 (translation) + #13 (migrations) unresolved |

## PROVEN this phase
Real rendered body extraction; per-type contracts + thin-content gate; scope enforcement incl. paywall exclusion; field-aware translation abstraction (English-pivot, protected-token masking, provider behind env); field-semantic translation QA (catches MS/ID contamination, VN diacritics, TH script, leakage, placeholder/protected-token loss — and correctly does NOT flag proper-noun titles); deletion policy with mass-deletion guard; failure isolation + idempotency + field-level retranslation.

## NOT PROVEN / BLOCKED
- **Real EN→MS/TH/VI translation quality** — no provider key (B2 / D-C decision).
- **Production migrations + generated types** — F-A CLI bug (`ERR_REQUIRE_ASYNC_MODULE`).
- **Production Playwright extraction** — proven via env browser, adapter not run in-sandbox.
- **Semantic-equivalence / back-translation**, **terminology memory + drift**, **rendered a11y/perf + Thai/VN visual**, **DB-interruption/race fault injection**.

## BLOCKERS (must clear before READY)
| # | Blocker | Owner |
|---|---|---|
| B2 | Translation provider **API key** + validate real MS/TH/VI on the pilot + native review sample | **DECISION (you): provider + key** |
| F-A | Migrations + type generation blocked by Payload-CLI/Node-24 top-level-await | engineering (in-Next migrate wrapper or tsx-ESM runner) |
| B1-CI | Verify `PlaywrightRenderer` in CI (install Chromium) + run real extraction end-to-end | engineering |

## CONDITIONS (before scale, known fixes)
Semantic-equivalence gate + TM/termbase + drift detection (B3/§12); axe/Lighthouse + Thai/VN visual snapshots (C6); N+1 batching (C1); ISR (C2); sitemap sharding (C3); DB-interruption/race fault tests; full written localization policy encoded as checks.

## DEFERRED
Entity-aware language switcher; category/role hub detail pages; non-AI content types (architecture already generic).

## Path to READY
1. **Decision:** supply translation provider + `ANTHROPIC_API_KEY` (B2).
2. Resolve **F-A** (in-Next migrate wrapper) → committed migrations + generated types.
3. Verify **Playwright** extraction in CI end-to-end (body → structured → publish).
4. Run a **real** EN→MS/TH/VI pilot on the sample; add semantic-equivalence + TM; native-reviewer sample sign-off.
5. Clear conditions (a11y/perf, N+1, ISR, sharding, fault tests).
6. Re-run this gate on a larger sample.

## Answer
**No — not yet.** Scaling now would ship unverified machine translation and lack a production migration path. The architecture is close: real extraction, QA, deletion, and failure handling are proven; the remaining gaps are a provider key (a decision) and the F-A tooling fix.

**STOP.** No bulk ingestion, no bulk translation, no scheduled sync, no brand finalization. Await authorization after B2 + F-A + B1-CI are cleared and the gate is re-run.
