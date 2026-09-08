# NALU — Commercial Reconstruction Audit

Purpose: decide NALU's positioning, classify the existing code against a
monetization-first operating model, ground the decision in current (2026)
evidence, and stress-test the business. **No code was changed to produce this
document.** Companion: `docs/specs/NALU_MONETIZATION_MASTER_SPEC.md`.

Evidence labels: **CERTAIN** (primary source / Google-Search-Central / OpenAI
docs, consistent), **LIKELY** (multiple secondary sources agree), **ASSUMPTION**
(reasoned, unverified). No traffic or revenue numbers are invented.

---

## 1. Research findings (2026)

### 1.1 Google Search — people-first & scaled-content abuse
- **CERTAIN**: Google's spam policy treats *scaled content abuse* as generating many
  pages primarily to manipulate rankings with little user value — **"no matter how
  it's created"** (AI or human). Google ran an August 2026 spam update
  specifically targeting scaled content abuse.
- **CERTAIN**: "People-first content" remains the stated bar; thin affiliation and
  stitched/rewritten content are explicitly called out.
- **Implication for NALU**: the naïve "generate 1,000 AI pages for AdSense" model is
  the single most likely way to get the whole domain demoted. NALU's founder-
  clicks-publish gate, human review, and non-commodity/first-hand angle are not
  optional niceties — they are the survival condition.
- Sources: Google Search Central spam policies; industry write-ups of the Aug 2026 update.

### 1.2 AI Overviews / AI Mode (Google) & AI-search
- **CERTAIN**: AI Overviews and AI Mode are grounded in core Search ranking and the
  Search index. Google states there is **no separate "AI SEO" trick and no special
  schema** required — normal SEO best practices make a page eligible.
- **CERTAIN**: Search Console's **Search Generative AI performance report** rolled out
  to all sites by Aug 31 2026. It reports **impressions** from AI features (AIO +
  AI Mode) by page/country/device/date. It does **not** separately expose AI
  clicks, CTR, queries, or conversions.
- **Implication**: reject invented "GEO hacks". Build one clean SEO system. Do not
  design monetization metrics that depend on AI-click data Google does not provide;
  measure affiliate clicks ourselves (server-side redirect) and AI *impressions*
  from the Console report.
- Sources: Google Search Central "AI Features and Your Website"; Search Central blog
  "Search Generative AI performance reports" (Jun 2026).

### 1.3 OpenAI / ChatGPT search discoverability
- **CERTAIN**: OpenAI runs three separable crawlers — **GPTBot** (model training),
  **OAI-SearchBot** (ChatGPT search citations), **ChatGPT-User** (live user fetch).
  Appearing in ChatGPT Search requires **allowing OAI-SearchBot**; training can be
  blocked independently.
- **Implication**: NALU should adopt an explicit robots stance — *"do not train on
  me, but do cite me"*: allow OAI-SearchBot (and equivalent search bots), decide on
  GPTBot/Google-Extended separately. Current `robots.ts` does neither and also
  fails to disallow `/ops` and `/launch`.
- Sources: OpenAI crawler docs consensus; multiple 2026 webmaster guides.

### 1.4 AI/SaaS affiliate economics & volatility
- **CERTAIN**: AI-tool affiliate programs commonly pay **recurring** commissions
  (e.g. Jasper ~25% recurring for 12 months, 45-day cookie, paid via Impact).
  Cookie windows of 30–90 days are typical.
- **CERTAIN (volatility)**: programs open and close — Notion's affiliate program is
  **closed to new applicants** as of 2026. Commission terms change without notice.
- **Implication**: affiliate is a credible *primary early* revenue stream, but every
  commercial record must carry a **last-verified date** and a **status**; NALU must
  never hard-assume a program is live. Recurring commissions reward *recommending
  tools people keep using* (workflow/comparison content) over one-off news.
- Sources: 2026 SaaS/AI affiliate roundups; Jasper & Notion program pages.

### 1.5 Malaysia AI adoption & the implementation gap
- **LIKELY**: ~12% of Malaysian SMEs had adopted AI meaningfully as of 2024; individual
  knowledge-worker usage is far higher (~24% "Frontier Professionals", above a ~16%
  global figure). The bottleneck is **converting training into operational
  deployment** — an "implementation gap".
- **LIKELY**: adoption expands when AI is embedded in tools people already use.
- **Implication**: the highest-value Malaysian audience is not "AI enthusiasts who
  want news" — it is **workers and small businesses who want to actually deploy AI
  to get work done** and don't know which tool or how. That is a *practical, tool-
  and-workflow* need with natural commercial intent.
- Sources: Malaysian SME GenAI adoption studies (ResearchGate); Malaysia AI usage 2026 write-ups.

### 1.6 Southeast Asia localization opportunity
- **CERTAIN**: ~70% of Gemini prompts in SEA are in native languages (Vietnam 89%,
  Thailand 87%, Indonesia 84%); Gemini is the best-performing LLM for SEA languages
  (SEA-HELM). SEA is among Gemini's fastest-growing regions (users doubled in a year).
- **LIKELY**: ~46% of ASEAN companies have moved beyond AI pilots to scaling vs ~35%
  globally (McKinsey/EDB/Tech in Asia).
- **Implication**: local-language content is a **real moat**, not a nice-to-have.
  NALU's Source+Variant architecture (independent per-locale publish) + Gemini MS
  translation is aimed exactly at the region's structural advantage. Malay-first,
  then TH/VI/ID, is strategically correct.
- Sources: Google "Gemini Southeast Asia Report 2026"; Singapore EDB "AI in SEA" report.

---

## 2. Positioning decision (CEO)

Criteria weighed: Malaysian demand, SEA expansion, monetization, search + AI-search
potential, affiliate + digital-product + B2B potential, competition, automatability,
founder effort, defensibility.

| Option | Verdict | Why |
|--------|---------|-----|
| **A. AI news** | **REJECT** | Saturated; commodity; perishable; low commercial intent; highest exposure to scaled-content-abuse demotion; heavy daily burden — the opposite of a 15–30 min/day model. |
| **B. AI education (courses)** | **REJECT as primary** | Competes with YouTube/Coursera/creators; monetization (products/membership) is slow and needs payments we are not building; weak affiliate intent. Good *supporting* format, not the spine. |
| **C. Practical AI for work/business** | **STRONG (as the audience/positioning)** | Directly matches the Malaysian implementation gap; high commercial intent; B2B upsell path; defensible via local context. Slightly abstract as a *content format*. |
| **D. AI tools + tutorials + workflows + recommendations** | **STRONG (as the content engine)** | Best affiliate fit (recurring SaaS commissions); evergreen (avoids news saturation & scaled-content risk); exactly the content AI Overviews/ChatGPT cite (comparisons, "best X for Y", how-to); highly automatable; digital-product upsell (templates/playbooks) falls out naturally. |
| **E. Hybrid (unfocused)** | **REJECT as stated** | An undifferentiated blend dilutes topical authority and confuses the audience. A *disciplined* combination of C and D is not this. |

### Recommendation — ONE positioning
**NALU = the Malaysian guide to AI tools & workflows for getting real work done.**
Content engine **D**, aimed at audience **C**, localized Malay-first. One sentence:
*"Which AI tool should I use, and exactly how do I use it, for my work — in Bahasa
Melayu."* News is at most a *trigger* for evergreen tool/workflow content, never the
product.

This wins on every weighted axis that matters early: commercial intent (tool
recommendations → recurring affiliate), AI-search citation surface (comparisons +
how-to), defensibility (local language + local context + verified commercial data),
automatability (structured tools/workflows), and founder effort (evergreen, not a
daily news treadmill).

---

## 3. Existing-system audit (classification)

Legend: **KEEP** (works, fits) · **MODIFY** (keep core, adapt) · **DEFER**
(working but not needed for monetization MVP) · **NEW** (build later).

| Component | Where | Verdict | Note |
|-----------|-------|---------|------|
| Payload CMS 3.88 + Postgres | `payload.config.ts` | **KEEP** | Solid backbone; migrations + types now working (Phase 3). |
| Source + Variant architecture | `collections/Sources.ts`, `Variants.ts` | **KEEP** | Crown jewel. Language-neutral Source + per-locale Variant with independent publish = exactly what multilingual monetization needs. |
| Article type | `constants.ts`, articles routes | **KEEP / MODIFY** | Keep; extend with commercial fields (see §4, spec). |
| Content types (tutorial/tool/compare_tools/…) | `constants.ts` | **MODIFY** | Collapse to the 4 that matter (Article, AI Tool, Comparison, Workflow); the others map onto these or defer. No schema churn — `type` is a discriminator. |
| Frontend detail/hub templates | `lib/render/detail.tsx`, `components/templates/Views.tsx` | **KEEP / MODIFY** | Reuse; add commercial CTA slots + author/reviewer display. |
| Site chrome / nav | `components/site/Chrome.tsx` | **MODIFY** | Nav hardcoded to Techpresso IA (tutorials/tools/prompts/collections) and switcher shows all 4 locales. Update to new IA + launch locales only. |
| Locales | `lib/i18n/locales.ts` | **MODIFY** | Add `id`, `fil`, `ja`, `ko` (+ BCP-47 region tags) to the registry for architecture-readiness; **launch stays EN + MS**. Do not activate others. |
| Gemini translation + retry + termbase | `lib/translate/*`, `lib/launch/*` | **KEEP** | Provider abstraction, backoff, termbase all reusable. |
| QA (structural + semantic + gate) | `lib/translate/translation-qa.ts`, `semantic-qa.ts`, `lib/launch/gate.ts` | **KEEP / MODIFY** | Add a *content-quality* layer (H1/heading/alt/claims/citations) on top of translation QA (see spec §Content Quality). |
| Review + publish gates | `lib/launch/transitions.ts`, `publish-guard.ts`, `review.ts` | **KEEP** | Founder-approval model already enforced here. |
| SEO metadata (canonical/hreflang) | `lib/seo/metadata.ts` | **KEEP / MODIFY** | Correct hreflang cluster + canonical. Add author/reviewer + freshness signals. |
| Structured data (JSON-LD) | `lib/seo/jsonld.ts` | **MODIFY** | No `Article` schema for the article type (falls to WebPage); author is Org-only. Add Article/NewsArticle + Person author/reviewer + dates. |
| Sitemap | `app/sitemap.ts` | **KEEP** | Single dynamic sitemap fine now; shard per-locale at scale. |
| Robots | `app/robots.ts` | **MODIFY** | Add `/ops`,`/launch` to disallow; add explicit AI-crawler stance (allow OAI-SearchBot; decide GPTBot/Google-Extended). |
| SlugHistory (301s) | `collections/SlugHistory.ts` | **KEEP** | Redirects by contentId — good. |
| Categories (taxonomy) | `collections/Categories.ts` | **KEEP** | Field-localized taxonomy. |
| SourceSnapshots (provenance) | `collections/SourceSnapshots.ts` | **KEEP** | Valuable for source attribution + copyright defense (§adversarial 13). |
| Extraction + Playwright renderer | `lib/extract/*` | **DEFER** | Real, scope-safe (refuses gated paths), but not needed for the copy/paste MVP. Reuse later for the research engine + "paste a URL" lazy workflow. |
| Pilot pipeline (fixtures) | `lib/pipeline/index.ts` | **DEFER** | Phase-2 fixture pipeline; the launch authoring flow supersedes it for articles. Keep as a batch harness reference. |
| Launch authoring flow | `lib/launch/translate-article.ts`, `app/launch/*` | **KEEP** | The EN→MS gated path is the spine of the founder workflow. |
| `/ops` Build dashboard | `app/ops/*`, `collections/Ops.ts` | **KEEP** | Keep BUILD mode. LIVE/CEO mode = **NEW** (deferred). |
| Migrations + generated types | `src/migrations/*`, `payload-types.ts` | **KEEP** | Phase-3 deliverable; production-safe. |
| Founder authoring UI | — | **NEW** | No founder-facing simple UI yet; today authoring is Payload admin (technical). This is the biggest product gap (see spec §Founder Experience). |
| Commercial/tool database | — | **NEW** | No commercial engine exists. Highest-leverage NEW build. |
| Email / lead capture | — | **NEW** (minimal, later) | None yet. |
| Daily research engine | — | **NEW** (later) | None yet; defer until content→revenue is validated. |

**Nothing working is proposed for deletion.** Removals are all *defers*.

---

## 4. Adversarial review — business model & architecture

Severity: 🔴 existential · 🟠 serious · 🟡 manageable.

| # | Failure | Cause | Sev | Early-warning metric | Cheapest validation experiment | Stop-building trigger |
|---|---------|-------|-----|----------------------|--------------------------------|-----------------------|
| 1 | Google sends little traffic | New site, low authority, AIO zero-click | 🟠 | GSC impressions/clicks flat 8–12 wks on published cluster | Publish 10 strong evergreen pages; watch GSC | If ~0 impressions after indexing + 12 wks, stop scaling content; fix topic/quality first |
| 2 | AI search sends little traffic | Not cited by AIO/ChatGPT | 🟡 | GSC Gen-AI impressions; ChatGPT referrals in logs | Allow OAI-SearchBot; track referrer=chatgpt | If no AI citations after cluster matures, don't over-invest in "AEO" |
| 3 | Affiliate programs reject NALU | No traffic/thin site at application | 🟠 | Application approvals | Apply to 3 low-barrier programs early (some approve pre-traffic) | If all reject, pivot first revenue to digital product/email |
| 4 | Affiliate program changes/closes | Vendor decision (see Notion) | 🟠 | last-verified date age; broken payout | Quarterly re-verify; ≥2 programs per tool category | If a category has 0 live programs, stop pushing that category commercially |
| 5 | AI articles fail to rank | Commodity/rewritten content | 🔴 | GSC impressions per page; indexed-but-no-impressions ratio | A/B: first-hand/tested angle vs generic summary | If human-approved pages still don't rank, the *topic/authority* is wrong — stop mass production |
| 6 | News saturated | Everyone covers the same news | 🟠 | rank position vs large outlets | Compare an evergreen page vs a news page over 60 days | If news never ranks, drop news as a format (keep as trigger only) |
| 7 | Malay search demand insufficient | Small/!English-preferring queries | 🟠 | GSC MS impressions vs EN for same contentId | Publish EN+MS for 10 items; compare demand | If MS gets ~0 demand across topics, keep MS for AI-search/brand, deprioritize MS SEO effort |
| 8 | Users read but don't click | Weak/late CTA, low intent | 🟠 | affiliate click-through rate per commercial page | Move CTA above fold on 5 pages; measure | If CTR stays near-zero on genuinely commercial pages, the audience isn't buyer-intent — rethink positioning |
| 9 | Users click but don't buy | Price/fit/trust | 🟡 | conversions where visible (network dashboards) | Recommend a strong free-plan tool with a paid upgrade | If clicks convert ~never across tools, affiliate isn't the model — shift to products |
| 10 | Email signup weak | No/weak lead magnet | 🟠 | signup rate per visitor | One genuinely useful lead magnet + inline form | If <~1% signup on good traffic, redesign offer before scaling |
| 11 | Digital products don't sell | No demand / no audience yet | 🟡 | pre-orders / waitlist for a product idea | Waitlist page before building any product | If no waitlist interest, don't build the product |
| 12 | Automated research → factual errors | LLM hallucination | 🔴 | reviewer reject rate; post-publish corrections | Founder review + citations required before publish | If error rate stays high after review, tighten sourcing before automating further |
| 13 | Copyright/source problems | Rewriting others' work | 🔴 | manual spot-audit; DMCA/complaints | SourceSnapshots provenance + original angle + quote limits | If content is derivative, stop generation; require first-hand/testing |
| 14 | Content becomes commodity | Same as everyone's AI output | 🔴 | rankings + engagement decay | Add tested screenshots/local pricing/opinion | If pages are indistinguishable from competitors', stop and differentiate |
| 15 | Founder stops operating | Effort creeps past 15–30 min/day | 🔴 | days-since-last-publish; queue age | Time the real daily loop for 2 weeks | If daily loop >30 min consistently, cut scope/automate more before scaling |
| 16 | Automation becomes expensive | Token/API cost per page | 🟠 | cost per published page (activity-log) | Record Gemini token/cost per call (AC17) | If cost/page > plausible revenue/page, cap volume |
| 17 | Gemini unavailable/expensive | Vendor risk | 🟡 | provider error rate; price change | Translator interface already provider-agnostic | If Gemini fails, switch provider behind the interface (no rewrite) |
| 18 | Search engines change | Algorithm/AIO shift | 🟠 | ranking volatility around updates | People-first + provenance = update-resilient | If an update hits, do not chase hacks; double down on quality |
| 19 | Competitors copy NALU | Low barrier to AI content | 🟠 | competitor overlap on queries | Moat = local language + verified commercial data + brand/email | If undifferentiated, invest in the moat, not more pages |
| 20 | Lots of content, zero revenue | No commercial layer / wrong audience | 🔴 | revenue-per-visitor; commercial-page share | Validate monetization on a *small* set BEFORE scaling (see §5) | If commercial validation fails, stop content production entirely and re-decide |

Cross-cutting: failures #5, #12, #13, #14, #15, #20 are **existential** and all point
the same way — **quality + human approval + differentiation + validate-before-scale**.
The operating model must resist the temptation to mass-produce.

---

## 5. Economic validation sequence (validate BEFORE scaling)

No revenue forecasts. Instead, ordered, measurable gates. Each gate must pass on a
*small* content set before producing the next tranche.

- **Gate 0 — Operable**: founder completes the real daily loop (review → publish) in
  ≤30 min for 2 weeks. *If it can't be operated, nothing else matters.*
- **Gate 1 — Discoverable**: a ~10-page evergreen cluster gets non-zero GSC
  impressions (web and/or Gen-AI) within ~8–12 weeks of indexing.
- **Gate 2 — First affiliate clicks**: ≥1 commercial page produces measurable
  affiliate clicks (server-side redirect tracking).
- **Gate 3 — First affiliate conversion**: ≥1 confirmed conversion in a network
  dashboard (proves the click→buyer chain, not just curiosity).
- **Gate 4 — First email cohort**: a lead magnet yields a first subscriber cohort
  (proves owned-audience capture).
- **Gate 5 — First product signal**: a product waitlist gets real sign-ups *before*
  any product is built.
- **Only after Gates 1–3** do we scale content volume. Payments/membership come after
  Gate 5 demand is proven.

---

## 6. The 24 questions — pointer

The 24 strategic questions are answered in
`docs/specs/NALU_MONETIZATION_MASTER_SPEC.md` §"The 24 Answers" (single source of
truth), so the spec and audit don't drift.

---

## 7. CEO recommendation (summary; full version in the chat response)

- **KEEP**: Payload, Source+Variant, translation+QA+review+publish gates, SEO
  metadata/hreflang, migrations/types, `/ops` Build mode, provenance.
- **MODIFY**: content types → 4 (Article, AI Tool, Comparison, Workflow); JSON-LD
  (Article + author/reviewer); robots (AI-crawler stance + block /ops,/launch);
  nav/locales; add content-quality layer.
- **DEFER**: extraction/Playwright, fixture pipeline, daily research engine, email,
  digital products, LIVE/CEO dashboard, payments.
- **NEW**: founder authoring UI (paste→structure→check→metadata→links→monetization→
  preview→publish); commercial/tool database.
- **FIRST MONETIZATION EXPERIMENT**: a handful of high-intent **Comparison /
  "best AI tool for <task>"** pages (EN + MS) with server-side-tracked affiliate
  links to 2–3 tools that have live programs and free plans — instrument clicks,
  target Gates 2–3.
- **EXACT NEXT BUILD PHASE**: **Phase 4 — Commercial Foundation**: (a) Tools
  commercial collection with verification dates + disclosure; (b) founder authoring
  UI over the existing gated pipeline; (c) content-quality layer; (d) affiliate
  click tracking. No payments, no new languages, no mass generation.
