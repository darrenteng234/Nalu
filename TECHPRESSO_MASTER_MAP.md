# TECHPRESSO ACADEMY — MASTER RECONNAISSANCE MAP

**Recon date:** 2026-09-05
**Target:** `https://academy.techpresso.co` (public, unauthenticated inspection only)
**Our project:** `~/Desktop/NATIVE/Website project/techpresso-clone`
**Mode:** RECONNAISSANCE ONLY — no build, no scrape, no translation, no i18n implemented.
**Evidence basis:** `robots.txt`; `sitemap.xml` (2,056 URLs); SSR HTML + JSON-LD of 21 representative pages, one per template; Next.js RSC payloads. Companion files: `TECHPRESSO_ROUTE_INVENTORY.csv`, `TECHPRESSO_FEATURE_MATRIX.md`.

> Honesty note: I inspected **21 pages in depth + all 2,056 sitemap URLs by pattern**. I did NOT open all 2,056 individually. Claims below are marked **UNKNOWN — REQUIRES DECISION** or **INACCESSIBLE** where evidence is missing. Counts are from the sitemap (reliable); interaction/behavior claims from client JS are marked where not confirmed.

---

## 0. Source Scope & Access Boundary (AUTHORITATIVE — resolves D7, 2026-09-05)

Permission covers **only Techpresso content that is freely accessible / publicly visible without a paid subscription.** It does **NOT** cover subscription-gated / member-only content. This boundary governs the whole project.

**IN SCOPE (public, no subscription):**
- all freely accessible public pages & page structure/navigation
- public/free content generally
- **public tutorial OVERVIEW content** (TL;DR / Who this is for / What you'll build + metadata)
- publicly accessible prompts; public prompt collections
- public AI tool pages
- public categories / taxonomy (`?category=` tags)
- public learning-path / collection information (guided-path ordering, step titles, times, tools)
- public reviews; public comparisons; public free tools
- public blog / news / update content
- public role-based pages (`/ai-for/*`)
- public SEO metadata (titles, descriptions, JSON-LD, breadcrumbs)
- other content explicitly available without subscription

**OUT OF SCOPE (gated — do NOT extract, reproduce, or design around):**
- subscription-gated tutorial **Instructions** bodies
- gated videos
- dashboard-only content; private search (`/dashboard?search=`)
- saved lists (`/my-list`); private playbooks (`/playbooks`)
- private community content (Telegram / member area)

**Rules:** Do not bypass any access restriction. Do not attempt to obtain gated content through technical workarounds (no auth replay, no paywall circumvention, no scraping of member endpoints). Extract only what is publicly served.

**Tutorial content — mandatory distinction:**
- **PUBLIC OVERVIEW** = in scope. May be extracted, structured, translated, published.
- **GATED INSTRUCTIONS / VIDEO** = out of scope. Not extracted. The target platform **must not falsely represent that it contains the gated source material.** Where instructions would sit, the platform shows only what we authored/own or a clear "full steps available in the paid source" style boundary — never a copy of gated text we did not obtain.

**Authorized multilingual pipeline (the only sanctioned flow):**
```
PUBLIC SOURCE → EXTRACT → STRUCTURE → ENGLISH MASTER
  → MALAY / THAI / VIETNAMESE → LOCALIZE → VALIDATE → REVIEW → PUBLISH
```
Architecture stays **capable of ingesting additional authorized source data later** (if gated rights are granted in future), but we **do not design around obtaining gated content now.**

---

## 1. Executive Summary

Techpresso Academy is a **Next.js (App Router, React Server Components)** AI-learning content platform. Its public surface is dominated by **programmatically generated SEO pages**: 1,395 prompt pages, 366 tutorials, 97 tool pages — ~91% of all routes. It is **English-only (no hreflang, no i18n)**.

The product is best understood as a **content-database → templated-page → schema-rich-SEO pipeline**, not a hand-authored site. Each entity type (prompt, tutorial, tool, review, comparison, role, collection, community post, blog post) has:
- a flat 2-segment URL (`/<section>/<slug>`),
- a fixed page template,
- a distinct JSON-LD schema recipe tuned for that content type.

Write/interactive features (accounts, saved lists, dashboard, playbooks, community submission) are **gated behind auth and Disallowed in robots.txt** — INACCESSIBLE publicly.

**Business model (browser-confirmed):** freemium. Public = tutorial *Overview* + all the SEO pages (prompts, tools, roles, compare, reviews, blog, community showcase). Paid ($19–40/mo, $499 lifetime, via **external Dupple checkout**) unlocks the tutorial *Instructions* body + video, in-dashboard search, saved lists, the Deals marketplace, and a private **Telegram** community. **Our v1 = the public/SEO layer + multilingual; the member area & payments are a separate later concern.**

**Our opportunity/differentiator:** a multilingual (MS/TH/VI → Asian languages) version. Techpresso provides **no i18n reference** — we design that layer from scratch.

**Biggest risks (detailed in §21):** scale (thousands of pages × N languages), source drift (Techpresso changes content), translation correctness at volume, and avoiding manual QC of every page.

---

## 2. Complete Page Inventory

From `sitemap.xml` (2,056 URLs), classified by URL pattern (full per-URL list in `TECHPRESSO_ROUTE_INVENTORY.csv`):

| page_type | count | route pattern |
|---|---:|---|
| prompt_page | 1,395 | `/prompts/<slug>` |
| tutorial | 366 | `/courses/<slug>` |
| tool_page | 97 | `/tools/<slug>` |
| blog_post | 61 | `/blog/<slug>` |
| community_post | 32 | `/community/<slug>-<hash>` |
| review | 21 | `/reviews/<slug>` |
| collection | 20 | `/collections/<slug>` |
| role_page | 18 | `/ai-for/<role>` |
| tool_compare | 14 | `/compare-tools/<a>-vs-<b>` |
| free_tool | 13 | `/free-tools/<slug>` |
| course_compare | 8 | `/compare/<competitor>` |
| hub | 9 | `/courses` `/prompts` `/tools` `/free-tools` `/blog` `/community` `/reviews` `/compare` `/compare-tools` |
| learning_paths | 1 | `/learn` |
| homepage | 1 | `/` |
| **total** | **2,056** | — |

**Discovery reporting (Phase 1):**
- Total routes discovered: **2,056** (sitemap) + 9 hub routes (included).
- Successfully inspected in depth: **21** (one+ per template).
- Inaccessible (robots Disallow, require login): `/admin/`, `/api/`, `/auth/`, `/welcome/`, `/dashboard/`, `/my-list/`, `/playbooks/`.
- Duplicate routes: none observed (all canonical self-referential).
- Uncertain routes: `/learn` (only 1 URL; per-path routes not in sitemap → likely client-rendered or gated).
- Excluded (by robots): the 7 Disallowed prefixes above.
- Remaining unknowns: any routes not in sitemap and not linked publicly (cannot prove absence).

---

## 3. URL Architecture

- **Flat, 2-segment, human-readable slugs.** `/<section>/<slug>` for all detail pages. No nested taxonomy in the URL (no `/prompts/chatgpt/sales`).
- **Programmatic slug composition** for prompts: `<tool>-prompts-<role-or-topic>` (e.g. `grok-bot-prompts-sales`, `grok-bot-prompts-finance`). One tool × many roles/topics = many pages. This is the primary SEO footprint mechanism.
- **Comparisons** encode both operands in slug: `chatgpt-vs-claude`, `claude-opus-vs-sonnet`.
- **Reviews** use a question slug: `is-claude-pro-worth-it`.
- **Community** appends a random hash to guarantee slug uniqueness on user content: `reconcile-expenses-from-receipts-wagjdx`.
- Every page: `rel=canonical` self-referential, `robots: index, follow`.
- **No locale segment** anywhere (no `/en/`, no `?lang=`). Adding one is our decision (see §20).

---

## 4. Feature Inventory

See `TECHPRESSO_FEATURE_MATRIX.md` for the full matrix with status + evidence. Summary of public, confirmed-LIVE features: homepage, global nav/footer, site search (schema present), tutorials, prompts, prompt collections, tools directory, tool pages, tool-vs-tool compare, course-platform compare, reviews, role pages, community feed (read), blog, free interactive tools, extensive JSON-LD SEO. Gated/INACCESSIBLE: auth, dashboard, my-list, playbooks, welcome, api, admin.

---

## 5. Course / Tutorial System (Phase 3) — RESOLVED via browser 2026-09-05

- **Listing:** `/courses` hub. **Filtering RESOLVED:** category filter via query param `/courses?category=<slug>` (real hrefs, server-navigable). ~11 course categories observed: administrative, content-creation, data-analysis, general (Fundamentals), hr, innovation-r-d, marketing, operations, productivity, project-management, strategy-management.
- **Detail page** (`/courses/introduction-to-claude`) — rendered structure:
  - Left sidebar: "Back to courses" + **Table of Contents** (anchor links to section headings).
  - Banner image, H1 title.
  - **Category tags** (each links to `/courses?category=<slug>`).
  - **Metadata row:** datePublished (e.g. "Apr 2, 2025"), readTime (e.g. "6 min read"), difficulty (Beginner), **linked tool** (`/tools/claude`).
  - Short description.
  - **Tabs: "Overview" | "Instructions"** (client-side tabs).
    - **Overview = PUBLIC → IN SCOPE (see §0):** TL;DR, Who this is for, What you'll build. Extractable/translatable/publishable.
    - **Instructions = PAYWALLED → OUT OF SCOPE (see §0):** renders an "Unlock the full AI Academy — $19/mo" upsell + "Already a member? Sign in" (`/login`), NOT the tutorial body. **We do not extract or reproduce this, and must not represent our platform as containing it.**
  - **Related Tutorials** block (3 cards: title, readTime, difficulty).
- **Schema:** `Course`, `CourseInstance`, `EducationalAudience`, `Offer`, `Article`, `BreadcrumbList`, `ImageObject`, `WebPage`.
- **Data fields (confirmed):** title, banner image, category[] (tags), datePublished, readTime, difficulty, tool_ref, description, TOC sections[], Overview{tldr, who-for, what-build}, **Instructions body (gated)**, related tutorials[], optional "Video" badge.
- **VIDEO — RESOLVED:** FAQ states tutorials are "Both" (text + step-by-step video walkthroughs, new weekly); a "Video" badge marks tutorials that have one. **No video player renders publicly** — video lives inside the paywalled Instructions/member view. Per-tutorial video existence = INACCESSIBLE. **Per your rule we will NOT produce videos** → treat video as an optional, non-required field we leave empty / host-only.
- **Lesson prev/next, completion tracking:** GATED (member dashboard) — INACCESSIBLE publicly.
- **Related content:** "Related Tutorials" block confirmed public.

---

## 6. Prompt System (Phase 4) — the core of the product

- **Scale:** 1,395 prompt pages = 68% of all routes.
- **Not isolated articles — a data-model-driven matrix.** Slugs reveal the model: `<tool> × <role/topic>`. Example family observed: one tool spawns ~30+ role/topic variants (sales, marketing, finance, engineering, recruiting, support, research, ops, founders, travel, content, …).
- **Detail template** (`/prompts/grok-bot-prompts-sales`): H1 topic title; multiple H2 **prompt-group sections**; H2 **Frequently Asked Questions**.
- **Schema:** `CollectionPage` (the page is a collection of prompts) + `FAQPage` + often `Article` + `Person`.
- **Implied data model:** `Prompt` entity (text, title, maybe variables) grouped under a `PromptPage`/`PromptCollection` keyed by (tool, role/topic). Copy-to-clipboard + variable substitution are client behaviors — **UNKNOWN/unconfirmed**.
- **`/collections/<slug>`** (20) is a second, curated grouping axis (e.g. `learn-claude`, `sales-lead-generation`) using `CollectionPage`+`Course`+`ItemList` — collections mix prompts and courses.
- **Scaling mechanism:** template + data rows. To add pages you add data rows (tool/role combos), not hand-written pages.

---

## 7. AI Tool System (Phase 5) — RESOLVED via browser 2026-09-05

- **Directory:** `/tools` hub; `ItemList` + `SoftwareApplication` schema.
- **Detail page** (`/tools/gumloop`) rendered structure: breadcrumb (Courses / Tools / {Tool}); H1 "**{Tool} Tutorials**"; one-paragraph tool description; tutorial count (e.g. "4 tutorials"); category tags; a "Video" badge; then a **list of related tutorials** (each: PUBLISHED date, difficulty, category tags, description, tool).
- **The tool page is a tool→tutorials index, not a rich tool profile.**
- **SoftwareApplication schema fields (confirmed, from JSON-LD):** `name`, `@id`, `description`, `url`, `applicationCategory: "AI Tool"`, `image`. **NO `price`, `offers`, `aggregateRating`, or free/paid field present.** Plus an `ItemList` of related `Course`s.
- **Tool data model (do NOT assume more):** name, slug, description, applicationCategory, image, related_tutorials[]. Pricing/free-paid/features/reviews are **NOT observable on the tool page** — do not invent them.
- **Relationships surfaced on the tool page:** tool → tutorials ONLY. Tool↔prompts, tool↔reviews, tool↔comparisons exist site-wide (via slug conventions) but are **not linked from the tool page itself**.
- **Categories — RESOLVED:** categories are tags; filtering is via `/courses?category=<slug>` query param, not a dedicated route.

---

## 8. Learning Paths (Phase 6) — RESOLVED via browser 2026-09-05

- **`/learn` is a public hub of learning paths**, grouped into: **START HERE**, **BY ROLE**, **BY USE CASE**, **BY GOAL**, **ADVANCED**.
- **Each path card** shows: title, description, step count (e.g. "8-step path"), estimated time (e.g. "~52 min"), difficulty (e.g. "Beginner to Intermediate"), "+N more to explore", and links to **`/collections/<slug>`**.
- **Key finding: learning paths ARE the collections.** The 14 path cards map 1:1 to the `/collections/` slugs (ai-fundamentals, prompting-essentials, sales-lead-generation, marketing-ads, finance-data, hr-recruitment, automation-nocode, video-visual, build-apps, research-deep-work, start-business, job-hunting, content-creation, ai-agents, plus learn-<tool> variants). No separate "learning path" data type.
- **Collection / path page** (`/collections/ai-fundamentals`) rendered structure:
  - Title + description.
  - **"GUIDED PATH — Follow the path, step by step"**: step count · est. time · difficulty + **"Start the path"** CTA.
  - **Ordered steps 1..N**, each: step label (UP NEXT / STEP n), tutorial title, difficulty, time, tool.
  - "Finish" marker.
  - **"All N {topic} tutorials"** — the full (larger) topic tutorial list beyond the curated path.
- **So a collection = a curated ordered subset (the path) + the full topic list.** Public and fully observable.
- **Progress / completion tracking:** implies account → GATED / INACCESSIBLE. Step tutorials themselves are paywalled (Instructions gated).
- **CTAs:** "Start the path" and step links go into the (paywalled) tutorial pages; role/goal grouping is presentation metadata on the collection.

---

## 9. Community / Workflows (Phase 7)

- **Feed:** `/community` hub; 32 public posts.
- **Post** (`/community/<slug>-<hash>`): H1 title + H2 **Discussion**. Schema: `TechArticle`, `Person` (author), `InteractionCounter` (upvotes/engagement), `BreadcrumbList`, `WebPageElement`.
- **Read is public.** **Write/participation is gated AND OFF-SITE:** per the FAQ, after signup users get an invite to a **private Telegram community** (~1,600 members). The on-site `/community` is a **read-only public showcase** (workflow cards: tool tag, difficulty, "saves ≈Nh/week", author, upvote/used counts), NOT an on-site forum. Submission/upvote/comment/profiles → member/Telegram, INACCESSIBLE.
- Homepage community cards carry a client-side **role tab filter** (Marketing/Sales/Content/HR/Legal/…).
- Slug+hash pattern confirms user-generated content with server-assigned unique IDs.
- **Implication:** we do NOT need to build a forum for v1 — read-only imported showcase is enough; real community can stay on an external channel (Telegram/other).

---

## 10. Compare / Reviews / Free Tools (Phase 8)

**Compare tools** (`/compare-tools/<a>-vs-<b>`, 14): tool-vs-tool. Schema `Review`+`Rating`+`SoftwareApplication`+`FAQPage`+`Article`+`Person`. Rating source UNKNOWN.
**Compare (course platforms)** (`/compare/<competitor>`, 8): Techpresso vs Udemy/Coursera/DeepLearning.AI/etc. Schema `Product`+`Offer`+`Brand`+`FAQPage` — positions Academy as the product against competitors (monetization/conversion intent).
**Reviews** (`/reviews/is-X-worth-it`, 21): long-form buyer guides (sampled: ~16 H2 sections incl. price math, alternatives, verdict, FAQ, related). Schema `Review`+`Rating`+`SoftwareApplication`+`Article`+`FAQPage`. Likely affiliate/monetization angle.
**Free tools** (`/free-tools/<slug>`, 13): client-side utilities (prompt optimizer, excel-formula generator, cold-email generator, cost calculator, "which AI tool", "can AI do my job", etc.). Schema `SoftwareApplication`+`FAQPage`+`Offer`. Some may call a backend/AI API — **UNKNOWN**. Lead-gen / top-of-funnel role.

**Deals / marketplace (RESOLVED, browser):** exists — homepage "Save $3,000,000+" / "570+ deals" section + a "Deals Marketplace" FAQ entry. Link → `account.dupple.com/dashboard/deals-login/` (member-gated, off-academy domain). Deal cards show tool, offer, "Save up to $X". Deal data behind login = INACCESSIBLE. **Monetization model observed:** subscription ($19–40/mo, $499 lifetime) via external Dupple checkout + affiliate/partner deals; reviews/comparisons feed conversion. All payments external — out of our v1 scope.

---

## 11. Blog / Update System (Phase 8 cont.)

- `/blog` hub + 61 posts. Schema `BlogPosting`+`BreadcrumbList`+`WebPage`+`ImageObject`.
- Sampled slugs are topical/programmatic (many "grok-bot-for-<role>"). Publish cadence **UNKNOWN**.

---

## 12. Search (Phase 9) — RESOLVED via browser 2026-09-05

- **`SearchAction.target` = `https://academy.techpresso.co/dashboard?search={search_term_string}`.**
- `/dashboard` is **login-gated** (Disallowed in robots). So the declared search entry point routes into the **member dashboard**.
- **There is NO public site-search UI** — the header has no search box/icon on any inspected page — **and no public search-results route.**
- Query params, autocomplete, ranking, filters, empty states inside the dashboard: **INACCESSIBLE** (member-only).
- **Public content discovery is by navigation/hubs/category-filter (`?category=`)/related-links, not by search.**
- Implication for us: on-site search is a member feature. Our public/SEO layer relies on the same discovery mechanics (hubs + category filters + internal links + sitemap), which we can and should reproduce.

---

## 13. Navigation & Information Architecture (Phase 10) — RESOLVED via browser 2026-09-05

### Header (flat, NO dropdowns)
Left→right: logo (`/`), **Courses** (`/courses`), **AI Tools** (`/tools`), **Learning Paths** (`/learn`), **Compare** (`/compare`), **Prompts** (`/prompts`) [with a "Free" badge], **Free tools** (`/free-tools`), **Login** (`/dashboard`), **Get Started** (`/#pricing`), and a mobile **"Toggle menu"** button.
- Hover on nav items produces **no dropdown** — confirmed flat.
- **Conditionally visible:** Login + Get Started are the logged-out state (logged-in users hit `/dashboard`). Mobile shows the toggle-menu button.
- Trial CTAs throughout point to **external Dupple checkout** (`checkout.dupple.com` / `account.dupple.com`).

### Footer (`contentinfo`) — 4 groups + social
- **Brand:** "AI Academy by Techpresso"; social: X (`x.com/techpresso_en`), LinkedIn (`linkedin.com/company/techpressodupple`). Copyright "© 2026 Dupple."
- **Platform (11):** Courses, AI Tools, Learning Paths, Compare, Prompt Library (`/prompts`), Free tools, Community, AI Tool Reviews (`/reviews`), Blog, Newsletter (→ external `techpresso.co`), Contact (`#contact`).
- **AI by Role (18):** business, sales, marketers, finance, hr, entrepreneurs, product-managers, data-analysts, excel-users, consultants, project-managers, customer-service, customer-success, recruiters, lawyers, real-estate, sales-prospecting, teams — matches the 18 `/ai-for/` sitemap routes.
- **Prompt Library (24 curated):** hand-picked `/prompts/chatgpt-prompts-<topic>` links (resume, interview, marketing, sales, seo, social-media, business, finance, real-estate, hr, lawyers, project-management, writing, coding, research, students, ecommerce, branding, youtube, design, photos, travel, health, self-discovery). These are internal-linking/SEO anchors into the programmatic prompt pages.

### Primary sections
Courses, AI Tools, Free Tools, Learn (=Collections), Prompts, Community, Compare, Compare-tools, Reviews, AI-for-<role>, Blog.

### Cross-linking
Every detail template ends with a "Related …" block; footer injects 42+ deep internal links (roles + prompts) on every page → dense, uniform internal linking (see §14).

### Pricing / commerce (bonus, resolved)
Pricing is the **`#pricing` section on `/`** (not a route): Monthly $40, Annual $19/mo (7-day trial, "$252 OFF"), Lifetime $499, Teams (SSO, per-seat, "Talk to us"). All purchase CTAs are **external on Dupple**. Community access = **private Telegram** invite after signup (FAQ). Support = `louis@dupple.com`.

---

## 14. SEO Architecture (Phase 11) — the growth engine, mechanisms observed

Not "good SEO" hand-waving — concrete, observed mechanisms:

1. **Programmatic page generation at scale.** 1,395 prompt + 366 tutorial + 97 tool + 61 blog pages from templates+data. Each `<tool>×<role/topic>` combination is its own indexable URL → captures long-tail queries ("grok bot prompts for sales").
2. **Per-template JSON-LD recipes** (observed `@type`s per page type):
   - Home: `Product`, `AggregateRating`, `Review`, `Offer`, `FAQPage`, `SearchAction`, `Organization`.
   - Tutorial: `Course`, `CourseInstance`, `EducationalAudience`, `Offer`, `Article`, `Breadcrumb`.
   - Prompt: `CollectionPage`, `FAQPage`, `Article`, `Person`.
   - Tool: `SoftwareApplication`, `Course`, `ItemList`, `Breadcrumb`.
   - Review / Compare-tools: `Review`, `Rating`, `SoftwareApplication`, `FAQPage`, `Article`.
   - Community: `TechArticle`, `Person`, `InteractionCounter`, `Breadcrumb`.
   - Role: `CollectionPage`, `Course`, `FAQPage`.
   - Blog: `BlogPosting`, `Breadcrumb`.
3. **FAQPage schema on nearly every template** → eligible for FAQ rich results / AI-answer citations.
4. **BreadcrumbList** on detail pages → breadcrumb rich results + crawl structure.
5. **Self-canonical + index,follow** everywhere → no index dilution.
6. **Clean flat slugs** with keywords in the path.
7. **Dense internal linking** via "Related" blocks + hub→detail + collection→item + tool↔prompt↔review cross-refs → strong internal PageRank flow.
8. **Comprehensive sitemap.xml** (2,056 URLs) → full crawl coverage.
9. **AI-crawler-aware robots.txt** — explicitly names 47 agents incl. GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc., allowing content crawl while Disallowing app/auth paths → optimizing for AI-answer visibility, not just classic SEO.
10. **Review/Rating/Offer schema** on commercial pages → price + rating rich snippets.

**Recurring pattern:** template → data → schema-per-type → internal links → sitemap. Reproducible and the heart of what we must rebuild (schema-per-type is MUST for v1).

---

## 15. Content Relationships

```
Tool ──< related Tutorials (Course schema on tool page)
Tool ──< Prompt pages (keyed by tool)
Tool ──< Reviews (is-X-worth-it)
Tool ──< Comparisons (a-vs-b)
Prompt page ──< Prompts (CollectionPage → items)
Collection ──< Prompts + Courses (curated mix)
Role (/ai-for) ──< Courses + Prompts + FAQ (CollectionPage)
Tutorial ──< Related Tutorials; ──> Tool; ──> (Learning path?) UNKNOWN
Community post ──> Author (Person); has InteractionCounter
Every detail page ──> "Related" block (dense internal linking)
```

---

## 16. Current Content Scale (Phase 12)

Reliable counts (sitemap): prompts 1,395; tutorials 366; tools 97; blog 61; community 32; reviews 21; collections 20; roles 18; tool-compares 14; free-tools 13; course-compares 8. **Total ~2,056 indexable pages.**

**Backend nature (observed, not guessed):** Next.js App Router + RSC. Content is **data-driven** — page bodies are hydrated from embedded RSC payloads, and the volume + templating pattern indicate a **CMS or database behind a build/render pipeline**. Exact backend (headless CMS vs DB vs API) is **NOT observable** → UNKNOWN. What IS certain: it is templated data, not hand-authored HTML.

---

## 17. Update / Freshness Observations (Phase 13)

- `sitemap.xml` is the reliable change-detection surface (URL add/remove).
- Date/update signals: `Article`/`BlogPosting`/`Course` schema carry date fields (datePublished/dateModified) — usable for change detection per page.
- Community posts appear continuously (user-generated) → high-churn section.
- Reviews reference "in 2026" → periodically refreshed dated content.
- **Reliable change-detection inputs for our pipeline:** (a) sitemap diff for add/remove; (b) per-page `dateModified` in JSON-LD; (c) content hash of extracted fields. Cadence of Techpresso's own updates **UNKNOWN**.

---

## 18. Local Clone Audit (Phase 14)

Local project state: **untouched cloner template.**

| status | finding |
|---|---|
| MATCHED | Base stack aligns with target: Next.js (template is Next 16 / React 19 / Tailwind v4 / shadcn) vs target Next App Router. Good foundation. |
| PARTIAL | Only the default scaffold route `src/app/page.tsx` exists. `docs/research/INSPECTION_GUIDE.md` + a `comparison.png` present (template artifacts). |
| MISSING | **Everything else.** No `/courses`, `/prompts`, `/tools`, `/reviews`, `/compare`, `/ai-for`, `/community`, `/blog`, `/collections`, `/free-tools`, `/learn`. No `src/components/sites/*`. No cloned data, no schema layer, no i18n. |
| WRONG | None yet (nothing built to be wrong). |
| UNKNOWN | Whether to clone page-by-page (cloner template approach) or rebuild data-first (recommended — see §23). |

Conclusion: the `/clone-website` pipeline has **not been run**. We are at zero. This is actually good — it lets us choose the right architecture (data-first) rather than pixel-cloning 2,056 pages.

---

## 19. Proposed Content / Data Model (Phase 15) — proposal only, NOT implemented

**Rationale:** Techpresso is template+data. Pixel-cloning 2,056 individual pages is the wrong altitude and impossible to translate/maintain. Model the **entities and relationships**, then render templates × locales. This makes multilingual a first-class dimension instead of a retrofit.

**Core entities** (each = a source record + N locale records):
- `Tool` (name, slug, category, pricing, free/paid, description, links)
- `Prompt` (title, body, variables[], tool_ref, role/topic tags)
- `PromptPage` (tool_ref × role/topic → groups Prompts; FAQ[])
- `Collection` (curated list of Prompt/Course refs)
- `Tutorial` (title, subtitle, difficulty, tool_ref, **tldr, who-for, what-build** [PUBLIC/in-scope], related[], dates, author). **`instructions_body` and `video` are OUT OF SCOPE (§0)** — modeled as optional fields we own/author ourselves or leave empty; never populated from gated Techpresso content, never misrepresented as containing it.
- `Review` (tool_ref, verdict, sections[], rating, FAQ[])
- `Comparison` (subtype: tool-vs-tool | course-platform; operands, table, FAQ[])
- `RolePage` (`/ai-for/<role>`: curated courses+prompts+FAQ)
- `CommunityPost` (read-only import: title, body, author, interactionCount) — **document only, community write EXCLUDED v1**
- `BlogPost` (title, body, dates)
- `FreeTool` (client utility spec) — **LATER**

**Translation/localization layer (our differentiator):**
```
SourceRecord (canonical, English)
  ├─ source_version (hash + timestamp)   ← change detection
  └─ Translation[locale] {
        locale, fields{...}, status(draft|mt|reviewed|published),
        source_version_ref,               ← detect stale translations
        translated_at, reviewed_by
     }
```
- **Field-level, not page-level** translation records → a one-paragraph source change re-translates one field, not the page.
- **Non-translatable fields flagged** (code blocks, prompt variables `{{var}}`, tool names, URLs) → never sent to MT.
- **Relationships stored by ref** (IDs), language-agnostic → internal links survive translation.
- **SEO fields per locale** (title/desc/slug/JSON-LD) generated per template, with `hreflang` cluster linking locale siblings.

Why this model: supports EN source + MS/TH/VI + future langs, source versioning, field-level updates, relationship integrity, per-locale SEO, and automated validation gates. Detailed defense in §21.

---

## 20. Multilingual Architecture Requirements (Phase, our net-new layer)

Techpresso gives **no reference** (English-only). Requirements we must satisfy:
1. **Locale routing** — decide URL scheme (Open Decision D1): `/ms/…` path prefix (recommended, best SEO), vs subdomain, vs `?lang`.
2. **`hreflang` clusters** — every page links its locale siblings + `x-default`. (Techpresso has none; we add.)
3. **Per-locale slugs** — translate slugs too (`/ms/petua/...`) or keep English slugs? Open Decision D2.
4. **Field-level translation store** keyed to source version (from §19).
5. **Non-translatable protection** — prompts w/ variables, code, tool/brand names, URLs.
6. **Per-locale JSON-LD + metadata**, `inLanguage` set correctly.
7. **Fallback policy** — missing translation → fall back to English or hide? Open Decision D3.
8. **RTL** not needed for MS/TH/VI/CJK/KO/JA; Burmese/others later — keep layout logical-property-based anyway.

---

## 21. Adversarial Review (Phase 16) — mandatory

For each: RISK → WHY → DETECT → PREVENT → AUTOMATION?

1. **10× content volume (~20k pages).** WHY: programmatic generation multiplies fast. DETECT: build-time page count + sitemap size monitor. PREVENT: data-first model, incremental static regeneration / on-demand render, no per-page hand work. AUTOMATION: **Yes** (fully).
2. **10 languages.** WHY: pages × locales = 20k×10 = 200k. DETECT: matrix coverage report (entities × locales). PREVENT: field-level translation records + shared templates; render on demand, don't pre-build all. AUTOMATION: **Yes**, with cost controls.
3. **One source page changes.** WHY: Techpresso edits content. DETECT: sitemap diff + per-page `dateModified` + content hash. PREVENT: source_version bump marks all locale translations stale. AUTOMATION: **Yes**.
4. **Only one paragraph changes.** WHY: minor edits common. DETECT: field-level hash diff. PREVENT: re-translate only the changed field, not the page. AUTOMATION: **Yes** (this is why field-level model).
5. **A translation is wrong.** WHY: MT errors, nuance. DETECT: automated validators (length ratio, placeholder integrity, glossary adherence, back-translation similarity) + human review queue for flagged items. PREVENT: status gate (mt → reviewed → published); high-risk types (reviews, legal) require human. AUTOMATION: **Partial** — detect yes, guarantee no; sample QC.
6. **Prompt contains variables (`{{name}}`).** WHY: MT can mangle placeholders. DETECT: placeholder-count + token match pre/post. PREVENT: mask placeholders before MT, restore after; validator blocks publish on mismatch. AUTOMATION: **Yes**.
7. **Page contains code.** WHY: MT translates code = broken. DETECT: detect code fences/inline code. PREVENT: mark code non-translatable, pass through verbatim. AUTOMATION: **Yes**.
8. **Internal link changes.** WHY: slug/relationship edits. DETECT: referential-integrity check (all refs resolve). PREVENT: store links by entity ID, resolve slug at render per locale; broken-ref report blocks build. AUTOMATION: **Yes**.
9. **Source URL disappears.** WHY: Techpresso removes a page. DETECT: sitemap diff (removed URLs). PREVENT: soft-delete + redirect policy; don't hard-delete translations. AUTOMATION: **Yes** (flag for human redirect decision).
10. **Techpresso adds a new page type.** WHY: product evolves. DETECT: sitemap URLs not matching known patterns → "unclassified" alert. PREVENT: pipeline routes unknowns to a human triage queue; never auto-guess a template. AUTOMATION: **Partial** — detect yes, new template = human.
11. **Translation missing.** WHY: pipeline lag, new content. DETECT: coverage matrix (entity × locale gaps). PREVENT: fallback policy (D3) + gap dashboard. AUTOMATION: **Yes**.
12. **Metadata duplicated.** WHY: template bug → duplicate title/desc across pages hurts SEO. DETECT: uniqueness check on title/desc/canonical per locale at build. PREVENT: metadata templated from unique entity fields; validator blocks dupes. AUTOMATION: **Yes**.
13. **Page published in wrong language.** WHY: locale mislabel. DETECT: language-detect published body vs declared locale mismatch. PREVENT: locale stamped on record + detection gate before publish. AUTOMATION: **Yes**.
14. **MT produces unsafe/incorrect formatting.** WHY: markdown/HTML corruption. DETECT: markdown/HTML parse + structural diff (heading count, list count, link count pre/post). PREVENT: structured (field/segment) translation, not whole-blob; parser gate. AUTOMATION: **Yes**.
15. **20,000+ prompts need updating.** WHY: bulk source refresh. DETECT: batch diff report. PREVENT: queue + rate-limited batch re-translation of only changed fields; idempotent jobs. AUTOMATION: **Yes**, with cost/rate budget.
16. **Avoiding manual QC of every page.** STRATEGY: automated validator gates (1–14 above) catch mechanical errors; **risk-tiered human review** — high-stakes types (reviews, comparisons, anything with claims/ratings) sampled or fully reviewed; low-risk bulk (prompts) validator-gated + spot-check. AUTOMATION: **Mostly** — full automation for mechanical correctness, human for meaning on high-risk tiers.

### NEW risks discovered in the browser pass (2026-09-05)

17. **Tutorial bodies are paywalled — and OUT OF SCOPE (§0).** WHY: only the Overview is public; Instructions body + video sit behind $19/mo. DECISION (D7 resolved): we extract **only the public Overview**; we do **not** obtain, scrape, or bypass gated Instructions/video, and the platform must not misrepresent that it holds them. PREVENT: model `instructions_body`/`video` as optional fields we own or leave empty; validator forbids populating them from gated Techpresso content. AUTOMATION: **Yes** (scope enforced at ingest — extractor only reads public URLs/fields).
18. **Hard dependency on external Dupple for checkout + Telegram for community.** WHY: Techpresso offloads payments/community off-domain. DETECT: n/a. PREVENT: decide our own commerce + community strategy (own checkout? external? none in v1?); don't assume we inherit Dupple. AUTOMATION: **No** — business decision.
19. **We will not produce videos, but video is now a headline feature.** WHY: our product rule excludes video; Techpresso markets "video walkthroughs weekly". DETECT: parity check per tutorial. PREVENT: position text-first as the product; leave a `video` field optional/empty; never fabricate a video reference. AUTOMATION: **Yes** (field left null + validator forbids fake video URLs).
20. **Programmatic/low-quality source pages waste translation budget.** WHY: much of the 1,395-prompt + blog corpus is templated, and some blog slugs look like thin programmatic filler ("grok-bot-for-<role>"). Translating everything at 3–10 languages multiplies cost on low-value pages. DETECT: content-quality/length/uniqueness scoring at ingest. PREVENT: **translate by priority tier** (high-traffic/high-value first), gate thin pages out or defer. AUTOMATION: **Yes** — scoring + tiered queue.
21. **Freshness pressure: "10–15 new tutorials weekly."** WHY: source adds content continuously. DETECT: sitemap diff + `dateModified`. PREVENT: incremental pipeline sized for weekly deltas, not one-time import. AUTOMATION: **Yes**.

**Verdict on first architecture:** page-level pixel-cloning **fails** adversarial review (breaks at #2,#4,#6,#7,#15, and is now also impossible for tutorial bodies per #17). **Field-level, data-first, ref-linked model with validator gates + priority-tiered translation survives.** That is the recommended architecture. **Its hard precondition is D7 (do we own the source data?).**

---

## 22. Open Decisions (require your approval before build)

- **D1 — Locale URL scheme:** `/ms/…` path prefix (recommended) vs subdomain vs query param.
- **D2 — Translate slugs?** English slugs across locales (simpler, some SEO loss) vs localized slugs (best local SEO, more machinery). 
- **D3 — Missing-translation fallback:** show English vs hide page vs "translation coming".
- **D4 — v1 scope:** which entity types ship first? (Recommend: prompts + tutorials + tools + roles first — highest volume + SEO value.)
- **D5 — Community:** read-only import, or excluded entirely from v1? (Write is gated/excluded per your rule.)
- **D6 — Free tools:** rebuild client utilities now or LATER? (Recommend LATER.)
- **D7 — Content source: RESOLVED (2026-09-05).** Scope = **public/free content only** (see §0). Gated tutorial Instructions, videos, dashboard, private search, saved lists, playbooks, private community are **OUT OF SCOPE** — not extracted, no workarounds. Public source (tutorial Overviews, prompts, collections, tools, roles, categories, reviews, comparisons, free tools, blog, SEO metadata, structure) is the extraction surface. Architecture stays open to future authorized source data. Authorized pipeline: `PUBLIC SOURCE → EXTRACT → STRUCTURE → ENGLISH MASTER → MS/TH/VI → LOCALIZE → VALIDATE → REVIEW → PUBLISH`.
- **D8 — Learning paths:** structure is UNKNOWN/gated — do you have the spec, or defer?
- **D9 — Translation engine:** which MT/LLM for MS/TH/VI, and human-review budget/tiers?
- **D10 — Backend/CMS:** headless CMS (e.g. Sanity/Payload) vs custom DB for the source+translation model?

---

## 23. Recommended Build Order (proposal)

0. **You resolve D1–D6, D8–D10.** (D7 RESOLVED — public-only scope, §0.) Extraction and every downstream step operate ONLY on in-scope public content per §0, via the authorized pipeline `PUBLIC SOURCE → EXTRACT → STRUCTURE → ENGLISH MASTER → MS/TH/VI → LOCALIZE → VALIDATE → REVIEW → PUBLISH`.
1. **Foundation:** locale routing (D1), i18n scaffolding, `hreflang`, base layout/nav/footer, design tokens from Techpresso.
2. **Data model + source store** (D10) for the top entities (D4).
3. **Templates per type** (tutorial, prompt, tool, role) + per-type JSON-LD schema layer (the SEO engine — MUST).
4. **Translation pipeline** (field-level, versioned, validators, review queue) — build the machine before bulk content.
5. **Seed English source** for a small vertical slice (e.g. 1 tool + its prompts + tutorials + role page) end-to-end.
6. **Translate slice → MS**, run all validator gates, human-review, publish. Prove the loop.
7. **Scale out** entity types + volume; add TH, VI.
8. **LATER:** compare/reviews (higher QC), free tools, community (read-only), learning paths (pending D8).

**Do not** bulk-scrape or bulk-translate until steps 1–6 prove the loop on a slice.

---

## STOP

Reconnaissance complete. No implementation started. Awaiting the MASTER BUILD instruction + decisions D1–D10.

**Browser render pass — all 5 flagged follow-ups CLOSED (2026-09-05):**
1. Header/footer enumeration — RESOLVED §13.
2. Site search — RESOLVED §12 (gated `/dashboard?search=`, no public search).
3. Tool-page data model — RESOLVED §7 (tool→tutorials index; minimal schema, no pricing).
4. Tutorial video — RESOLVED §5 (paywalled Instructions; video is a gated member feature; no public player).
5. Learning-path internals — RESOLVED §8 (paths = collections, ordered guided steps).

Bonus resolutions: pricing/plans (§13), Deals marketplace (§10), community=Telegram (§9), category filtering `?category=` (§5/§7), freemium paywall model (throughout). New risks added §21 (#17–21). #1 blocker escalated: **D7 — source data access** (tutorial bodies are paywalled, not scrapeable).
