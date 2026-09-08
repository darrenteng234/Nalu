# PHASE 2.6 — ADVERSARIAL REVIEW

Format: **ASSUMPTION → HOW IT FAILS → HOW WE DETECT → CAN THE SYSTEM SELF-CORRECT → HOW WE PROVE IT.**

### A1 — Extraction completeness
- **ASSUMPTION:** HTTP 200 + title ⇒ usable page.
- **FAILS:** RSC bodies absent → thin/empty pages published (2.5 real failure).
- **DETECT:** per-type completeness gate; body-type below `MIN_BODY_CHARS` → EXTRACTION_FAILED.
- **SELF-CORRECT:** yes — item not published, marked retryable; headless render supplies body.
- **PROVE:** review 13,367 chars via render; body-less item blocked. ✅

### A2 — Translation leakage / fluent-but-wrong
- **ASSUMPTION:** LLM output is correct if it differs from English.
- **FAILS:** "different" can still be English-ish, contaminated, or fluent-but-wrong.
- **DETECT:** field-semantic QA — leakage ratio, contamination lexicon, script/diacritic, protected-token integrity. **Meaning-level** errors need back-translation/semantic-equivalence (specified, needs provider).
- **SELF-CORRECT:** partial — mechanical/contamination auto-caught + gated; semantic correctness needs review sampling.
- **PROVE:** seeded-bad caught (ms/vi/th/leakage/placeholder/protected). ✅ mechanical; ❌ semantic (no provider).

### A3 — Malay / Indonesian confusion
- **ASSUMPTION:** "Malay" is one language.
- **FAILS:** provider emits Indonesian vocabulary/grammar.
- **DETECT:** `ms_indonesian_contamination` lexicon; provider prompt names "Malaysian Malay (NOT Indonesian)".
- **SELF-CORRECT:** flags + gates; full grammar-level distinction needs native review sampling.
- **PROVE:** seeded "bisa/gratis" → caught. ✅ (lexicon is a floor, not proof of full nativeness.)

### A4 — Thai rendering / A5 — Vietnamese diacritics
- **DETECT:** `th_no_thai_script`, `th_spacing`; `vi_low_diacritics`. **PROVE:** seeded defects caught ✅. **Untested:** real rendered typography/line-breaking (no axe/visual run) → BEFORE SCALE.

### A6 — Terminology drift
- **ASSUMPTION:** consistent terms across thousands of pages.
- **FAILS:** same English term rendered differently page-to-page.
- **DETECT:** protected-names registry exists; **no persistent approved-term store / drift detector yet.**
- **SELF-CORRECT:** no (not built). **PROVE:** ❌ — REQUIRED BEFORE SCALE (TM/termbase §12).

### A7 — Source updates / A8 — deleted sources
- **DETECT:** field-hash change → targeted retranslate (proven 2.5); discovery diff → `source_missing` + mass-deletion guard (proven 2.6).
- **SELF-CORRECT:** yes for updates; deletions transition (never auto-delete), mass loss aborts.
- **PROVE:** Lumina hash bump → 1 entity retranslated; 1 missing → transitioned; all missing → guard aborted. ✅

### A9 — Duplicate content / A10 — duplicate slugs / A11 — hreflang
- **DETECT:** SEO uniqueness check; unique `(locale,type,slug)` index + collision QA; hreflang cluster published-only.
- **PROVE:** real collision isolated; EN-only page emits only en + x-default. ✅

### A12 — Thin pages
- **DETECT:** completeness/thin-content gate (A1). **PROVE:** ✅.

### A13 — Provider failures / A14 — partial jobs / A15 — race conditions
- **DETECT:** per-item try/catch, throw-not-degrade, idempotent upsert.
- **PROVE:** provider-no-key throws; partial batch isolates (marketers); idempotent re-run. ⚠️ **race conditions + DB-interruption not fault-injected** (code-level only) → BEFORE SCALE.

### A16 — Sitemap correctness / A17 — SEO duplication
- **DETECT:** sitemap = published only; per-locale canonical; uniqueness check. **PROVE:** ✅ pilot; sharding BEFORE SCALE.

### A18 — Accidental gated-content access
- **ASSUMPTION:** we only fetch public URLs.
- **DETECT:** scope guard refuses disallowed prefixes before fetch; headless render only reaches public DOM (tutorial paywall content absent).
- **PROVE:** `/dashboard` REFUSED; tutorial gated Instructions not in render. ✅

## What did our tests fail to test? (honest)
1. **Real translation quality** (no provider/key) — the single biggest unproven risk.
2. **Semantic-equivalence / back-translation** (needs provider).
3. **Terminology memory + drift** (not built).
4. **Rendered a11y/perf + Thai/VN visual layout** (no headless CI here).
5. **Production Playwright extraction** (proven via env browser, not the shipped adapter).
6. **DB-interruption / race-condition fault injection.**
7. **Migrations + generated types** — CLI blocked by F-A (`ERR_REQUIRE_ASYNC_MODULE`); no production migration path yet.

## Verdict
The system **survived real content structurally**, its QA **has teeth** (caught every seeded defect + real failures), and updates/deletions/idempotency/scope are proven. But the two determinants of at-scale success — **real translation quality** and a **production migration/headless path** — are **unproven/blocked**. See `PHASE_2_6_SCALE_GATE.md`.
