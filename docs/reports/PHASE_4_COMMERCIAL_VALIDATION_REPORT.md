# Phase 4 — Commercial Validation + Easy Publishing: Report

Goal: prove NALU can turn useful AI content into measurable commercial intent while
making ordinary publishing easy for a non-technical founder. Small, bounded phase.
No payments, no research engine, no TH/VI, no corpus ingestion, no LIVE dashboard,
no brand. All Phase-3 safety preserved.

## Status

- **PASS**
  - Founder can create → paste → choose language → auto-metadata → see checks →
    attach a tool → preview (real template) → publish EN → public page renders →
    affiliate click is tracked. (Browser-verified end to end.)
  - Easy publisher `/studio` (list · new · editor · preview) — auth via Payload login,
    no Claude Code / terminal needed for ordinary publishing.
  - Smart preparation: slug, SEO title, meta description, dates auto; canonical /
    hreflang / OG / breadcrumbs / **Article** JSON-LD produced by the render layer.
  - Quality gate (STRUCTURE / CONTENT / SEO / AI-ANSWER / COMMERCIAL) with honest
    checks — no fake GEO score; does not force FAQ/headings.
  - Commercial tool DB (`tools`) with verification dates + honest affiliate status;
    disclosed CTAs; `/go/<tool>` 302 redirect + server-side click log.
  - SEO alternate cluster excludes unpublished locales (EN page = en + x-default only).
  - Phase-3 regression `/launch/verify` = **30/30**; Phase-4 `/studio/verify` = **26/26**.
  - typecheck ✓ · lint ✓ · production build ✓.
  - Adversarial: pasted `<script>` stripped; `/go` missing tool → 404 (no open
    redirect); `/go` `x-robots-tag: noindex` + robots disallow; unique (locale,type,
    slug); double-publish idempotent; **Gemini 429 → in-app exponential backoff
    (2.5s→5.1s→13s) → clean fail, zero orphan MS rows**.

- **PARTIAL**
  - Malay end-to-end via Studio: the translate→QA→review→approve→publish path is
    wired and reuses Phase-3 gates, but a live Studio MS generation could not be
    captured because the Gemini free-tier quota was exhausted (429). The gate itself
    is proven by `/launch/verify` 30/30 + Phase-3 `/launch/prove`. MS stays 404
    until approved (verified).
  - Author E-E-A-T signal: Article schema emits `Person` only when the founder fills
    the Author field; otherwise it correctly falls back to Organization.

- **NOT VERIFIED**
  - Real affiliate destination URLs: we do not have verified affiliate tracking
    links, so `affiliateUrl` is empty and `/go` falls back to the official URL
    (click still tracked). Real affiliate URLs must be added with evidence later.
  - Real traffic / real clicks from real visitors (needs deployment).

- **FAIL**: none.

## Files changed

New collections: `src/collections/Tools.ts`, `Clicks.ts`, `Opportunities.ts`.
New Variant field: `commerce` (disclosed recommendations).
New founder UI: `src/app/studio/{layout,page,new/page,[contentId]/page,[contentId]/preview/page}.tsx`,
dev helpers `src/app/studio/{verify,seed-tools,seed-user}/route.ts`.
New outbound: `src/app/go/[tool]/route.ts`.
New libs: `src/lib/studio/{parse,prepare,actions,constants}.ts`, `src/lib/quality/analyze.ts`.
Modified: `src/collections/Variants.ts` (commerce field), `src/payload.config.ts`
(register 3 collections), `src/lib/content/queries.ts` (commerce + tools + preview
resolvers), `src/lib/render/detail.tsx` (disclosed CTA), `src/lib/seo/jsonld.ts`
(Article schema + author/dates), `src/app/robots.ts` (block internal routes +
AI-crawler stance).
Generated/committed: `src/payload-types.ts`, `src/migrations/20260908_061910_phase4_commercial.*`.

## Founder workflow (plain language)

1. Go to **/studio** and click **+ New article**.
2. Paste your finished article. Use `##` for section headings and `-` for bullets.
   Pick **English** or **Malay** and (optionally) add author, category, tags, image.
3. Click **Save draft**. NALU builds the web address, search title, search
   description, and all the technical search tags for you — you never touch them.
4. On the article screen you see **Checks** in plain words (what's good, what to fix)
   and whether there's a **commercial opportunity**.
5. Optionally tick a **recommended tool**, say why, and pick a button ("See pricing").
6. Click **Preview** to see the real page exactly as visitors will.
7. Click **Publish**. The public page goes live.
8. For Malay: click **Translate to Malay**, then **Approve & publish Malay** — Malay
   never goes public until you approve it.
9. Every time a reader clicks a recommended tool, NALU records it.

No terminal, no Claude Code, no SEO knowledge required.

## Business validation — how we measure article → visitor → commercial click

- **Article**: each published page is a real, indexable URL with correct SEO +
  Article structured data (measurable later in Search Console, incl. the AI-features
  impressions report).
- **Visitor → commercial click**: every recommended-tool button links through
  `/go/<tool>`, which writes a **click row** (tool, article, source page, locale,
  destination, timestamp) before redirecting. So we can count, per article, how many
  readers showed real commercial intent — **without pretending we have revenue**.
- What we deliberately do NOT claim: conversions or revenue. Those require the
  affiliate network's own dashboard and real affiliate URLs (added later with
  evidence). This phase proves the *click* chain, which is validation Gate 2.

## Remaining risks

- **Affiliate URLs unverified** → clicks currently go to official sites; real
  earning needs verified affiliate links (with `lastVerifiedAt`). Low effort, but
  must be evidence-backed, never invented.
- **Gemini quota** → MS generation is rate-limited on the free tier; production
  needs a paid quota or batching. Retry/backoff already protects correctness.
- **No deployment yet** → real traffic/click data needs the site live.
- **Dev-only helpers** (`/studio/seed-user` with a local dev password, `seed-tools`)
  are `NODE_ENV`-gated to non-production; remove or lock before launch.
- **Founder discipline** (Phase-3 Gate 0): the ≤30-min/day loop still needs to be
  time-tested by the real founder.

## Exact next action

Deploy to a staging/production URL, add **verified** affiliate URLs for 2–3 tools
that have live programs (with evidence + `lastVerifiedAt`), publish 5–10 real
"best AI tool for <task>" articles (EN, then approved MS), and watch the `clicks`
collection + Search Console to hit validation Gate 2 (first affiliate clicks) → Gate
3 (first conversion, in the network dashboard). Do NOT scale content, add languages,
or build payments/research-engine until those gates pass.
