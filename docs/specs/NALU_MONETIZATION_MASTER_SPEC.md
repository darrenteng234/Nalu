# NALU — Monetization Master Spec

Status: STRATEGY + FORWARD DESIGN (authoritative for the commercial pivot). This
document defines what NALU becomes and how it makes money. It is a design + decision
record — **it does not authorize coding**. Companion audit:
`docs/reports/NALU_COMMERCIAL_RECONSTRUCTION_AUDIT.md`.

Founder = non-technical, wants a low-effort operating model (~15–30 min/day). That
target is **not assumed achievable** — it is a design constraint we stress-test and
gate (see audit §4 #15 and the validation sequence).

Locked founder decisions (from directive): default workflow = paste finished article;
lazy workflow (rough notes/URL/topic) later; daily research yes; max automation yes;
**founder must click Publish**; commercial recommendations yes when useful + disclosed;
founder won't learn prompt-engineering/SEO; founder won't use Claude Code to publish
ordinary articles.

---

## 0. Positioning (decided in audit §2)

**NALU = the Malaysian guide to AI tools & workflows for getting real work done.**
Content engine = AI tools + tutorials + workflows + recommendations (option D),
aimed at practical work/business users (option C), localized **Malay-first**. News is
a *trigger* for evergreen content, never the product. Rejected: AI news (A), AI
education as primary (B), unfocused hybrid (E).

---

## 1. Operating model (target)

```
NALU researches → finds opportunities → prepares content → structures it
→ optimizes discoverability (SEO + AI-search) → localizes to Malay → QA
→ identifies monetization → places in READY TO PUBLISH
→ FOUNDER REVIEWS → FOUNDER CLICKS PUBLISH
```
The specialist work (structure, SEO, schema, hreflang, translation, QA, monetization
matching) is automated. The founder does judgement + the publish click. Every
automated step is **proposal, not action**: nothing goes public without the click.

---

## 2. Content model (minimum viable types)

Only four types earn their place at launch. Each maps onto the existing Source+Variant
model (the `type` discriminator already supports this — minimal build).

| Type | Audience intent | SEO role | Commercial intent | Monetization | Source req. | Update freq. | Automation | Founder effort |
|------|-----------------|----------|-------------------|--------------|-------------|--------------|------------|----------------|
| **Article** (how-to / guide / explainer) | "teach me to do X with AI" | topical authority, long-tail | medium | contextual affiliate + email | founder paste / notes | as needed | high (structure, SEO, MS) | low (paste + approve) |
| **AI Tool** (directory entry) | "what is this tool / is it worth it" | entity page, AI-search citation | high | affiliate (recurring) | commercial DB + tested notes | quarterly re-verify | high (fields), human verify | low–med |
| **Comparison** ("X vs Y", "best AI for <task>") | "which should I pick" | **highest** AI-search + buyer queries | **highest** | affiliate (multi-tool) | ≥2 Tool records | on tool change | high | med (judgement) |
| **Workflow** (step-by-step using tools) | "how do I actually do this at work" | practical long-tail, shareable | high | affiliate (tools in steps) + template upsell | founder/notes | occasional | high | med |

**Deferred types & why**: *Guide* = long Article (don't split). *Resource* = a
Collection (later). *Template/Product* = digital products (later; no payments now).
*Newsletter* = email (later, minimal). *Prompt pack* = a digital product later.

Existing code already has `article`, `tool`, `compare_tools`, `tutorial` — so the four
launch types are mostly **rename/reuse**, not new tables.

---

## 3. Article authoring system (founder workflow)

Default = **paste a finished article**. The system does the rest; the founder never
sees H1/schema/canonical/hreflang/OG/JSON-LD/sitemap terminology.

```
NEW ARTICLE
 → founder pastes finished article (+ optional: intended tool(s), audience)
 → NALU STRUCTURES  (title, H1, H2/H3, slug, key takeaway, optional FAQ)
 → NALU CHECKS      (content-quality layer, §5)
 → NALU METADATA    (title tag, meta description, schema, canonical — hidden)
 → NALU LINKS       (proposes internal links to existing NALU pages)
 → NALU MONETIZATION(proposes relevant tools/CTAs from the commercial DB, disclosed)
 → PREVIEW          (founder sees the finished page + a plain-language check summary)
 → FOUNDER PUBLISHES(one click → the existing gated publish path)
```
Malay: on publish (or on demand) NALU generates the MS variant via the existing gated
translate→QA→review path. MS still requires its own approval (Phase 3 rule: MS never
public merely because generation succeeded).

Lazy workflow (later): same pipeline, input = URL / rough notes / topic → the Article
Generation framework (§7) drafts, then the same structure→check→preview→publish steps.

Internal prompts live server-side (§7). The founder never writes or sees a prompt.

---

## 4. Languages

Registry supports (architecture-ready, **not all activated**):
`en`, `ms-MY`, `th-TH`, `vi-VN`, `id-ID`, `fil-PH`, `ja-JP`, `ko-KR`, + future.
**Launch = EN + MS only.** TH/VI/etc. remain inactive.

Per-language definition (already partly in `locales.ts`; extend):
- **editorial profile**: tone/register per market (e.g. MS = Bahasa Melayu Malaysia,
  not Indonesian; enforced by termbase + QA contamination lexicon).
- **terminology**: per-locale termbase (exists for MS).
- **SEO metadata**: localized title/description (LOCALIZE policy).
- **URL**: `/{locale}/{segment}/{localized-slug}`.
- **canonical**: self; **hreflang**: cluster of *published* locales only (exists).
- **reviewer**: per-locale native reviewer (external human; AC14).
- **status + publishing gate**: per-variant, independent (exists).

Do not hard-code anything that assumes only 4 locales (the registry is the single
source; adding a language = one entry + termbase + reviewer, no redesign).

---

## 5. Content-quality layer (automatic checks)

Runs as *advisory checks surfaced to the founder* before publish (extends the existing
QA/gate). Checks flag; the founder decides. **Do not force FAQs or headings for SEO.**

- one logical **H1**; sensible **H2/H3 hierarchy**; headings that are *useful*, not stuffed
- **title**, **slug**, **meta description** present + sane length
- **key takeaway / direct answer** when the query type warrants it (not forced)
- **FAQ** only when genuinely useful (never auto-inflated)
- **source attribution + citations**; **author** + **reviewer**; **published/modified dates**
- **image** + **alt text**
- **links** valid; **internal links** proposed; no **duplicate content**
- **unsupported claims** flagged (semantic QA already checks number/date integrity)
- **formatting** sane; **indexability** correct (noindex only when intended)
- **structured-data consistency** (schema matches visible content)

This layer is the front line against scaled-content-abuse demotion (audit §1.1): it
pushes every page toward people-first, sourced, differentiated content.

---

## 6. SEO / AI-search — one unified discoverability system

No "GEO hacks" (Google: AIO/AI Mode use core Search; no special schema — audit §1.2).
One system serves web Search *and* AI answers:

- **title tag, H1, meta description** (localized) — exists/extend
- **canonical** (self) + **hreflang** (published-locale cluster) — exists, correct
- **robots** — MODIFY: disallow `/ops`,`/launch`; explicit AI-crawler stance
  (*allow OAI-SearchBot and equivalent search bots; decide GPTBot/Google-Extended
  training separately*) — audit §1.3
- **sitemap** — exists (shard per-locale at scale)
- **breadcrumbs** — exists (BreadcrumbList JSON-LD)
- **Article schema** — MODIFY: add Article/NewsArticle for the article type (currently
  falls back to WebPage) with **Person author + reviewer**, datePublished/dateModified
- **Organization/WebSite** context — add site-level once
- **other schema only where genuinely applicable** (SoftwareApplication for tools,
  FAQPage only when a real FAQ exists) — no fabricated ratings/reviews (already the rule)
- **image SEO** (alt, dimensions), **internal linking** (proposed at authoring),
  **crawlability**, **page experience**
- **multilingual**: localized metadata + hreflang + provenance
- **author/reviewer signals + content freshness + source provenance** (SourceSnapshots)
  — the E-E-A-T + trust surface that both Google and ChatGPT reward

**AI-search reporting**: use Search Console's Gen-AI performance report for AI
*impressions*; track ChatGPT/other referrals server-side. Do **not** design metrics
that need AI click/CTR data Google doesn't expose (audit §1.2).

---

## 7. Article generation framework (internal; founder never sees prompts)

Reusable generator; inputs may be: finished article (default), URL, topic, rough
notes, research package, news, official announcement, product update. Output (always):
- structured **article** (H1/H2/H3, takeaway, optional FAQ)
- **SEO metadata** (title/description/slug)
- **sources + citations**
- **recommended internal links**
- **monetization opportunities** (tools from the commercial DB, disclosed)
- **image requirements** (what image + alt)
- **translation-ready structure** (maps to Variant fields for MS)

Prompt architecture is server-side, versioned, and composed from: role + house style
+ content-quality rules + termbase + commercial-matching instructions. The founder
sees *outputs and proposals only*. Provider = existing Translator/LLM abstraction
(swap-safe). Everything is a proposal gated behind the publish click.

---

## 8. Commercial engine (first-class tool database)

A new `tools` (commercial) collection — the monetization spine. Fields (minimum):
`tool, vendor, category, audience, pricing, freePlan, affiliateAvailable,
commission, commissionType, cookieDuration, recurring, affiliateUrl, sourceUrl,
lastVerified, disclosure, status`.

Rules:
- **Commission info must carry a verification date**; re-verify quarterly. Never assume
  a program is live permanently (audit §1.4 — Notion closed its program).
- Prefer **≥2 live programs per category** so one closure isn't fatal.
- Article CTAs must be **useful before commercial** — recommend the genuinely best fit
  (including free-plan tools), disclose the affiliate relationship, never mislead.
- **Affiliate links are server-side redirects** (`/go/<tool>`), so clicks are measurable
  and the destination URL can change without editing content.

---

## 9. Email (minimum, later)

Do not build an email service. Define the seam:
- **newsletter** + **signup form** (inline + lead-magnet page)
- **lead magnet** (one genuinely useful asset, e.g. a Malay AI-tools starter guide)
- **article attribution** (which page drove the signup) + **conversion measurement**
- integrate a hosted provider (ESP) later behind a thin interface; store subscriber
  intent/attribution in NALU, delivery in the ESP.

---

## 10. Digital products (future compatibility only)

No payments now. Design so products can *originate from proven content demand*:
templates, playbooks, workflow packs, prompt packs, mini-courses. Validation before
build = a **waitlist** page (audit §5 Gate 5). A product is just another content type
with a fulfillment/payment seam added later.

---

## 11. Monetization metrics (no vanity metrics)

Track only decision-driving numbers, from real records:
traffic (GSC), email subscribers, **affiliate clicks** (server-side), affiliate
conversions/revenue (where the network exposes them), product sales (later),
**revenue per visitor**, commercial-page share, conversion by page, top-earning
articles. Cost side: **Gemini token/cost per published page** (AC17, currently
NOT VERIFIED). No "pageviews as success" theatre.

---

## 12. Dashboard

- **BUILD mode** (`/ops`) — KEEP as-is (criteria-driven progress, no fake %).
- **LIVE / CEO mode** — NEW, **deferred**. Conceptually answers: *"What should Darren
  do today that has the highest probability of producing revenue?"* Sections:
  TODAY'S TOP OPPORTUNITIES · READY TO PUBLISH · REVIEW REQUIRED · TOP TRAFFIC ·
  TOP COMMERCIAL PAGES · AFFILIATE CLICKS · REVENUE · EMAIL · TOP CONVERSION ·
  BLOCKERS. Built only after monetization data exists to populate it.

---

## 13. Founder experience (major product requirement)

A simple interface, minimal CMS jargon. Eventual primary actions:
**RESEARCH · CREATE · REVIEW · PUBLISH.** The founder **never needs Claude Code to
publish an ordinary article** (this is a hard requirement). Today's gap: authoring is
raw Payload admin — technical. The founder UI (NEW build) wraps the existing gated
pipeline in plain language: paste → see checks in plain words → see proposed links &
tool recommendations → preview → Publish.

---

## 14. Smallest monetizable MVP

1. **Tools commercial collection** (verified affiliate data + disclosure).
2. **Founder authoring UI** over the existing gated publish path (paste → structure →
   check → metadata → link/monetization proposals → preview → Publish).
3. **Content-quality layer** (advisory checks).
4. **Affiliate click tracking** (`/go/<tool>` server-side redirect).
5. Publish a small set of **Comparison / "best AI tool for <task>"** pages (EN + MS).

This is enough to run the founder loop and hit validation Gates 1–3. No payments, no
new languages, no daily research engine, no mass generation.

---

## 15. Validation-before-scale

Follow audit §5 Gates 0–5. **Do not scale content volume until Gates 1–3 pass**
(discoverable → first affiliate clicks → first conversion). This is the guard against
adversarial #20 (lots of content, zero revenue).

---

## The 24 Answers (single source of truth)

1. **What is NALU?** The Malaysian guide to AI tools & workflows for getting real work
   done — an automated-but-human-approved, Malay-first AI knowledge + discovery +
   (affiliate) commerce platform.
2. **Who is it for?** Malaysian (then SEA) workers and small businesses who want to
   *deploy* AI for real tasks and don't know which tool or how — the "implementation
   gap" audience (audit §1.5).
3. **Why would people use it?** Trustworthy, practical, local-language answers to
   "which AI tool for my task, and exactly how" — tested, sourced, in Bahasa Melayu.
4. **Why would they return?** Evergreen workflows they reuse, tool recommendations
   kept current (verification dates), and an email lead magnet that pulls them back.
5. **Why would anyone pay?** Later: digital products (templates/playbooks/prompt packs)
   and B2B training/implementation — sold only after content demand is proven.
6. **How does NALU make money?** Priority: (1) AI/SaaS **affiliate** (recurring),
   (2) owned **email** audience, (3) **digital products**, (4) membership later,
   (5) **B2B** training/implementation later, (6) **ads** supplemental.
7. **Why beat ads-only?** Ads pay per impression/click at commodity rates and push
   toward mass thin content — the exact thing Google demotes (audit §1.1). Affiliate
   + products monetize *intent* and reward differentiated, useful content.
8. **What content should NALU create?** Article, AI Tool, Comparison, Workflow —
   evergreen, practical, sourced, commercially relevant (§2).
9. **What should NALU NOT create?** Commodity AI news at scale; rewritten/stitched
   summaries; auto-inflated FAQs/headings; fabricated ratings; mass low-value pages.
10. **What should be automated?** Structure, SEO/schema/hreflang, translation,
    QA checks, internal-link + monetization proposals, research/opportunity scoring.
11. **What must stay human-approved?** The publish click (EN and MS separately),
    native-language review, and any commercial recommendation.
12. **What does the founder do each day?** RESEARCH (review Today's Top 3) → CREATE
    (paste/approve) → REVIEW (checks + proposals) → PUBLISH. Target ≤30 min; *gated by
    Gate 0*.
13. **What does Claude build?** The platform: commercial engine, founder UI, quality
    layer, tracking, dashboards, pipeline — never the founder's day-to-day publishing.
14. **What does ChatGPT/AI research?** Opportunity discovery, drafting, structuring,
    metadata, translation, QA, monetization matching — all as *proposals*.
15. **What does the system itself do?** Runs the pipeline (structure→SEO→translate→
    QA→monetize→queue), tracks metrics, re-verifies commercial data, surfaces the
    top opportunities and the ready-to-publish queue.
16. **Smallest monetizable MVP?** §14.
17. **What existing code remains (KEEP)?** Payload, Source+Variant, translation/QA/
    review/publish gates, SEO metadata/hreflang, migrations/types, `/ops` Build mode,
    provenance, slug-history, categories (audit §3).
18. **What must change (MODIFY)?** Content types→4; JSON-LD (Article+author/reviewer);
    robots (AI-crawler stance + block /ops,/launch); nav/locales; add quality layer.
19. **What must be removed/deferred?** Nothing removed. DEFER: extraction/Playwright,
    fixture pipeline, research engine, email, digital products, LIVE dashboard, payments.
20. **What proves product-market fit?** Gate 1 (discoverable cluster) + returning
    readers + Gate 4 (email cohort) — people find, use, and come back.
21. **What proves monetization?** Gate 2 (first affiliate clicks) → Gate 3 (first
    confirmed conversion). Revenue-per-visitor trending up on commercial pages.
22. **When do we scale?** Only after Gates 1–3 pass on a small set — then increase
    volume within cost/page limits (adversarial #16).
23. **When do we add Thai?** After EN+MS is operating (Gate 0) *and* MS shows real
    demand or AI-citation traction, and a native TH reviewer is secured. Not before.
24. **When do we add Vietnamese?** After Thai is validated the same way; VN's very high
    native-language usage (89%) makes it attractive, but sequence discipline holds:
    one new language at a time, each gated on a reviewer + demand signal.
