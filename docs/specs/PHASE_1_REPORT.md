# PHASE 1 REPORT — Architecture Foundation

**Date:** 2026-09-05. **Scope:** foundation only. No bulk ingestion, no scraping, no translation, no page templates, no thousands of records. **Validation passed.**
**Node:** 24.15.0 LTS (via nvm). **Postgres:** 16.14 (local dev, `techpresso_dev`).

---

## 1. What was CHANGED
- **package.json** — renamed project; `engines.node` pinned to `^24.15.0` (excludes non-LTS 25); added stable **Payload 3.88.0** stack (`payload`, `@payloadcms/next`, `@payloadcms/db-postgres`, `@payloadcms/richtext-lexical`, `@payloadcms/ui`), `graphql`, `sharp`, dev deps (`dotenv`, `cross-env`); added payload scripts.
- **next.config.ts** — wrapped with `withPayload`; set `turbopack.root` (silences stray-lockfile warning).
- **tsconfig.json** — added `@payload-config` path alias.
- **src/app/globals.css** — rewired to import the token layer and map shadcn primitives → semantic tokens (light/dark centralized in tokens.css).
- **.gitignore** — added `public/uploads/`, `AGENTS.md`, `CLAUDE.md` (Payload-generated).
- **git remote** — detached from the template origin.

## 2. What was ADDED
- **src/payload.config.ts** — Postgres adapter, collections, `localization` (en/ms/th/vi, `fallback:false`), lexical editor, jobs queue (empty task list), sharp.
- **Collections:** `src/collections/{Users,Media,Sources,Variants,SlugHistory,Categories}.ts`.
- **src/lib/i18n/locales.ts** — single source of truth for locales (en pivot; ms/th/vi; extensible).
- **src/lib/content/constants.ts** — content types + variant status enums.
- **src/styles/tokens.css** — the design-token layer (placeholders).
- **Payload route group** `src/app/(payload)/` — layout, admin `[[...segments]]` page + not-found, api `[...slug]`, graphql, graphql-playground, generated `admin/importMap.js`.
- **Frontend route group** `src/app/(frontend)/` — token-based layout + placeholder home.
- **.env.example**; local `.env` (gitignored, real secret).

## 3. What was RETAINED
- Next App Router scaffold, `tsconfig`, `eslint.config.mjs`, Tailwind v4 + `postcss.config.mjs`, `components.json`, shadcn `button.tsx`, `src/lib/utils.ts`, `public/*` gitkeeps, git history.
- The neutral shadcn token primitives (now sourced from semantic tokens — no brand values committed).

## 4. What was REMOVED (template cruft, classified DELETE)
- Multi-agent config dirs: `.aider*`, `.amazonq`, `.augment`, `.cline*`, `.codex`, `.continue`, `.cursor`, `.gemini`, `.kiro`, `.opencode`, `.roo`, `.windsurf*`.
- Template docs/tooling: `README*.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, `AGENTS.md`/`GEMINI.md`/`CLAUDE.md` (template), `LICENSE`, `Dockerfile*`, `docker-compose.yml`, `scripts/sync-*`, `.github/{FUNDING,copilot*,PULL_REQUEST_TEMPLATE,ISSUE_TEMPLATE,skills}`, `.claude/skills/clone-website`, `docs/research/`.
- Old root `src/app/{layout,page}.tsx` (moved into `(frontend)`).

## 5. Dependency versions (pinned, stable)
| Package | Version |
|---|---|
| node (engines) | ^24.15.0 (running 24.15.0 LTS) |
| next | 16.3.0 |
| react / react-dom | 19.2.4 |
| payload | 3.88.0 |
| @payloadcms/next | 3.88.0 |
| @payloadcms/db-postgres | 3.88.0 |
| @payloadcms/richtext-lexical | 3.88.0 |
| @payloadcms/ui | 3.88.0 |
| graphql | 16.13.2 |
| sharp | 0.34.5 |
| tailwindcss | ^4 |
No Payload 4 canary/pre-release used. 19 transitive npm-audit advisories (2 low/14 mod/3 high) — inherited, to triage in a later hardening pass.

## 6. Database architecture
- **Postgres** (via `@payloadcms/db-postgres`, Drizzle). Dev DB `techpresso_dev` created; schema **pushed and verified**.
- **Collections:** `sources` (canonical, `contentId` unique, `type`, `sourceVersion`, `fieldHashes`, relationships-by-id, ingest bookkeeping), `variants` (per-locale, own `status`, localized fields + SEO group + translation/version group; unique `(contentId,locale)` + `(locale,type,slug)` indexes + a friendly-error uniqueness hook), `slug-history` (301s), `categories` (field-localized taxonomy), `users` (auth+roles+reviewLocales), `media`.
- **Independent per-locale publish** implemented via explicit Variant documents (Phase-0 finding F3 resolved) — **not** Payload's doc-level localization.

## 7. Content-model status
- Source + per-locale Variant established and **runtime-verified** (see §11). Generic/polymorphic `type` discriminator (deliberate refinement of spec 02's per-type tables — enables new types without schema change; see §13 conflicts).
- Versioning fields present: `sourceVersion` + `fieldHashes` (change detection), `translatedFromSourceVersion`, `translationVersion`, `localizationVersion`, `stale`, per-field `confidence`/`fieldStatus`. Pipeline logic lands in Phase 5.

## 8. Design-token status
- Full semantic token layer in `src/styles/tokens.css`: brand ramp (placeholder neutral), semantic colors (`--color-primary/background/surface/surface-2/text/text-muted/border/ring` + states), typography (brand font UNSET + locale fallbacks incl. **Thai** stack, weights, modular scale, line-heights), spacing scale, radius, shadows, breakpoints, component tokens (`--button-*`, `--card-*`), and a dark theme that remaps roles.
- shadcn primitives now reference these tokens → **the whole theme changes centrally**. **No brand color or brand font is committed** — ready for your identity to drop in.

## 9. Anything that could create FUTURE MIGRATION problems
- **Dev used schema `push`** (auto-sync). Before any real data, switch to **committed SQL migrations** (`payload migrate:create`) so schema changes are versioned/reversible. (Blocked today by the CLI env bug — see §12; workaround noted.)
- **Generic `neutralData` JSON** on sources trades strict typing for extensibility; add per-type validation (Zod/hooks) so JSON drift doesn't accumulate.
- **`fallback:false`** localization is intentional (independent publish); any code assuming a locale always resolves must handle misses (decision 3).
- **Bleeding-edge combo** (Next 16 + Payload 3.88 + React 19.2): pin exact versions; upgrade deliberately (see §12).

## 10. Anything that CONFLICTS with the six specs
- **Spec 02 said per-type Source/Variant tables; implemented generic polymorphic Source+Variant.** Rationale: better satisfies "future types without redesign" and "tens of thousands of entities" — one code path, additive types. Not a requirements conflict; documented deviation. Typed safety recovered via enums + per-type validation (Phase 2).
- No other conflicts. Independent publish, versioning, redirects, hreflang-by-contentId, taxonomy localization all map to the built model.

## 11. Automated validation results
- `npm run check` (lint + typecheck + `next build`) → **GREEN**. Routes built: `/` (static), `/admin/[[...segments]]`, `/api/[...slug]`, `/api/graphql`, `/api/graphql-playground`.
- **Runtime DB test** (temporary in-Next route, since removed) → **PASS**: `{"pass":true,"independentPublishOk":true,"uniquenessOk":true,"publishedLocales":["en"]}`.
  - schema pushed ✓; Source+Variant CRUD ✓; **`en` published visible while `ms` draft hidden** (independent publish) ✓; `(contentId,locale)` uniqueness rejected a duplicate ✓.
- Admin UI `GET /admin` → 200; frontend `/` → 200.

## 12. New compatibility findings (feed the adversarial log; confirm R15)
- **F-A — Payload standalone CLI (`generate:importmap`/`generate:types`) fails on Node 24** with `ERR_REQUIRE_ASYNC_MODULE` (tsx require-hook vs richtext-lexical top-level await). **IMPACT:** can't run those CLI steps directly. **WORKAROUND (verified):** `next dev` auto-generates `importMap.js` (now real/committed); type generation can run via an in-Next path or after tooling is pinned. **RECOMMEND:** track Payload/tsx fix; consider a small `tsx --import`/ESM wrapper for CLI, or evaluate Node 22 LTS if CLI parity is needed.
- **F-B — Payload node export `loadEnv` incompatible with Next 16 internal** (`loadEnvConfig` undefined) in the standalone script path. **IMPACT:** can't `import 'payload'` from a plain Node script for migrations/seeds yet. **WORKAROUND (verified):** run through the Next runtime (getPayload in a route/handler), where Next loads env. **RECOMMEND:** use in-Next scripts/jobs for seeds+migrations until the interop is patched; revisit at Phase 2/5.
- Both confirm **R15 (bleeding-edge stack churn)**. Neither blocks Phase 1; both have working paths.
- Minor: Payload regenerates `AGENTS.md`/`CLAUDE.md` on dev (now gitignored); npm-audit advisories to triage later.

## 13. GO / NO-GO for Phase 2
**GO.** The architecture is installed, compiles, and the core guarantee (independent per-locale publish on a scalable Source+Variant Postgres model) is runtime-verified. Before Phase 2 real data: switch dev `push` → committed migrations, and resolve/route around F-A/F-B for seed/migration scripts (in-Next path works today).

**Not started (as instructed):** ingestion, scraping, translation, templates, bulk records.
