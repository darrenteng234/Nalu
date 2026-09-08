# 03 — TRANSLATION & LOCALIZATION (Authoritative Operating Spec)

**Status:** AUTHORITATIVE. Reconciled 2026-09-07 from the prior `03` (lettered §A–§AE, Claude-provider draft) and the NALU Translation/Localization Operating Spec (§0–§78, Gemini provider). On divergence between code and this document, §76 applies: STOP → identify → explain → correct → re-test.
**Reconciliation log + preserved examples + code-conformance note are at the end.**

> Provider note: the operating provider is now **Gemini** (was Claude in the earlier draft). Model, availability and pricing (§6/§42) are **provider claims to be re-verified before production**, not asserted facts here. The `Translator` abstraction keeps provider choice config-driven.

---

## 0. Purpose
Produce accurate, natural, locally-appropriate, SEO-safe, structurally-valid multilingual content **at scale with minimal page-by-page review**. Chain: English canonical → field-aware translation → language-specific localization → automated structural/linguistic/semantic validation → risk-based human review → publication. Reusable for future languages.

## 1. Non-negotiable principles
1.1 **English is the canonical pivot.** Every target translates directly from English. `EN→MS`, `EN→TH`, `EN→VI`. Relay translation (`EN→MS→TH`) is **prohibited**.
1.2 **Public/free boundary.** Only content visible without subscription/payment/login/membership enters the pipeline. No auth/paywall bypass, no gated instructions/videos, no private APIs, no inferring gated content. Gated → `status = OUT_OF_SCOPE`, never translated/published.
1.3 **Translation ≠ localization.** Translation preserves meaning/facts/relationships/conditions/intent/structure. Localization adapts syntax/terminology/register/UX wording/SEO phrasing/date-number conventions — **never adding unsupported claims**.
1.4 **Structure before prose.** Translate structured fields (title, description, summary, sections[heading/body], faq[question/answer], cta, seo{title,description}), never one HTML blob. Each field has its own policy.
1.5 **Protect non-translatable tokens** (product/company/model names, URLs, emails, code, identifiers, variables, placeholders, DB ids, protected slugs, technical syntax, filenames, API names). Survive unchanged unless the termbase says otherwise.
1.6 **Not fluency-only.** Evaluate meaning + factual integrity + terminology + native naturalness + structural integrity + SEO integrity.

## 2. Language scope
2.1 Launch: `en` (canonical), `ms` (Bahasa Melayu — Malaysia), `th` (Thai), `vi` (Vietnamese).
2.2 Future (no data-model redesign): `id` Indonesian, `fil`, `ja`, `ko`, `my`, others.

## 3. Language-specific quality standards
3.1 **Malaysian Malay (ms):** Malaysian BM, **not Indonesian by default**. Natural Malaysian vocabulary/register/rhythm, consistent terminology. Avoid Indonesian-only lexis, over-formal government register, English-syntax calques. Flag Indonesian contamination/morphology, vocabulary drift, untranslated English.
3.2 **Thai (th):** natural Thai structure, appropriate technical vocabulary + politeness/register, correct script, natural spacing/punctuation. Avoid English-syntax copy, needless transliteration, machine-like phrasing. Flag no-Thai-script bodies, English leakage, malformed punctuation, unnatural repetition.
3.3 **Vietnamese (vi):** natural syntax, consistent terminology, correct diacritics, readable length, right register. Avoid mechanical English syntax, dropped diacritics, inconsistent terminology, unnatural-but-grammatical phrasing. Flag low diacritic density, leakage, inconsistency, malformed punctuation.
(Concrete accept/reject examples per language preserved in **Appendix L**.)

## 4. Content field policy — every field is one of:
- **TRANSLATE** (high-fidelity meaning): body, summary, headings, descriptions, FAQ answers.
- **LOCALIZE** (equivalent meaning, target conventions): CTA, SEO title, meta description, selected UI/category labels.
- **PROTECT** (unchanged unless glossary allows): product/model names, URLs, code, variables, technical/internal ids.
- **SKIP** (never sent to engine): source URL, content_id, DB ids, hashes, internal audit fields.
- **DERIVE** (generated, not translated): localized canonical URL, hreflang metadata, some structured-data fields, timestamps.
Never translate raw HTML as an undifferentiated blob.

## 5. Provider architecture
Current provider **Gemini**, behind the abstraction `Translator ├── GeminiTranslator ├── MockTranslator └── future`. No Gemini-specific logic scattered through the content system. Provider/model selection is **configuration-driven** (env).

## 6. Model policy
Initial candidate `gemini-3.1-flash-lite` (provider positions it for high-volume/translation, cost-efficient; **pricing + availability MUST be re-verified before scale** — do not treat quoted figures as fixed). Do not hard-code the model as permanently correct. Store `provider, modelId, providerConfig, timestamp` per run. Provider/model migration must be possible without content-model changes.

## 7. Output contract
Prefer **schema-constrained structured output** (JSON per a defined schema). A schema-valid response is **NOT automatically publishable** — always validate schema **and** semantics, protected tokens, formatting, locale. Conceptual shape: `{ locale, fields:{title,description,summary,sections,faq}, warnings[], confidence }`.

## 8. Prompt design
Each request includes: source language, target locale, content type, field role, terminology rules, protected tokens, formatting rules, localization rules, SEO rules. Prompt must instruct: don't invent facts, don't omit meaning, don't modify protected tokens/code/URLs, don't relay through another language, write natural target prose, preserve register.

## 9. Field-specific instructions
9.1 **Title** — semantic fidelity, natural concise target title, no calqued structure, no added claims. 9.2 **Description** — same proposition, natural, concise, no marketing inflation. 9.3 **Body** — preserve every material idea/example/constraint/warning/list-structure; native rhythm; don't compress for tokens; don't expand with unsupported explanation. 9.4 **FAQ** — question & answer are separate fields; translated answer must answer translated question; no new FAQs. 9.5 **CTA** — localized (transcreated) to preserve intended action, not literal.

## 10. Protected-token handling
source → identify protected tokens → replace with stable placeholders (`{{PROTECTED_001}}`) → translate → restore exact tokens → verify (same count, values, URLs, variable names, code spans). Mismatch → **P0, publication blocked**.

## 11. Formatting preservation
Preserve semantic structure: headings, paragraphs, lists (ordered/unordered), emphasis, links, code, blockquotes, tables, placeholders. Sentence length may change; document structure (AST shape) must not be destroyed.

## 12. Link handling
URLs protected. **Internal links stored by content_id**, resolved to the target-locale slug at render; never create links to unpublished variants; never translate URLs by string-editing.

## 13. SEO localization
SEO fields are not ordinary prose. Localize title/meta/selected headings/social descriptions for target search intent; no forced literal English keywords, no stuffing. Each locale: locale-appropriate title + description, canonical, hreflang, localized slug where configured.

## 14. Terminology / termbase
`EN → MS/TH/VI + notes + status` where status ∈ `PREFERRED | ACCEPTABLE | PROTECTED | FORBIDDEN | CONTEXT_DEPENDENT`. Versioned. A new term decision does not silently rewrite approved content unless a retranslation policy triggers.

## 15. Translation memory
Store approved translations for consistency/cost/update-handling/repeated UI strings. Context-aware — never force an old translation into a new context when grammar/meaning differs.

## 16. Status model (per locale variant; locales independently publishable)
`DISCOVERED → EXTRACTED → STRUCTURED → TRANSLATION_PENDING → TRANSLATING → TRANSLATED → LOCALIZATION_PENDING → LOCALIZED → QA_PENDING → (QA_FAILED|QA_PASSED) → REVIEW_REQUIRED → READY_TO_PUBLISH → PUBLISHED → UPDATE_REQUIRED → STALE → SOURCE_MISSING → ARCHIVED`.

## 17. Version model
Track `sourceVersion, translationVersion, localizationVersion, qaVersion` + `source hash, field hash, translation hash, locale, provider, model, timestamp, reviewer`. A source change must not auto-invalidate everything.

## 18. Change detection
source hash change → identify changed fields → mark only affected translations stale → retranslate affected fields → QA → review if needed → publish. Unchanged translations untouched.

## 19. Source deletion
Source gone → `ACTIVE → SOURCE_MISSING`. Never auto-delete localized variants; mass deletion requires an explicit safeguard. Distinguish temporary outage / redesign / URL change / real deletion first.

## 20. QA taxonomy
Classes: `TRANSLATION_ERROR, LOCALIZATION_ERROR, EXTRACTION_ERROR, FORMATTING_ERROR, SEO_ERROR, DATA_ERROR`. Severity: **P0** blocker · **P1** major · **P2** review/info · **P3** cosmetic.

## 21. P0 checks (block publication)
missing required translation · empty required field · extraction incomplete · locale mismatch · wrong source linkage · protected-token corruption · placeholder corruption · broken required URL · malformed structured content · invalid canonical · invalid hreflang · gated/out-of-scope content · corrupted prompt/code · materially missing source meaning · high-confidence hallucinated factual additions.

## 22. P1 checks (flag)
significant untranslated English · Indonesian contamination in Malay · terminology mismatch · suspiciously short/long · missing headings · broken links · unusual punctuation · low semantic confidence · SEO title/meta inconsistency · language leakage · suspicious relationship loss.

## 23. P2/P3 checks
P2: stylistic inconsistency, low-confidence-but-plausible wording, unusual terminology, minor register mismatch. P3: optional style/punctuation/typography preferences.

## 24. Language-leakage QA
**Do NOT use `translated == English → failure`** (proper nouns/technical/model names may legitimately stay). Instead: bodies → detect high-confidence source-language leakage; titles → allow protected proper nouns; technical tokens → allowed; evaluate **field semantics**.

## 25. Malay/Indonesian QA
Detect likely Indonesian contamination (termbase-FORBIDDEN terms, Indonesian morphology, Indonesian-specific lexis where Malaysian is preferred) → `REVIEW_REQUIRED` unless confidence high enough to block. Never auto-reject legitimate shared Malay/Indonesian vocabulary.

## 26. Thai QA
Expect Thai-script presence; detect excessive English leakage; protect technical names; validate punctuation/placeholders/structure. Don't force every English loanword into Thai.

## 27. Vietnamese QA
Expect Vietnamese script + diacritic integrity; detect leakage; placeholder integrity; terminology consistency. Character-count thresholds are not the only test.

## 28. Semantic equivalence
Detect omitted meaning, invented claims, contradictions, changed numbers/dates/units/names/conditions, dropped warnings, altered list meaning. Low confidence → `REVIEW_REQUIRED`. Never silently publish.

## 29. Numbers / dates / measurements
Exact preservation unless localization rules permit conversion. Verify counts, percentages, prices, dates, durations, measurements, version numbers. A changed number is high-severity.

## 30. Prompt content
Preserve variables, placeholders, system instructions, quoted commands, code-like blocks, examples, model/tool names. Prose may translate; structural placeholders + technical tokens stay valid.

## 31. Code / technical content
Never corrupt code/SQL/regex/JSON/YAML/shell/API endpoints/function-class-variable names. Surrounding explanation may translate.

## 32. Human review model (risk-based)
Mandatory: homepage/top-level positioning, high-traffic SEO, technical tutorials, long-form, unusual QA outputs, major terminology changes, new languages, new source patterns, semantic-equivalence uncertainty. Routine high-confidence pages: no mandatory review.

## 33. Human review sampling
Higher sample for new content type/language/model; lower for stable patterns + high confidence; low-confidence → mandatory. Rates measurable + adjustable.

## 34. Reviewer interface
Show source EN, target, field type, locale, provider/model, QA findings, confidence, termbase + protected-token warnings, source/translation versions. Actions APPROVE/EDIT/REJECT/SEND-BACK, all auditable.

## 35. Publishing rule
Publish a variant only when: source valid + translation complete + localization complete + P0=0 + required P1=0 + SEO valid + status=approved. Review required when escalation rules say so.

## 36. Confidence scoring
Composite operational routing signal from provider status, field completeness, token preservation, language detection, terminology/semantic/formatting checks, length anomalies, historical error rates, model metadata. **Not** a scientific quality score.

## 37. Model routing
Route by task (efficient model for high-volume simple translation; stronger model for complex localization; independent verifier where justified). Evidence-driven from pilot; neither always-most-expensive nor always-cheapest.

## 38. Translation + verification separation
`Translator → Verifier` separable. Avoid one model translating then declaring itself correct for all QA. Verifier = another Gemini model / another provider / deterministic validators / human, per error type.

## 39. Structured-output validation (two layers)
Layer 1 syntax (valid JSON, expected schema, required fields). Layer 2 semantics (completeness, correctness, locale, protected tokens, terminology, source equivalence). Schema-valid ≠ semantically correct → app-level validation mandatory.

## 40. Retries
Retryable: timeout, transient provider error, rate limit, network. Non-retryable: invalid locale, malformed source, protected-token mismatch, unsupported field. Don't retry permanent failures.

## 41. Idempotency
Same source version + field hash + locale + model + policy → **SKIP**, no new translation.

## 42. Cost control
Measure input/output tokens, provider, model, field, locale, retries, review + translation cost. Re-check provider prices before scale. Optimize `acceptable localized quality / total cost`, not token cost alone.

## 43. Batching
Group by same locale/content-type/instruction-policy, bounded payload. No giant prompts mixing unrelated entities just to save calls (hurts retry isolation + observability).

## 44. Context caching
Evaluate (don't assume cheaper) for repeated terminology/instructions; measure; revalidate provider features/pricing before scale.

## 45. Audit trail
Record per event: content_id, field, source_version, source_hash, locale, provider, model, prompt/policy version, termbase version, timestamps, translation result, QA result, confidence, review status, reviewer, publication timestamp.

## 46. Rollback
Every published translation reversible to a prior approved version from stored history — no regeneration required.

## 47. Re-translation policy
Minor non-semantic change (punctuation/typo/formatting) → don't retranslate unchanged semantic fields. Semantic change (rewrite/instruction/number/terminology) → retranslate affected fields. Structural change (section/FAQ add/delete) → reprocess affected structure.

## 48. Quality baseline (measure from pilot, don't pre-invent targets)
translation-failure, QA-failure, review, manual-edit, semantic-error, token-corruption, locale-leakage rates; cost/page; cost/1K source words; latency; retry rate.

## 49. Pilot quality review
First real Gemini pilot spans short/long/technical/prompts/tools/tutorials/FAQ/SEO/proper-nouns/protected-tokens/complex-relationships; each of MS/TH/VI gets **machine QA + native-language human review on a representative sample** (not the whole corpus).

## 50. Error log (taxonomy)
`TM-001` terminology · `LOC-001` unnatural phrase · `SRC-001` extraction loss · `TOK-001` protected-token corruption · `FMT-001` formatting loss · `SEO-001` metadata · `SEM-001` semantic omission · `SEM-002` hallucinated claim · `LANG-001` wrong locale · `LANG-002` leakage. Drive improvements to prompts/termbase/validators/routing/review rules.

## 51. Regression suite
Any change to prompt/model/termbase/extraction-contract/QA-logic/localization-rules runs the regression suite. Fixtures: protected names, numbers, URLs, code, prompts, long/short prose, FAQ, lists, mixed-language. A regression failure blocks deployment of the translation subsystem.

## 52. Native-quality gate
Technical QA PASS ≠ native quality PASS. Keep a native-review layer for early pilots; reduce only where measured error patterns justify.

## 53. Confidence → publication
High → eligible for auto-publish · Medium → additional verification · Low → human review · Critical errors → block.

## 54. Future-language onboarding
Requires locale definition, localization guide, termbase, protected-token rules, QA rules, prompt policy, sample fixtures, native reviewer, pilot, scale gate. Never add a language by only setting `target_language = X`.

## 55. SEO indexing rule
Locales publish independently; don't block the platform on one incomplete locale. Untranslated locale → not published, not indexed, not in active hreflang. Published-only hreflang mandatory.

## 56. Content freshness
Source change → affected variant `STALE`. Action (keep-with-internal-warning / unpublish / review-queue) by criticality; high-risk factual/technical → block stale publication until reprocessed.

## 57. Source-sync safety
`DISCOVERED → EXTRACTED → DIFFED → VALIDATED → TRANSLATED → QA → REVIEW → PUBLISH`. A source change alone is not permission to publish.

## 58. Anti-hallucination
May improve wording for naturalness. May NOT add examples/claims/capabilities/benefits/certainty/statistics/pricing/testimonials absent from source. Adaptation = equivalent meaning + no unsupported claim.

## 59. Content integrity
Compare source field vs target field → semantic integrity assessment. Severe mismatch blocks publication.

## 60. Review priority
Higher for legal/compliance, technical instructions, numerical info, high traffic/business value, many protected terms, low confidence, recent model/prompt changes.

## 61–64. Change/versioning policy
**61 Model change:** never silent in prod — benchmark, compare, QA, cost, native sample, approval, versioned rollout. **62 Prompt policy versioned** (`translation-policy-vN`, recorded per translation). **63 Termbase versioned** (`termbase-vN`, recorded). **64 QA policy versioned** (`qa-policy-version` recorded).

## 65. Publication safety
No worker may write directly to `published`; publication requires the expected state transitions.

## 66. Security
API credentials live in env/deployment secrets; never committed, logged, put in Markdown reports, returned to frontend, or stored in content records.

## 67. Observability
Jobs expose queue status, success/failure/retry/review counts, cost, latency, locale, provider/model. Failures easy to locate.

## 68. Future CMS dashboard
Ops view by locale: pending/translating/QA-failed/review-required/ready/published/stale/source-missing; filter by locale/type/severity/provider/model/date/error-type.

## 69. Quality loop
translate → QA → review → error log → termbase/prompt/QA improvement → regression → better translation. Turn recurring mistakes into system rules, not per-record manual fixes.

## 70. Phased rollout
A synthetic → B real extraction → C real Gemini translation → D native review → E larger pilot → F production scale (only after the scale gate).

## 71. Gemini real-pilot test plan
verify key (no exposure) → one tiny sentence → translate a controlled EN sample to ms, th, vi (each direct) → automated QA → inspect token preservation/semantics/terminology/native quality → record usage/cost → retry one intentional provider failure → rerun unchanged (idempotency). Do not scale until this works.

## 72. Prompt test matrix
short/long title, technical paragraph, prompt content, FAQ, protected product name, numbers, code-adjacent, mixed terminology, long article section. Compare quality + cost + latency + QA-failure rate.

## 73. Human review sample
Compare EN vs each of MS/TH/VI for accuracy, fluency, naturalness, terminology, tone, formatting, SEO, cultural awkwardness. Record systematic issues.

## 74. Final scale gate (evidence required)
Extraction (complete public body; gated excluded) · Translation (real provider; all 3 locales; no relay) · Localization (Malay is Malaysian; Thai natural; Vietnamese natural) · QA (structural/linguistic/semantic/SEO/protected-token/formatting) · Operations (retry/failure-isolation/idempotency/versioning/source-updates/deletion-safety) · Cost (measurable/projected/acceptable) · Human review (risk-based/measurable/scalable).

## 75. Required decision
End of pilot answer: is Gemini-based translation good enough for the full public/free NALU corpus? `READY | READY WITH CONDITIONS | NOT READY`. If NOT READY, name the exact blocker. Never hide translation-quality problems behind technical success.

## 76. Authoritative implementation rule
This document governs. If code and doc diverge: STOP → identify → explain → correct doc or code → re-test. No silent drift. **(Current known divergence: see Code-conformance note below.)**

## 77. Acceptance criteria
All target locales processed independently; critical fields protected/translated correctly; no gated content enters; real Gemini translation works; QA catches seeded defects; native reviewers confirm acceptable quality; source changes reprocess correctly; failures isolate; unchanged work skipped; version history preserved; cost measurable; review risk-based; ready for controlled scale.

## 78. Final principle
Success is not "Gemini translated N pages." Success is: NALU **continuously** processes new/changed public content into high-quality MS/TH/VI, detects errors, stops bad output automatically, routes uncertain cases to humans, repeatedly, **without page-by-page manual QC**.

---

## Appendix L — Preserved language accept/reject examples (from prior §X/§Y/§Z)

**Malay (ms)** — Malaysian, NOT Indonesian. Do-not-use → use: `bisa→boleh`, `kalian→anda/kamu`, `gratis→percuma`, `ponsel→telefon`, `unduh→muat turun`, `coba→cuba`, `pakai→(often) guna`. Loanwords in Malaysian form (teknologi, strategi, profesional). Keep English AI/tech terms where natural ("prompt", "AI", model names). Register: professional-plain BM, not royal-formal, not slang.
- Reject calque: "Start your 7-day free trial" → "Mulakan percubaan percuma 7-hari anda" (stiff). Accept: **"Cuba percuma selama 7 hari."**
- Reject calque: "Watch it work." → "Tonton ia berfungsi." Accept: **"Lihat cara ia berfungsi."**

**Thai (th)** — no space-per-word (Thai is unsegmented); spaces only by Thai convention + around Latin/numbers. Correct tone/vowel marks, NFC. Latin brand/model names stay Latin, spaced. Polite instructional register. Reject English word-order carried into Thai; accept natural topic-comment ordering.

**Vietnamese (vi)** — full correct diacritics (reject un-/mis-accented, e.g. "Bat dau dung thu mien phi"); accept fully-accented ("Dùng thử miễn phí 7 ngày"). Natural word order + classifiers; keep standard English tech terms; NFC.

## Appendix R — Reconciliation log (prior §A–§AE ↔ this spec)
- Prior English-pivot/§B, per-field model/§C, TM+versioning/§D, statuses/§E, change-detection/§F–§G → now **§1.1, §4, §14–§18, §47**.
- Prior confidence §H → **§36/§53**. Automated verification §I + localization verification §J → **§20–§31, §39**. Escalation §K + sampling §AC → **§32–§33**. Terminology §L → **§14**.
- Protected names §M + prompt/code §N → **§10, §30–§31**. Formatting §O → **§11**. Links §P → **§12**. SEO §Q → **§13**. CTA §R → **§9.5**. Numbers §S → **§29**. Missing/untranslated §T + hallucination §U → **§21–§24, §58**. Semantic §V → **§28/§38**. Native quality §W → **§52**. Language rules §X/§Y/§Z → **§3 + Appendix L**. Future-lang §AA → **§54**. Re-translation §AB → **§47**. Audit §AD → **§45**. Rollback §AE → **§46**.
- **New in this spec (not in prior draft):** Gemini provider architecture (§5–§7), DERIVE field policy (§4), full status model (§16), qaVersion (§17), structured-output two-layer validation (§39), model routing (§37), translator/verifier separation (§38), cost/batching/caching (§42–§44), observability/dashboard (§67–§68), phased rollout (§70), regression suite (§51), prompt/termbase/QA-policy versioning (§62–§64), acceptance criteria (§77).

## Appendix C — Code-conformance note (§76 divergence, MUST fix before the pilot)
Current code (`src/lib/translate/translator.ts`) implements `MockTranslator` + `ClaudeTranslator`. This spec makes **Gemini** the operating provider. **Divergence:** a `GeminiTranslator` (structured output §7, field-aware §4, protected-token masking §10, direct pivot §1.1, reads `GOOGLE_API_KEY`/`GEMINI_API_KEY` from env §66) must be added behind the `Translator` interface and selected by config; `ClaudeTranslator` remains an alternate provider (§5). Field-semantic QA (`src/lib/translate/translation-qa.ts`) already aligns with §24–§31. **Action:** add `GeminiTranslator`; run the §71 pilot once the key is set. Until then real translation stays NOT PROVEN.
