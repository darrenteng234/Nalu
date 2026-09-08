# PHASE 2.6 — QA REPORT

Machine-readable QA across extraction, translation, SEO, and structure. Principle (§15): field-semantic, not "differs-from-English". Evidence from `/pilot/phase26-tests` + `/pilot/qa`.

## 1. Extraction QA (completeness gate)
| Test | Input | Expected | Actual | Pass |
|---|---|---|---|---|
| body-type missing body | tutorial/review, body `<250` | EXTRACTION_FAILED, no publish | `checkCompleteness` → EXTRACTION_FAILED | ✅ |
| body-type with body | review (13,367 chars) | complete | complete | ✅ |
| index type no body | tool | complete | complete | ✅ |
| gated URL | `/dashboard` | refused | refused | ✅ |

## 2. Translation QA (field-semantic) — seeded-bad detection
The QA understands field roles (proper-noun title may match EN; body should differ; protected names may stay). Seeded deliberately-wrong translations; each defect was caught:

| Seeded defect | Locale | Check fired | Pass |
|---|---|---|---|
| Indonesian words ("bisa","gratis") | ms | `ms_indonesian_contamination` | ✅ |
| protected name "Claude" dropped | ms | `protected_name_lost` | ✅ |
| `{{workflow}}` placeholder lost | ms | `placeholder_mismatch` | ✅ |
| body left in English | ms | `english_leakage` | ✅ |
| diacritics stripped | vi | `vi_low_diacritics` | ✅ |
| no Thai script | th | `th_no_thai_script` | ✅ |
| proper-noun title == EN | any | (correctly NOT flagged) | ✅ |

Severity model: P0 (empty required, protected-name lost, placeholder mismatch), P1 (untranslated body, leakage, contamination, script/diacritic), P2 (length ratio, spacing). The mock provider's output is correctly flagged as leaky English (`mock_qa_clean=false`) — proving the check is not fooled by "different from English".

## 3. SEO QA (real pages, from 2.5 + breadcrumb added)
canonical self ✓ · hreflang published-only (EN-only page → en + x-default; ms/th/vi NOT emitted) ✓ · JSON-LD per-type + FAQPage + **BreadcrumbList** ✓ · sitemap excludes drafts ✓ · localized slug tied to content_id ✓ · slug change → 308 ✓.

## 4. Structural QA (`/pilot/qa`, combined dataset)
11 checks, P0=0/P1=0: completeness (errored sources excluded), ingest.errored (isolated/retryable), required-fields, slug/locale collision, hreflang cluster, SEO uniqueness, untranslated-leakage (protected names exempt), relationships.malformed(0)/unresolved(P2), version/stale, locale coverage.

## 5. Rendered a11y (§27) — structural checks present, automated axe pending
In place: `<html lang>` per locale + `dir`, skip-to-content link, single-H1 templates, heading order, image `alt` field (localized) on Media, responsive fluid layout (clamp/flex/grid, no fixed widths). **Not run:** automated axe/Lighthouse (no headless CI here) → REQUIRED BEFORE SCALE.

## 6. No page-by-page QC
Every check above is a rule over structured data/fields, run in-pipeline or on demand — not manual page inspection. Low-confidence/failing items route to review (severity + `check` recorded); high-confidence pass automatically.

## Blind spots (what these tests do NOT cover)
- Real machine-translation fluency (no provider run) — the field-semantic checks catch mechanical/contamination faults, **not** "fluent but subtly wrong meaning" (needs back-translation/semantic-equivalence + human sampling once a provider exists).
- Rendered a11y/perf (axe/Lighthouse) not executed.
- Body→section structuring quality on diverse real markup (coarse for now).
