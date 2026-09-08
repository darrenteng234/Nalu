# PHASE 2.6 — GAP MATRIX

**Date:** 2026-09-07. Carries the Phase 2.5 blockers/conditions into an implementation plan, re-checked against the **actual environment**. Two hard blockers depend on environment facts probed at the start of this phase:

- **No LLM API key** present (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/… all unset; `.env` has only `DATABASE_URI`, `PAYLOAD_SECRET`).
- **No headless browser** installed (no Playwright/Puppeteer/Chromium); prior npm pulls in this sandbox timed out repeatedly.

Classifications: `BLOCKER` · `REQUIRED BEFORE SCALE` · `SCALE OPTIMIZATION` · `DEFERRED` · `DECISION`.

| # | Requirement | Current state | Evidence | Classification | Fix / this-phase action | Verification |
|---|---|---|---|---|---|---|
| B1 | Headless rendered-DOM body extraction | Raw-HTML extractor gets metadata/schema/headings but **body 0/9** (RSC-streamed) | 2.5 pilot coverage | **BLOCKER** | Build `Renderer` abstraction + `HeadlessExtractor` + per-type contracts + completeness gate; **prove real body extraction on a small sample via the available rendered browser**; code a Playwright production adapter | body coverage > 0 on real pages; completeness gate blocks body-less publish |
| B2 | Real translation provider wired + validated | `Translator` iface only; **no API key** | env probe | **BLOCKER + DECISION (D-C)** | Build provider abstraction (`ClaudeTranslator` reading env key) + `MockTranslator`; field-aware TRANSLATE/LOCALIZE/PROTECT; prove plumbing with mock. **Real translation NOT runnable without a key** | with key: real EN→MS/TH/VI + QA; without: plumbing proven, real quality NOT PROVEN |
| B3 | Full field-semantic translation QA | basic checks only | 2.5 QA | REQUIRED BEFORE SCALE | Implement field-semantic checks + MS/ID contamination, Thai spacing, VN diacritics, protected-token integrity; seed known-bad → prove caught | seeded-bad detection |
| B4 | Deletion / source-removal policy | undefined | 2.5 G6 | **DECISION + build** | Define states (ACTIVE/SOURCE_MISSING/REVIEW_REQUIRED/UNPUBLISHED/ARCHIVED) + mass-deletion guard; implement + test | removal sim → correct state transitions, no mass delete |
| C1 | N+1 source lookups | per-item source fetch | `queries.ts` | REQUIRED BEFORE SCALE | Batch with single `in`-query | O(1) source fetch per hub |
| C2 | ISR strategy | `force-dynamic` | layout | REQUIRED BEFORE SCALE | Document ISR plan; keep dynamic for pilot | plan recorded |
| C3 | Sitemap sharding | single file | sitemap.ts | REQUIRED BEFORE SCALE | `generateSitemaps` per locale (deferred to scale; pilot << 50k) | count test |
| C4 | Committed migrations | dev `push` | Phase 1 F-A | REQUIRED BEFORE SCALE | Attempt `payload migrate` via working path; document if F-A blocks | fresh-db migrate applies |
| C5 | Generated Payload types | not generated (F-A); `any` shims | Phase 1 | REQUIRED BEFORE SCALE | Attempt generate; contain if blocked | types compile / documented |
| C6 | Rendered a11y/perf QA | none | 2.5 | REQUIRED BEFORE SCALE | Add structural rendered-a11y checks (alt, headings, lang, overflow) | checks run on pilot |
| C7 | Slug namespacing (migration) | real↔synthetic collision seen | 2.5 | REQUIRED BEFORE SCALE | Namespace real content ids/slugs (`tp-`) — already applied | no cross-set collision |
| C8 | Thin-content publish gate | none | 2.5 | **REQUIRED (this phase)** | Completeness gate: no publish if required body absent | body-less item blocked |
| C9 | Failure recovery breadth | isolation proven; provider/db failures untested | 2.5 | REQUIRED BEFORE SCALE | Simulate provider timeout/invalid/db-interrupt/partial-batch/retry | each isolates + retryable |
| D1 | Idempotency + field-level retranslate | proven (synthetic) | 2.5 | done / re-verify | re-verify with change to one field | only affected fields reprocess |
| — | Translation memory / terminology | none | — | REQUIRED BEFORE SCALE | Build TM/termbase store + drift detection | terminology consistency check |
| — | Entity-aware language switcher | home fallback | 2.5 | DEFERRED | — | — |

## Environment-driven reality (drives the gate)
- **B2 is externally blocked** (no key = a user decision). Per Phase 2.5 §33 / 2.6 §33, "translation provider cannot be validated" ⇒ cannot reach READY this phase.
- **B1 headless**: provable on real content via the environment's rendered browser; the production Playwright adapter is code, verifiable in CI (Chromium download unreliable in this sandbox).

## This-phase execution
1. **B1**: renderer abstraction + per-type contracts + completeness/thin-content gate; prove real body extraction on a small real sample. 2. **B2**: provider abstraction + field-aware classification + TM + versioning + field-semantic translation-QA, proven with a deterministic mock. 3. **B4**: deletion policy + guard. 4. **C9/D1**: failure-recovery + idempotency tests. 5. **C4/C5/C6/C1**: attempt/implement + document. 6. Seven reports + **Scale Gate (expected NOT READY, blocked on B2 key + B1 CI verification + untested real-translation quality).**
