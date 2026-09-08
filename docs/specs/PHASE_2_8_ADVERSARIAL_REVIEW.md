# PHASE 2.8 — ADVERSARIAL REVIEW

Format: ASSUMPTION → FAILURE MODE → DETECTION → SYSTEMIC FIX → RE-TEST.

### 1. Was the sample truly representative?
- ASSUMPTION: 14 entities across all types represents the corpus. FAILURE: 1–2 per type misses long-tail structural variety (esp. the 1,396 prompt pages). DETECTION: unclassified/extraction-anomaly counters at scale. FIX: extraction contracts + triage queue for unknown shapes; stratified sampling by type at scale. RE-TEST: larger pilot (50–100) weighted to prompt pages.

### 2. Did we actually test long bodies?
- Proven: reviews 10–13k chars translated in full. FAILURE: two prompt pages (108k, 29k) hit the 24k cap → very-long pages NOT fully translated. DETECTION: bodyTranslated < bodyChars flag in results. FIX: **body chunking/segmentation** (translate by section, reassemble) — not yet built. RE-TEST: translate a 100k-char page in segments with structure preserved. **Open condition.**

### 3. Did rate limiting distort results?
- ASSUMPTION: results reflect production behaviour. FAILURE: 103×429 at concurrency 2 → this is a constrained/free tier; throughput (~25 fields/min) won't scale. DETECTION: 429 + throughput metrics (captured). FIX: paid tier / higher quota / **Batch API**; adaptive concurrency. RE-TEST: measure throughput + 429 rate on the intended production quota. **Open condition.**

### 4. Are QA rules detecting real failures?
- Proven (2.7 seeded defects all caught; leakage heuristic fixed). FAILURE: **semantic** errors (fluent-but-wrong meaning) not caught by structural/lexical checks. DETECTION: none automated yet. FIX: back-translation + LLM-judge semantic gate (§28/§38) — specified, **unwired**. RE-TEST: seed a meaning-altering translation (changed number/condition) → must flag. **Open condition.**

### 5. Is Malay truly Malaysian?
- ASSUMPTION: 0 contamination flags = Malaysian. FAILURE: lexicon is a floor; subtle Indonesian grammar/register can pass. DETECTION: contamination lexicon (partial). FIX + RE-TEST: **native Malaysian reviewer** on the stratified sample — **mandatory, pending**. Not certifiable by machine.

### 6. Thai natural in technical content?
- FAILURE: 11×P2 th_spacing flags + technical-register naturalness unknown. DETECTION: script/spacing heuristic. FIX+RE-TEST: **native Thai reviewer**; confirm spacing flags real vs noise. Pending.

### 7. Vietnamese natural in long content?
- VI QA clean, diacritics present. FAILURE: long-prose naturalness/consistency unverified. FIX+RE-TEST: **native Vietnamese reviewer** on a long entity. Pending.

### 8. Semantic checks sensitive enough? — No (see #4). Open condition.

### 9. Underestimating cost?
- ASSUMPTION: ~$14 full corpus. FAILURE: excludes re-translation, semantic-verification passes, human review, untruncated long pages, unverified rate. DETECTION: cost report caveats. FIX: measure review-hours + verification-pass cost; verify live pricing. RE-TEST: cost model incl. human review. **Token cost is not the real cost.**

### 10. Does native review contradict automated QA?
- UNKNOWN — native review not yet done. This is the whole risk: automated green + native fail is exactly the scenario the phase warns about. Cannot close without human evidence.

### 11. Can it run repeatedly without babysitting?
- Proven: resumable cache (survives kill), failure isolation, idempotency, 0 permanent failures under 103×429. FAILURE: 780s for 14 entities unattended is fine; 20k entities at this throughput is not. FIX: quota/Batch (see #3). RE-TEST: unattended larger run on production quota.

## Summary of open conditions (block READY)
- **Native human review** (MS/TH/VI) — mandatory, not done.
- **Semantic-equivalence gate** — specified, unwired.
- **Rate-limit/throughput** — needs production quota / Batch API.
- **Long-page chunking** — >24k pages truncated.
- **SEO + rendered multilingual QA** — not exercised (DB-less pilot).
- **Live pricing** — unverified.
