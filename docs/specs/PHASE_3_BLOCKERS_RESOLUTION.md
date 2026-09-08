# Phase 3 — Launch-Blocker Resolution (AC15, AC14)

Scope: the two remaining Phase 3 launch blockers only. No new features, no
corpus ingestion, no TH/VI, no LIVE-ops, no brand.

---

## BLOCKER 1 — AC15: production-safe migrations + generated types → **RESOLVED**

### Root cause (exact)
`npx payload generate:types` / `migrate:create` failed with
`ERR_REQUIRE_ASYNC_MODULE`: the Payload bin transpiles `src/payload.config.ts`
with **tsx**, and because the project root `package.json` has no
`"type": "module"`, tsx emitted the config as **CommonJS**. The config's
`import { lexicalEditor } from "@payloadcms/richtext-lexical"` (an ESM module with
top-level await) then compiled to `require()`, and Node 24 forbids `require()` of
an ESM graph containing TLA.

### Fix (no app downgrade, architecture preserved)
Added a scoped `src/package.json`:
```json
{ "type": "module" }
```
The nearest `package.json` to the config now declares ESM, so tsx compiles the
config graph as ESM — the `richtext-lexical` import stays a real `import()`, TLA
is legal, extensionless specifiers and named exports resolve. The Payload bin
already loads the config via `await import()` (dist/bin/index.js:88); the only
defect was the CJS transpile. No Payload/Next/Node downgrade; the root project
stays CommonJS so nothing else changes. (An `@swc-node` attempt was rejected — it
emitted CJS and broke named exports — and its packages were uninstalled.)

### Working commands (pinned env)
```bash
export PATH="$HOME/.nvm/versions/node/v24.15.0/bin:$PATH"   # Node 24 arm64 (see env note)
npx payload generate:types          # -> src/payload-types.ts
npx payload migrate:create initial  # -> src/migrations/*.ts (+ .json snapshot + index.ts)
npx payload migrate                 # applies pending migrations (fresh DB)
npx payload migrate:status          # shows applied/pending
```
The stock `package.json` scripts (`generate:types`, `migrate`, `migrate:create`)
now work as-is under Node 24 arm64.

### Proof
1. **Migration files exist**: `src/migrations/20260907_143903_initial.ts` (25 KB)
   + `.json` snapshot (88 KB) + `index.ts`.
2. **`payload-types.ts` exists**: `src/payload-types.ts` (20.5 KB), real content.
3. **Clean typecheck passes** (`tsc --noEmit`) — and the newly-active generated
   types surfaced 4 latent errors (pilot pipeline + ops seed) that were fixed.
4. **Lint passes** (no errors).
5. **Production build passes** (`rm -rf .next && next build` → "Compiled successfully").
6. **Migration actually applied + not destructive**: applied to a fresh scratch DB
   (`techpresso_migtest`) → `migrate:status` = Ran (batch 1). Schema parity vs the
   real dev DB: **22/22 tables**, zero diff; column parity on variants (26=26),
   sources (18=18), acceptance_criteria, phase_tasks, activity_log — all identical.
   The initial migration is for a **fresh** deploy; the existing push-built dev DB
   is left untouched (running `migrate` against it is not part of the flow).
7. **Existing runtime still works**: dev server + `/ops` 200 + `/launch/verify`
   30/30 + rendered proof all pass against the unchanged dev DB.

### Verdict AC15: **PASS**.

---

## BLOCKER 2 — AC14: native Malaysian-Malay review support → **SUPPORT BUILT; sign-off NOT VERIFIED**

Native review is an EXTERNAL human step. It was NOT simulated. What was built is
the *support* so a real reviewer can review and have their decision recorded
auditably, without weakening QA or the approval gate.

### Built
- `src/lib/launch/review.ts` — `buildReviewPackage(contentId, locale)`: read-only
  EN↔MS side-by-side of every field + **live** QA recompute + a 6-item native
  checklist. `recordReview(...)`: routes APPROVE through `approveVariant`→
  `canApprove` (QA never bypassed; only `in_review` is approvable) and REJECT to a
  non-public hold; both require reviewer identity + notes and write `activity-log`.
- `src/app/launch/review/route.ts` — GET returns the package; `action=record`
  records a HUMAN decision. Never self-approves.
- `docs/specs/PHASE_3_MS_REVIEW_PACKAGE.md` — the actual package for the demo MS.

### Proof (mechanism, not a fabricated approval)
- Package renders: status `in_review`, reviewable, 10 EN↔MS field pairs, QA summary,
  checklist.
- Recording **requires** reviewer + notes → otherwise errors (auditability).
- A QA-failed variant (`mt_generated`, P0>0) **cannot be approved** — `canApprove`
  refuses (QA not bypassed).
- REJECT holds MS out of publication (stays 404) and writes an audit entry.
- A rejected translation **cannot publish** (publish hook requires `approved`).

### Verdict AC14: **NOT VERIFIED (external blocker)** — a native Malaysian-Malay
reviewer must review the package and record a decision. The support to do so
auditably is complete. NOT marked PASS on "looks reasonable".

> Note: the demo MS in the package is a fixture (Gemini quota was 429 at
> generation time). A real launch feeds Gemini MS through the same package; the
> mechanism is provider-agnostic.

---

## Adversarial review (both blockers)

| Attack | Result |
|--------|--------|
| migration created but not applied | Applied to fresh DB; `migrate:status` = Ran (batch 1) |
| generated types stale/mismatched | Regenerated → byte-identical; 22/22 table + column parity vs live DB |
| clean build failure | `rm -rf .next && build` = success; artifacts (types, migrations, src/package.json) committed. Residual: a full `npm ci` clean-clone build not run this session |
| Node version mismatch | Documented: Node 24 **arm64** required; default x64 v25 breaks lightningcss native binary |
| migration breaks existing records | Initial migration targets fresh DBs; dev DB untouched; scratch apply was clean |
| reviewer approval bypasses QA | Refused — `canApprove` blocks approving `mt_generated` (P0) |
| rejected translation can still publish | Blocked — publish hook requires `approved`; reject → non-public |
| edited source leaves MS published | DELIBERATE policy (§3): stale MS stays served but flagged `stale`, blocked from re-publish, surfaced in `/ops` + QA `version.stale` (P1). Alternative auto-unpublish available if desired — confirm preference |
| stale MS republished without regeneration | Blocked — publish hook rejects stale; requires retranslate + re-review |

Systemic fixes made: the `src/package.json` ESM scope (AC15 root cause); latent
generated-type errors fixed once real types were active; approval + publish gates
already enforced (AC14).

---

## FINAL STATUS

- **PASS**: AC15 (migrations + types, proven end-to-end incl. fresh-DB apply +
  schema parity + build/runtime).
- **PASS**: AC14-support (review package + auditable, QA-preserving recording).
- **NOT VERIFIED**: AC14 native reviewer sign-off (external human step).
- **NOT VERIFIED**: AC17 per-call Gemini cost/usage (unchanged; out of these two blockers).
- **PARTIAL**: cross-chunk termbase at real-long-body scale; Batch API (deferred).
- **FAIL**: none.
- **BLOCKERS**: (1) native Malaysian-Malay reviewer sign-off for the prepared
  package; (2 minor) confirm stale-MS policy (keep-flagged vs auto-unpublish).

## EXACT NEXT ACTION
Send `docs/specs/PHASE_3_MS_REVIEW_PACKAGE.md` (regenerated from real Gemini MS
once quota resets) to a native Malaysian-Malay reviewer; on approval, record via
`/launch/review?...action=record&decision=approve&reviewer=<name>&notes=<verdict>`,
then publish the approved MS. STOP — no Thai, Vietnamese, full-corpus ingestion,
LIVE-ops, or brand work.
