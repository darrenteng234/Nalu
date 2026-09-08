# PHASE 2.8 — REAL FULL-BODY MULTILINGUAL PILOT

**Date:** 2026-09-07. **Provider/model:** Gemini `gemini-3.1-flash-lite` (configurable). **Boundary:** public content only; gated refused; no source bodies reproduced here (metrics only). **Build:** green. **Brand:** untouched.

## Sample (15 entities, every public type + varied complexity)
Selected for structural + complexity diversity, not ease. 14 publishable + 1 gated control.

| type | body chars (real, rendered) | body translated | FAQ | completeness |
|---|---:|---:|---:|---|
| tool | 1,143 | 1,143 | 0 | complete |
| tutorial | 1,521 | 1,521 | 0 | complete |
| tutorial | 1,615 | 1,615 | 0 | complete |
| review | **13,326** | 13,326 | 7 | complete |
| review | **10,499** | 10,499 | 7 | complete |
| compare_tools | 3,763 | 3,763 | 6 | complete |
| compare_platform | 3,499 | 3,499 | 3 | complete |
| prompt_page | **107,991** | 24,000 (cap) | 5 | complete |
| prompt_page | 28,566 | 24,000 (cap) | 5 | complete |
| collection | 9,619 | 9,619 | 0 | complete |
| role_page | 6,850 | 6,850 | 5 | complete |
| free_tool | 2,816 | 2,816 | 5 | complete |
| blog_post | 6,181 | 6,181 | 0 | complete |
| community_post | 2,829 | 2,829 | 0 | complete |
| `/dashboard` (gated) | — | — | — | **REFUSED** |

**Long-form genuinely tested** (Step 6): reviews ~10–13k chars translated in full; two prompt pages hit the 24k safety ceiling (107,991-char page truncated) — a real finding: very long list pages need a chunking/segmentation strategy before scale (see Adversarial R-Long).

## Extraction evidence (headless, real body)
Every entity: source URL, page type, source hash, retrieval time, extracted field count, body char count, completeness, gated-exclusion recorded in `PHASE_2_8_PILOT_RESULTS.json`. `PlaywrightRenderer` (shipped adapter) rendered RSC bodies; raw-fetch metadata + rendered body combined. Gated `/dashboard` refused before fetch. **0 extraction failures; 14/14 completeness = complete.**

## English-master validation
Title/description/body/headings/FAQ validated per completeness contract before translation; body-bearing types required a real body (≥250 chars). No incomplete master was translated.

## Translation
Direct pivot EN→MS/TH/VI (no relay), field-aware, protected-token masking, structured JSON output. **0 translation-job failures.** Full field set: title, summary, body (body-types), FAQ. Results + per-entity QA in `PHASE_2_8_PILOT_RESULTS.json`; native samples in `PHASE_2_8_NATIVE_REVIEW.md`.

## Status
Machine pipeline end-to-end PROVEN on real long-form content. **Native-language human review = PENDING (mandatory, not yet done).** SEO + rendered multilingual QA (Steps 13–14) **not exercised** this run (pilot is DB-less; translations not rendered through the site). See scale gate.
