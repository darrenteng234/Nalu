# PHASE 2.9 — ADVERSARIAL REVIEW

Format: ASSUMPTION → FAILURE MODE → DETECTION → SYSTEMIC FIX → VERIFICATION. Evidence in `PHASE_2_9_PROOFS.json` + `scripts/phase29-proofs.mts` (permanent regression suite).

### 1. Native sample representative enough?
- ASSUMPTION: a stratified sample validates all locales. FAILURE: 1–2 examples/type miss systematic errors in the 1,396-prompt long tail. DETECTION: recurring-correction log from reviewers (not yet collected). FIX: convert every recurring reviewer correction → prompt/termbase/QA/routing rule; raise sampling on new patterns. VERIFY: **BLOCKED — no human reviewers engaged.** Cannot close by machine.

### 2. Semantic QA strong enough?
- ASSUMPTION: structural QA catches meaning errors. FAILURE: fluent-but-wrong (number/modal/omission). DETECTION: NEW semantic gate — deterministic number/date integrity + LLM-judge. FIX: `semantic-qa.ts`. VERIFY: seeded $20→$200, 5→4, 2026→2025 caught deterministically; may→will + dropped-condition caught by judge; faithful passed. ✅

### 3. Can long pages silently lose content?
- ASSUMPTION: whole-field translation. FAILURE: 2.8 truncated a 108k page at 24k. DETECTION: `bodyTranslated < bodyChars`. FIX: `chunker.ts` — section-aware split + `verifyNoLoss`. VERIFY: 107,991-char page → 16 chunks, **lossless**, reassembles in order; index gap/dup detection. ✅

### 4. Can chunk boundaries change meaning?
- ASSUMPTION: independent chunks preserve meaning. FAILURE: cross-chunk context/terminology drift. DETECTION: per-chunk QA + terminology check. FIX: split on paragraph/section (not fixed-N), keep terminology via termbase; **cross-chunk semantic check not yet run per-document**. VERIFY: **PARTIAL** — no-loss proven; cross-chunk terminology consistency at scale unproven → condition.

### 5. Gemini quality varies by content type?
- ASSUMPTION: uniform quality. FAILURE: technical/prompt/long content may degrade. DETECTION: per-type QA (2.8: all types P0/P1=0; TH 11×P2 spacing). FIX: type-aware prompts + native review per type. VERIFY: machine-clean per type; **native per-type quality unverified** → blocker.

### 6. Are 429 retries hiding an unsuitable quota tier?
- ASSUMPTION: retries = healthy. FAILURE: 2.8 had 103×429; 2.9 conc3 → 12×429 and throughput DROPPED. DETECTION: throughput probe. FIX: **concurrency 2 is the stable ceiling** (conc2 ~54/min 0×429; conc3 worse); adopt **Batch API** for scale. VERIFY: probe recorded. ✅ (finding: current tier is rate-limited; Batch needed for scale.)

### 7. Is Batch actually more appropriate?
- ASSUMPTION: standard calls scale. FAILURE: standard hits 429 + costs 2×. DETECTION: pricing + throughput. FIX: Batch API (verified $0.125/$0.75 = half cost, async, higher limits). VERIFY: pricing confirmed; **Batch not yet implemented** → condition.

### 8. Cost estimate realistic?
- ASSUMPTION: ~$14 full corpus. FAILURE: excludes review + re-translation + verification passes + untruncated long pages. DETECTION: verified pricing (std $0.25/$1.50; batch half). FIX: separate API cost (small) from review cost (dominant). VERIFY: API cost verified; **review-hour cost unmeasured** (needs #1) → the real economic unknown.

### 9. Does machine QA correlate with human review?
- ASSUMPTION: green machine QA ≈ good. FAILURE: they may diverge. DETECTION: the §8 native-vs-machine table. FIX: improve QA from every human-caught-but-machine-missed case. VERIFY: **BLOCKED — table empty, no human review.**

### 10. Can multilingual pages render correctly?
- DETECTION: rendered QA. FIX: shared components + tokens. VERIFY: TH + VI render natively at mobile (script wraps, VN diacritics correct); head SEO correct (lang, self-canonical, published-only hreflang, JSON-LD). ✅ on seed content. **Real-Gemini-content render (ingest 2.8 outputs → DB → render) not yet done** → condition. Minor: shared-nav top spacing at 375px.

### 11. Can automated QA detect recurring language-specific failures?
- VERIFY: regression suite proves MS-Indonesian, TH-no-script, VN-diacritics, protected-token, placeholder detection (8/8 fixtures). ✅ Leakage heuristic fixed (stop-word density, not Latin ratio).

### 12. Is manual review still scalable?
- ASSUMPTION: risk-based sampling keeps review flat. FAILURE: if machine QA misses a class, sampling misses it too. DETECTION: stratum failure-rate feedback. FIX: raise sampling where machine+human disagree. VERIFY: **needs #1/#9 data** — unproven.

## Net
Engineering blockers from 2.8 are **closed** (semantic gate, chunking, throughput characterized, pricing verified, regression suite, rendering system). The **unclosable-by-machine** items remain: **native human review** (#1/#5/#9/#12) and **real-content render integration + Batch** (#7/#10). These set the scale gate.
