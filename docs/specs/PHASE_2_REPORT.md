# PHASE 2 REPORT — Reusable templates + controlled pilot pipeline

**Date:** 2026-09-06. **Scope:** prove the complete production path on a tiny controlled pilot. **No bulk ingestion, no bulk translation, no full population, no brand.**
**Result:** end-to-end path GREEN. `npm run check` (lint+typecheck+build) passes; automated QA passes (P0=0, P1=0); all pilot pages render in all four locales.

Stack unchanged from Phase 1 (Next 16.3 / React 19.2 / Payload 3.88 / Postgres / Node 24 LTS). Brand values remain **UNSET** — everything renders through neutral semantic tokens.

---

## 1. What was built

**Content data layer** (`src/lib/content/`): `payloadClient` (in-Next), `queries.ts` (published-by-slug, list-by-type, by-contentId, related, hreflang cluster, slug-history redirect, search, sitemap), `segments.ts` (type↔URL-segment map, path builders). Variants extended with `summary` / `sections[]` / `faq[]`.

**Locale routing** (`src/app/(frontend)/[locale]/`): `/{locale}/…` for en/ms/th/vi; `layout.tsx` sets `<html lang dir>`, chrome, skip-link, `generateStaticParams` for locales, `force-dynamic` (content is DB-backed → on-demand). `middleware.ts` redirects `/`→locale (Accept-Language). `not-found.tsx`.

**Reusable templates** (`src/components/templates/Views.tsx`, `src/lib/render/detail.tsx`): one `EntityView` (base + structured `sections[]` + FAQ + related), `HubView`, `HomeView`, `CardGrid`, `SearchView`; `DetailPage`/`detailMetadata` shared renderer. Thin route files per type (tools, tutorials, prompts, collections, compare-tools, free-tools, ai-for, community) — **content determines the page, template determines presentation**.

**SEO** (`src/lib/seo/`): `buildMetadata` (title, description, self-canonical, hreflang cluster by contentId + `x-default`, OG, robots/noindex); `jsonLd` per-type recipes (Course, SoftwareApplication, CollectionPage, Article, BlogPosting, TechArticle, FAQPage) with `inLanguage`. `sitemap.ts` (all published, per-locale URLs) + `robots.ts` (disallow /admin,/api,/pilot).

**Search** (`/[locale]/search`): server search over NALU-owned published variants (title/summary), empty-state.

**Pipeline** (`src/lib/pipeline/`): `discover → change-detect → structure(EN master) → translate(ms/th/vi) → validate → publish`. Idempotent (upsert by contentId / (contentId,locale)), resumable, versioned (sourceVersion + field hash + per-variant translatedFromSourceVersion + stale), failure-isolated (per entity/locale try-catch), observable (run log). `Translator` interface + `FixtureTranslator`; live Claude provider slots in later (keyed).

**Pilot dataset** (`src/pilot/fixtures.ts`): **NALU-authored ORIGINAL content** (invented tool names — no Techpresso text reproduced), shaped like the public types: 2 tools, 2 tutorials, 1 prompt page, 1 collection/path, 1 compare, 1 free tool, 1 role page, 1 community post, 2 categories — each with EN master + native MS/TH/VI, relationships by contentId.

**Automated QA** (`src/lib/qa/`): 9 machine checks (completeness, required fields, slug/locale collision, hreflang cluster, SEO uniqueness, untranslated leakage, relationship integrity, version/stale, locale coverage). Exposed at `/pilot/qa` (422 if any P0/P1). Pipeline run at `/pilot/run`. Both dev-gated, outside `/api` (avoids Payload catch-all).

---

## 2. Pilot proof matrix (all 25 verified)

| # | Proof | Evidence |
|---|---|---|
| 1 | source extraction | pipeline `discover` from controlled fixture manifest |
| 2 | structured storage | 10 Sources + 40 Variants in Postgres (run log) |
| 3 | English master | 10 EN variants published; QA `completeness.en_master` pass |
| 4–6 | Malay / Thai / Vietnamese | 30 non-EN variants published; pages 200 in each |
| 7 | independent locale publishing | Variant-level status (Phase-1 F3); verified Phase 1 + pilot |
| 8 | localized URLs/slugs | `/ms/tools/flowcast`, `/vi/collections/bat-dau`, etc. all 200 |
| 9 | hreflang | 4 locales + `x-default` emitted, symmetric (verified in head) |
| 10 | canonical | self-referential per locale (verified) |
| 11 | SEO metadata | title/description/OG via `buildMetadata`; uniqueness check pass |
| 12 | JSON-LD | SoftwareApplication + FAQPage etc. in page head (verified) |
| 13 | internal relationships | related/tool/step/featured rendered; integrity check pass |
| 14 | category relationships | 2 categories seeded (localized), linked via `rel:category` |
| 15 | related-content | "Related" blocks resolve to locale siblings (omit if unpublished) |
| 16 | update detection | bumped Lumina hash → sourceVersion 2, only that entity re-translated |
| 17 | translation versioning | `translatedFromSourceVersion` set; `version.stale` check pass |
| 18 | validation | `/pilot/qa` → P0=0 P1=0, 9 checks |
| 19 | publication state | draft→published; only published rendered/indexed |
| 20 | frontend rendering | every type × locale returns 200 |
| 21 | responsive rendering | fluid CSS (clamp, flex/grid, max-width) — desktop+mobile |
| 22 | multilingual typography | Thai/VN via fallback stacks in tokens; `<html lang dir>` per locale |
| 23 | search over NALU content | `/en/search?q=report` returns owned results |
| 24 | sitemap generation | `/sitemap.xml` from published variants |
| 25 | redirect/slug history | old slug → **308** to current (verified) |

---

## 3. Automated QA result (final)

`{"p0":0,"p1":0,"fail":0,"pass":9}` — completeness ✓, required-fields ✓, slug-collision ✓, hreflang-cluster ✓, seo-uniqueness ✓, untranslated-leakage ✓, relationship-integrity ✓, version/stale ✓, locale-coverage ✓ (informational). Pipeline idempotency: re-run → 0 published / 40 skipped-unchanged / 0 errors.

---

## 4. Adversarial review — ASSUMPTION → FAILURE → DETECTION → FIX → VERIFICATION

### Found & fixed this phase
1. **Untranslated-leakage false positive.** ASSUMPTION: any non-EN text equal to EN = leakage. FAILURE: single-token proper-noun titles ("Flowcast","Lumina") legitimately stay identical → 6 false P1s. DETECTION: `/pilot/qa` flagged 6. FIX: exempt single-token proper-noun titles (docs/specs/03 §M protected names); treat translatable *body* (summary) equality as the real signal. VERIFICATION: re-run → 0. *(Fixed at the check level, not the data.)*
2. **Slug-change redirect was 307 (temporary).** FAILURE: temporary redirect loses SEO equity on a slug change. DETECTION: redirect test returned 307. FIX: `permanentRedirect` (308). VERIFICATION: old slug → 308.
3. **Build coupled to DB.** FAILURE: `next build` prerendered DB-backed pages → failed when schema/rows absent. FIX: content segment + sitemap `force-dynamic` (render on demand). VERIFICATION: build green with empty DB.

### Scale risks (challenged; mitigation in place or specified)
- **10 languages** → locale is a config list + Variant rows; templates/queries locale-agnostic. Adding a locale ≠ code change. *Verify at scale: sitemap sharding + translation cost.*
- **100k variants** → data-first, no per-page files; queries filter on indexed `(contentId, locale, type, status, slug)`. **Watch:** `queries.ts` currently does per-item source lookups (N+1) — fine at pilot, **must batch before scale** (documented below).
- **Duplicate URLs** → uniqueness enforced by DB index `(locale,type,slug)` + QA `slug.collision`; links resolve by contentId. Pass.
- **Translation update corruption** → field-hash change detection + per-variant version; only changed entity re-translated (verified). Unchanged untouched.
- **One failed job stops the queue** → per entity/locale try-catch, errors collected, run continues (failure-isolated). Verified structurally.
- **Localized slugs break hreflang** → cluster keyed by contentId, not slug; localized slugs verified with correct hreflang. Pass.
- **Template needs manual exceptions** → single `EntityView` served all 8 types with no per-page code. Pass (community/free-tool are thinner but same template).
- **Thin/duplicate SEO** → SEO uniqueness check per locale; each entity carries real distinct content. **Watch at scale** (programmatic pages).
- **Payload query speed / CMS manageability** → indexes present; **admin at 100k needs pagination discipline** (Phase-0 F6, still open).
- **Thai/Vietnamese typography** → rendered 200 with correct lang/dir + fallback fonts; line-height tokens give diacritics room. Visual snapshot QA to add.
- **Non-AI future** → nothing in the model is AI-specific; generic Source+Variant + types. Pass.

---

## 5. Conflicts with specs (surfaced, not silently chosen)

- **Generic polymorphic Source+Variant** vs spec 02's per-type tables — carried over from Phase 1 (documented deviation; better for new-types-without-migration). No behavioural conflict.
- **`force-dynamic` now** vs spec's ISR-at-scale — intentional pilot choice (build/DB decoupling). Spec's ISR + on-publish revalidation is the scale target; switch is a config change, not a rearchitecture. Flagged, not silent.
- No spec-vs-spec conflicts encountered.

---

## 6. Must-fix before scale (not blocking pilot)

1. **Batch the N+1 source lookups** in `queries.ts` (join/`in` query) — required before 100k.
2. **Sitemap sharding** (`generateSitemaps` per locale, 50k/file) — single file now.
3. **Switch `force-dynamic` → ISR** with on-publish revalidation for render cost at scale.
4. **Wire the live translation provider** (Claude, keyed — D-C) behind the existing `Translator` interface; add the full docs/specs/03 verification gates (back-translation, placeholder/code integrity, locale lexicon/diacritic checks) to `/pilot/qa`.
5. **Generate `payload-types.ts`** once the CLI env interop is resolved (Phase-1 F-A) to drop the `any` shims.
6. **Add rendered-QA** (axe a11y, Lighthouse, visual snapshots for Thai/VN layout) per docs/specs/04 §I.
7. **Language switcher** currently falls back to locale home; make it entity-aware (link to the sibling slug) — UX refinement.
8. **Migrations**: move dev `push` → committed SQL migrations before real data (Phase-1 note).

---

## 7. Stop-condition check

None tripped: content model needed no page hacks · localization architecture holds · hreflang reliable · localized slugs keep content identity · translation versions tracked · source updates detected safely · SEO template-driven (no manual editing) · one failed job isolates · QA detects systemic errors (proved by catching the leakage issue) · multilingual layout renders · CMS operable at pilot scale.

---

## 8. Verdict

**Phase 2 GREEN.** The reusable multilingual pipeline + templates work end-to-end on the controlled pilot, and automated QA gates the path. **Do NOT scale yet** — complete the §6 must-fix items (chiefly: batch queries, ISR, live translation provider + full §03 QA gates) and re-run QA + this adversarial review on a larger sample before approving bulk ingestion.

**Not started (as instructed):** bulk ingestion, bulk translation, full population, brand implementation.
