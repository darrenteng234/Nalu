# Phase 3 — Malay-First Launch (EN → Malaysian Malay)

Status: SPEC (authoritative for Phase 3). Supersedes nothing; extends docs/specs/02
(content system), /03 (translation), /04 (QA). Locked sequence: 2.10 → 2.11 → **3
Malay-first** → Thai → Vietnamese. This spec defines ONLY the EN→MS controlled
launch path. TH/VI production workflows are OUT OF SCOPE here (architecture must
stay compatible, not activated). Brand is OUT OF SCOPE.

Do not assume anything is production-ready because an earlier phase passed locally.
Every mandatory acceptance criterion (§16) is PASS only with reproducible evidence.

---

## 0. Goal & non-goals

Goal: make NALU genuinely able to run ONE controlled pipeline —
`EN source → structured content → MS translation → MS localization →
deterministic validation → semantic QA → SEO validation → rendered QA →
human review → ready-to-publish → publish` — with EN and MS publishing
**independently**, and MS never public merely because translation succeeded.

Non-goals: full-corpus ingestion; TH/VI production; LIVE-ops expansion; brand;
site redesign; batch-scale throughput tuning beyond what the launch path needs.

`launchLocales = ["en","ms"]` is the active set; architecture retains
`["en","ms","th","vi"]` (locales.ts) untouched so TH/VI slot in with no redesign.

---

## 1. Article lifecycle (Source + Variant)

An **article** is a first-class public content type (Phase 2.11), stored as the
standard Source (neutral) + one Variant per locale. Detail template, routes,
SEO, hreflang are the shared path — no article-specific page.

- **Source** (`sources`): immutable `contentId` (ULID), `type:"article"`,
  `sourceVersion` (monotonic), `fieldHashes` (per-field sha256 for change
  detection). Language-neutral only. Authored/edited in Payload admin. No Claude
  call is required to create or edit an article.
- **Variant** (`variants`): keyed `(contentId, locale)`, unique. Carries its OWN
  `status` and `translation` group → **independent per-locale publication**.

## 2. Variant status lifecycle (the launch gate)

`VARIANT_STATUSES = draft → mt_generated → in_review → approved → published → archived`
(constants.ts). Public/indexable **only** at `published` — enforced centrally in
queries.ts (every public read filters `status:"published"`). No other status is
ever served.

EN and MS move through this lifecycle **separately**:

- **EN article**: authored in admin. `draft` → (editor publishes) → `published`.
  EN needs no translation/QA gate; it is the source of truth.
- **MS variant**: created ONLY by the translation pipeline, at `mt_generated`
  (NEVER `published`). Then:
  - deterministic + semantic QA runs as a **hard gate** (§6).
  - P0 present → stays `mt_generated`, flagged, NOT reviewable-to-publish.
  - QA clean → `in_review` (human review required, §8).
  - human approves → `approved`.
  - editor publishes an `approved` MS variant → `published`.

Transition invariant: **a variant reaches `published` only from `approved`**
(EN: an editor action on a source-of-truth locale is its own approval). The
pipeline may never write `status:"published"` for a translated locale.
Regression of Phase-2 pilot behaviour where `runPipeline` published all locales
on translation success is a Phase-3 defect (see §15) and is removed.

## 3. Independent EN/MS publishing (required behaviours)

| EN | MS | Public result |
|----|----|---------------|
| published | draft/mt_generated/in_review/approved | **EN only** |
| published | published | **EN + MS** |
| draft | published | MS only (EN hidden) — allowed; locales are independent |
| any | (translation succeeded, not approved) | MS **hidden** |

MS becoming public requires the explicit `approved → published` transition by a
human. Translation success, QA pass, and review approval each advance state but
none publishes.

## 4. Translation states (per variant, `translation` group)

- `translatedFromSourceVersion` — the `sources.sourceVersion` this MS was made
  from. `< current source version` ⇒ **stale**.
- `translationVersion`, `localizationVersion` — bump on (re)generation / (re)localization.
- `confidence` `{fieldKey:0..1}`, `fieldStatus` `{fieldKey:state}`.
- `stale` (bool, indexed) — set true when EN source changes after MS was made.
- `reviewer`, `reviewNotes` — human review record.

Machine states surfaced to ops/admin: `not_started` (no MS variant),
`mt_generated`, `qa_failed` (mt_generated + P0), `in_review`, `approved`,
`published`, `stale` (any state + source moved on).

## 5. QA states

- **Structural QA** (translation-qa.ts): empty-field, protected-name loss,
  placeholder mismatch, untranslated-body, English-leakage (stop-word density),
  MS-Indonesian contamination, length ratio. P0/P1/P2.
- **Semantic QA** (semantic-qa.ts): deterministic number integrity (every source
  number survives, none invented) + optional LLM-judge (omission/addition/
  contradiction/claim-strength). P0/P1.
- QA verdict: `p0>0` → **BLOCK** (stay mt_generated). `p1>0` → allow to
  `in_review` but reviewer MUST see the flags. `p2` → informational.

## 6. Deterministic validation → semantic QA → SEO validation → rendered QA (gate order)

Runs as a single gate function before a MS variant may leave `mt_generated`:

1. **Deterministic validation** — required fields present (title, slug, seo.title),
   slug unique per `(locale,type)`, placeholder/protected-token integrity,
   number/date/URL/code preserved (§9). Any failure = P0.
2. **Semantic QA** — number integrity (deterministic) + judge (§5). P0 = block.
3. **SEO validation** — seo.title/description present, length sane, canonical
   resolvable, no duplicate title/description within the MS locale, `noindex`
   correct. Failure = P1 (block review-to-publish until fixed).
4. **Rendered QA** — the MS page renders (RSC) without throwing; JSON-LD parses;
   canonical + hreflang present and correct (§13). Failure = P0.

Only when 1–4 have no P0 (and P1s are recorded for the reviewer) does the variant
advance to `in_review`.

## 7. Failure / retry behaviour

- **Provider failure** (network / 5xx / non-JSON): translation of that variant
  fails; variant stays at its prior state (no partial write of a published
  locale). Ret+ logged in activity-log with `outcome:"failed"`.
- **429 / rate limit**: exponential backoff (1s→16s cap), bounded retries,
  concurrency ≤ 2 (per Phase 2.9 finding). Must live in the **in-app** translation
  client, not only in pilot scripts.
- **Idempotency**: re-running translation for an unchanged
  `(contentId, field-hash)` is a no-op (cache/skip); duplicate retries never
  produce duplicate variants (unique `(contentId,locale)` index) nor double
  advance state.
- **Partial Gemini response / malformed structured output**: rejected as a P0
  QA failure; never written as content.

## 8. Human-review state (hard stop before publication)

- A MS variant at `in_review` is NOT public and NOT publishable.
- A human reviewer (native MS) records approval → `approved`, with `reviewer` +
  optional `reviewNotes`. Only then may an editor publish.
- Reviewer **rejection** after a prior approval: variant returns to `in_review`
  (or `mt_generated` if regeneration needed); if it was already `published`, see
  rollback §? — publication is withdrawn (`approved`/`in_review`, unpublished).
- The native reviewer is an **external dependency** (no NATIVE reviewer is
  simulated or auto-approved). Absence of a reviewer is a launch BLOCKER, not a
  pass.

## 9. Protected tokens, numbers, dates, URLs, code

- **Protected tokens** (translator.ts `maskProtected`): `{{...}}`, `[UPPER_SNAKE]`,
  `` `code` ``, `http(s)://…`, `<tags>`, and the PROTECTED_NAMES registry
  (ChatGPT, Claude, Gemini, NALU, Techpresso, …). Masked as `§N§` before
  translation, restored after. QA asserts every source token/name survives and
  no stray `§N§` leaks.
- **Numbers**: every source number must appear in MS (separator-agnostic);
  no invented numbers (semantic-qa `numberIntegrity`, P0).
- **Dates**: preserved as data; MS may localize format but the referenced day/
  month/year must not change (judge check + number integrity).
- **URLs**: never translated (masked). MS links resolve to MS slugs only for
  internal `contentId` relationships; external URLs unchanged.
- **Code**: `` `inline` `` and code blocks masked, never translated.

## 10. Malaysian Malay terminology rules

- Target is **Bahasa Melayu (Malaysia)**, NOT Indonesian. Contamination lexicon
  (translation-qa `INDONESIAN_MARKERS`: bisa, kalian, gratis, unduh, …) → P1.
- Direct EN→MS only; never relay via another language.
- Native, idiomatic phrasing, not word-for-word.
- Termbase / translation-memory for cross-article + cross-chunk consistency is a
  Phase-3 requirement (currently absent — §15). Minimum: a protected-term +
  preferred-term map applied at prompt time and asserted in QA.

## 11. SEO metadata rules

- Per-locale `seo.title` / `seo.description`; unique within a locale (qa `E`).
- `seo.title` policy = LOCALIZE (not literal); `seo.description` TRANSLATE.
- Length sanity (title ≤ ~60, description ≤ ~160).
- `noindex` respected. Never index a non-`published` variant.

## 12. Canonical / hreflang rules

- Canonical = self URL (metadata.ts `buildMetadata`).
- hreflang cluster = **published locales only**, keyed by `contentId`
  (queries.ts `hreflangCluster`); `x-default` → EN when EN published.
- MS not published ⇒ MS absent from the cluster ⇒ no hreflang pointing at a
  non-public MS page (correctness requirement, verified in §13/§5-rendered).

## 13. Rendered proof (must, not optional)

Prove via the real frontend + browser rendering (not API/DB only):
EN page; MS page; EN-only (MS hidden); EN+MS (both, hreflang both); MS draft
hidden; MS QA-failed blocked; MS review-required blocked; MS approved→published
allowed; changed EN marks MS stale/update-required; canonical+hreflang correct in
each case.

## 14. Audit trail, idempotency, cost/usage

- **Audit**: every pipeline + review + publish action writes `activity-log`
  (`actor`, `action`, `entity`, `locale`, `detail`, `outcome`). Powers ops
  automation-vs-manual metric (real records only).
- **Idempotency**: §7; field-hash based skip; unique index.
- **Cost/usage**: each real Gemini call records tokens/est-cost to activity-log
  (or a usage record) so ops shows actual spend, not a vanity number.

## 15. Known-unresolved from 2.10 that Phase 3 must resolve or explicitly defer

(Confirmed by audit — see PHASE_3_AUDIT below in report.)
1. `runPipeline` publishes translated locales directly at `published` — **defect**,
   must be replaced by the gated lifecycle (§2). MUST FIX.
2. In-app translation uses `FixtureTranslator`, not real Gemini `translator.ts` —
   the launch path must call `getTranslator()` (real Gemini) for MS. MUST FIX (path).
3. No in-app 429/backoff/concurrency control (only in pilot scripts). MUST FIX.
4. QA is a separate route, not a publish gate. MUST wire as gate (§6).
5. No termbase / translation memory. Minimum term-map required (§10).
6. No real Gemini Batch API (translateBatch = sequential loop). DEFER (not needed
   for controlled launch); keep abstraction.
7. Payload generated types absent; migrations blocked by Node24+lexical TLA
   (finding F-A). Production-safe migration path = launch BLOCKER to document.
8. Native MS human review = external BLOCKER.

## 16. Acceptance criteria (mandatory unless marked)

Launch gate is PASS only when every mandatory criterion is verified with evidence.

- AC1 EN article created in admin without Claude, publishes independently. (mand)
- AC2 MS generated via real provider abstraction (getTranslator/Gemini). (mand)
- AC3 MS enters at `mt_generated`, NEVER `published` on generation. (mand)
- AC4 QA gate blocks P0; clean → `in_review`. (mand)
- AC5 Human-review required before publish; unreviewed MS never public. (mand)
- AC6 EN & MS independently publishable (all §3 rows). (mand)
- AC7 Changed EN marks MS `stale`/update-required; stale not silently served as fresh. (mand)
- AC8 Canonical + hreflang correct incl. MS-hidden case. (mand)
- AC9 Protected tokens/numbers/dates/URLs/code preserved; no `§N§` leak. (mand)
- AC10 In-app retry/backoff/idempotency for 429 + duplicate retry. (mand)
- AC11 Regression suite (§ Step 6) green incl. seeded failures caught. (mand)
- AC12 Rendered proofs (§13) captured. (mand)
- AC13 Malaysian-Malay (not Indonesian) enforced in QA. (mand)
- AC14 Native MS human review performed. (mand — EXTERNAL BLOCKER)
- AC15 Production-safe migration + generated types. (mand — BLOCKER, document)
- AC16 Cross-chunk/cross-article terminology consistency. (should)
- AC17 Cost/usage recorded from real calls. (should)

## 17. Adversarial tests (Step 7 — must attack, fix systemic cause)

bad translation; missing field; malformed structured output; partial response;
429; duplicate retry; changed source after translation; stale accidentally
published; MS published while QA failed; protected-token corruption; number/date
mutation; HTML/JSON-LD corruption; chunk-boundary terminology drift; reviewer
rejects after approval; simultaneous publish attempts; failed DB write after
successful translation; accidental locale mass publication.

## 18. STOP conditions

STOP after: spec, audit, minimum launch path built, rendered proofs, regression
suite, adversarial review, launch-gate report. Do NOT begin full-corpus
ingestion; do NOT start Thai or Vietnamese; do NOT expand LIVE ops; do NOT touch
brand.
