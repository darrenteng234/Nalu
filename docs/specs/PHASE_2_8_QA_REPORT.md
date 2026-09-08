# PHASE 2.8 — QA REPORT

Authoritative checks (`03` + `04`), field-semantic (not naive Latin-script leakage). Run over all 14 entities × MS/TH/VI on full bodies.

## Automated results
| locale | entities | P0 | P1 | P2 |
|---|---:|---:|---:|---:|
| ms | 14 | **0** | **0** | 0 |
| th | 14 | **0** | **0** | 11 |
| vi | 14 | **0** | **0** | 0 |

**Zero P0/P1 across all locales.** TH: 11× P2 `th_spacing` (heuristic flags Latin-style spacing around Thai runs — informational; native reviewer to confirm real vs noise). Translation-job failures: **0**.

## Checks exercised
English-leakage (English **stop-word density**, script-independent — fixed from the Phase-2.7 Latin-ratio false positive), Malay/Indonesian contamination lexicon, Thai-script presence + spacing, Vietnamese diacritic density, protected-token integrity (masked/restored, count preserved), placeholder integrity, numbers/dates preserved, field-semantic (proper-noun title may equal EN; body must differ), untranslated-body, length-ratio.

## Notable
- **Malay clean (0 issues)** on full bodies — no Indonesian-contamination flags fired (native review still required to confirm true Malaysian-ness; the lexicon is a floor, not proof).
- **The QA has teeth** — proven in Phase 2.7 by seeded defects (Indonesian words, dropped protected name, placeholder loss, stripped VN diacritics, no-Thai-script) all caught; same validators run here.
- **Semantic-equivalence / hallucination / dropped-meaning:** current checks are structural + lexical + ⊆-source signals; a true back-translation/LLM-judge semantic gate (§28/§38) is **specified but not yet wired** — a scale condition. So "no P0/P1" does **not** certify meaning-perfect translation; it certifies mechanical + contamination + structural integrity.
- **SEO-field QA (title/meta/canonical/hreflang/slug/sitemap) on real translated pages:** NOT run this pilot (DB-less; not rendered). Carried to the scale gate.

## Honest limit
Automated QA green ≠ native quality. Native human review (`PHASE_2_8_NATIVE_REVIEW.md`) is mandatory and **pending**.
