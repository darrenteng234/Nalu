# PHASE 2.6 — TRANSLATION REPORT (B2)

**Goal:** wire a production translation subsystem behind an abstraction, field-aware, English-pivot, with protected tokens and versioning.
**Headline:** the subsystem is **built and its plumbing proven with a deterministic mock**. **Real translation is NOT PROVEN** — no LLM API key is present in the environment (`ANTHROPIC_API_KEY` unset), so the real provider cannot be validated. This is an external **DECISION (D-C)** blocker, not a code gap.

## Built
- `src/lib/translate/translator.ts`:
  - `Translator` interface (`translate`, `translateBatch`, `validate`, provider metadata). App depends on the interface, never a concrete provider.
  - `ClaudeTranslator` — Anthropic provider; reads `ANTHROPIC_API_KEY` from env; `validate()` reports not-configured when absent; `translate()` **throws** rather than silently degrade. Field-by-field, English pivot only.
  - `MockTranslator` — deterministic offline provider for plumbing tests.
  - `getTranslator()` — real if key present, else mock (never silent for real content).
  - **Field policy** classification `TRANSLATE / LOCALIZE / PROTECT / SKIP` + `maskProtected()` (brand/product/model names, `{{placeholders}}`, `[TOKENS]`, `code`, URLs, tags) masked before translation, restored after.

## English-pivot (direct, never chained) — enforced by design
`translate(req)` takes `sourceLocale:"en"` only and one `targetLocale`. There is no code path that reads a non-English variant as a translation input. `en → {ms|th|vi}` each independent.

## Field-aware (§9) — evidence
Mock run on `{title(proper noun), summary(body), section0(body+placeholder+protected name)}` → all three produced per-field output; masking preserved `{{workflow}}` and `Claude`. Fields differ from English: title ✓, summary ✓, section0 ✓.

| Test | Expected | Actual | Pass |
|---|---|---|---|
| provider abstraction | app uses interface, env creds | `getTranslator()` selects by env; no direct provider refs | ✅ |
| no-key behaviour | validate=not-configured, translate throws | `ClaudeTranslator.validate()` → `{ok:false}`; translate throws | ✅ |
| field-aware output | per-field, protected preserved | 3/3 fields output; placeholder+name masked/restored | ✅ |
| direct pivot | no chained translation | interface accepts only `en`→one target | ✅ (design) |
| **real EN→MS/TH/VI** | native output | **NOT RUN — no API key** | ❌ NOT PROVEN |

## Versioning (§13)
Variant `translation` group already records `translatedFromSourceVersion`, `translationVersion`, `localizationVersion`, `stale`. `TranslateResult` carries provider/model/timestamp for storage. Change→retranslate-only-affected proven in Phase 2 (field-hash) and unchanged here.

## Translation memory / terminology (§12) — PARTIAL
Present: protected-names registry (`PROTECTED_NAMES`) + Indonesian-contamination lexicon (`INDONESIAN_MARKERS`). **Missing:** a persistent approved-term store per locale + drift detection across pages. Classified **REQUIRED BEFORE SCALE**.

## Native localization policy (§10/§11)
Locale rules are encoded in QA validators (MS-not-Indonesian, Thai script/spacing, VN diacritics) and provider prompts (`ClaudeTranslator` system prompt names "Malaysian Malay (NOT Indonesian)"). A full written localization policy (numbers/dates/currency/CTA/loanwords per locale) is specified in `03_TRANSLATION_LOCALIZATION.md` §X/§Y/§Z; encoding the remaining rules as machine checks is REQUIRED BEFORE SCALE.

## Blocker
**B2 real translation cannot be validated without a provider key (D-C).** Until a key is supplied, real EN→MS/TH/VI quality is untestable and the scale gate cannot pass this criterion.
