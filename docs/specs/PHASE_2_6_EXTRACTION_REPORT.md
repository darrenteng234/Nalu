# PHASE 2.6 — EXTRACTION REPORT (B1)

**Goal:** remove the Phase 2.5 blocker `bodyText = 0/9` by adding rendered-DOM extraction, per-type contracts, and a completeness (thin-content) gate. Public content only; gated paths refused.

## Architecture built
- `src/lib/extract/renderer.ts` — `Renderer` abstraction: `RawRenderer` (fetch; metadata/JSON-LD/headings), **`PlaywrightRenderer`** (headless Chromium production adapter — lazy-imported, actionable error if absent), `CapturedRenderer` (replays rendered DOM captured by the environment's browser, for in-sandbox proof).
- `src/lib/extract/contracts.ts` — per-type `REQUIRED_FIELDS` + `checkCompleteness()` + `MIN_BODY_CHARS=250`. Body-bearing types (tutorial/review/blog/compare/community) REQUIRE a body; index types (tool/prompt-hub/collection/role) require structure instead.
- `src/lib/extract/extractor.ts` (2.5) unchanged as the renderer-agnostic parser + scope guard.

## Evidence

| Test | Input | Expected | Actual | Pass | Evidence |
|---|---|---|---|---|---|
| Raw HTML body | 9 public pages (2.5) | body often missing | **body 0/9** | — | 2.5 pilot |
| Rendered body — review | `/reviews/is-claude-pro-worth-it` via headless render | body present | **13,367 chars, 16×H2, 32×p, 7×FAQ** | ✅ | rendered-DOM measure |
| Rendered body — tutorial | `/courses/introduction-to-claude` | public overview present; gated excluded | **1,579 chars; paywall detected=true** (Instructions correctly absent) | ✅ | rendered-DOM measure |
| Scope guard | `/dashboard` | refuse, no fetch | REFUSED | ✅ | 2.5 + extractor |
| Completeness gate | body-type with body `<250` chars | EXTRACTION_FAILED, no publish | gate returns `EXTRACTION_FAILED` | ✅ | `checkCompleteness` |
| Completeness gate | index type (tool) w/o body | complete (body not required) | complete | ✅ | contract |

**Result:** rendered DOM yields the **public body** that raw HTML did not (0 → 13,367 / 1,579). The tutorial's gated Instructions stay absent from the public render — the scope boundary holds naturally. Completeness gate blocks body-less publication (fixes 2.5's "HTTP 200 + title + no body = success" failure).

## Per-type extraction contract (§4)
`SourcePage` fields modelled: sourceUrl, canonical, type, title, description, dates, headings, body sections, summary, FAQ, breadcrumbs, images, related, linked entities, provenance snapshot. Canonical content model is **structured**, never a raw-HTML blob.

## Systemic fix + regression
- **Fix:** completeness gate + per-type contracts + rendered renderer.
- **Regression guard:** contract fixtures (§6) — normal/long/short/FAQ/no-FAQ/many-links/images/unusual-headings/minimal/RSC-body/gated. The gated fixture asserts **REFUSED**; the minimal fixture asserts **EXTRACTION_FAILED**.

## Not proven / limitation
- **Production `PlaywrightRenderer` not executed in this sandbox** — Chromium download is unreliable here (npm timeouts). Real body extraction was proven via the environment's rendered browser; the Playwright adapter is coded and **must be verified in CI** (`npm i -D playwright && npx playwright install chromium`). Classified REQUIRED-BEFORE-SCALE verification, not a design gap.
- Body → structured sections mapping (heading-to-paragraph pairing) is coarse (body captured as text + heading outline); fine for completeness/SEO, refine for rich rendering before scale.
