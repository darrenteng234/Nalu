# 01 — PRODUCT SPEC

**Project:** Multilingual (Asian-language) reproduction of the **public** Techpresso Academy experience.
**Status:** Specification. NOT yet implemented.
**Date:** 2026-09-05.
**Inputs:** `TECHPRESSO_MASTER_MAP.md`, `TECHPRESSO_FEATURE_MATRIX.md`, `TECHPRESSO_ROUTE_INVENTORY.csv`, locked decisions (this doc).
**Companion specs:** `02_CONTENT_SYSTEM.md`, `03_TRANSLATION_LOCALIZATION.md`, `04_QA_AUTOMATION.md`, `05_MASTER_BUILD_INSTRUCTION.md`, `06_ADVERSARIAL_REVIEW.md`.

---

## 0. Locked decisions (authoritative)

| # | Decision | Locked value |
|---|---|---|
| 1 | Language URL structure | **Path-prefix per locale for every language** (`/en`, `/ms`, `/th`, `/vi`). Reasoning in §11. |
| 2 | Slug strategy | **Localized slugs, keyed to a stable content ID**, with slug-history redirects + hreflang by content ID. Reasoning in §12. |
| 3 | Missing translations | **Publish per language independently.** A locale renders only its published entities; never block the site on an incomplete locale. |
| 4 | Content scope | **ALL public/free Techpresso content types** discovered in recon. |
| 5 | Community | **Reproduce public read-only showcase only**; architect for a future owned community. |
| 6 | Free tools | **Reproduce the public directory/pages/UX only**; architect so individual tool logic can be added later. |
| 7 | Translation/localization | **Major engineering subsystem** (see `03`). Pivot = English canonical; **never relay-translate** through a third language. |
| 8 | CMS/DB | **Both** — a scalable content database **and** a non-developer editing/review workflow. |

**Access boundary (hard rule):** we use only public/free content normally visible without a subscription. We do **not** reproduce, scrape, bypass, or reconstruct subscription/member-only content, and do **not** bypass authentication, paywalls, access controls, or gated APIs. See §5.

---

## 1. Product purpose

Give Southeast-Asian (initially Malay, Thai, Vietnamese) professionals a **native-language** version of the public Techpresso Academy: AI tutorials (public overviews), a large prompt library, an AI-tool directory, comparisons, reviews, role-based landing pages, learning paths/collections, free-tool directory, blog, and a public community showcase — all engineered to reproduce Techpresso's **organic-search reach** in each target language.

The product's two differentiators over the source:
1. **Native localization** (not literal translation) into Asian languages the source does not offer.
2. **Multilingual SEO** (hreflang, per-locale metadata/slugs/sitemaps) the source lacks entirely (Techpresso has **no** hreflang; it is English-only).

## 2. Target users

- **Primary:** working professionals in Malaysia, Thailand, Vietnam (marketers, sales, analysts, HR, PMs, founders, etc. — matching the 18 role pages) who want practical AI skills in their own language.
- **Secondary:** organic search visitors landing on long-tail prompt/tool/compare/review pages in their language.
- **Later:** paid members (out of v1), team/enterprise (out of v1).

## 3. V1 scope (IN)

All **public** content types, each as a data-driven page template with per-locale variants:

- Homepage / landing
- Global header + footer navigation (flat; enumerated in `TECHPRESSO_MASTER_MAP.md` §13)
- Tutorials — **public Overview only** (TL;DR / Who this is for / What you'll build + metadata + related)
- Tutorial listing + **category filter** (`?category=`)
- Prompts (programmatic pages) + prompt listing
- Prompt collections
- Learning paths (= collections rendered as guided ordered steps) + `/learn` hub
- AI tools directory + tool pages (tool→tutorials index)
- Compare (course-platform) + Compare-tools (tool-vs-tool)
- Reviews ("is-X-worth-it" public content)
- AI-by-role pages (`/ai-for/*`)
- Blog / news / updates
- Community **public read-only showcase**
- Free-tools **directory + page information + UX shell** (not full tool logic)
- Public SEO metadata + structured data for every type
- Per-locale sitemaps, robots, hreflang
- Our own **public search** over our own catalog (Techpresso's search is gated; we build our own)

## 4. Explicit out-of-scope (V1)

- Gated tutorial **Instructions** bodies; gated **videos**
- Member **dashboard**, private **search** (`/dashboard?search=`), **saved lists** (`/my-list`), **playbooks**
- Private/Telegram **community** infrastructure (posting, upvotes, profiles, moderation)
- **Payments / checkout / subscriptions** (Techpresso uses external Dupple; ours is a later decision)
- Individual **free-tool functionality** (UX shells only in v1)
- Producing our own **videos** (explicit user rule)
- Account/auth system (later)

## 5. Source / access boundary

- **IN SCOPE:** everything publicly served without login — public pages, public metadata, public related content, public tutorial Overview/TL;DR, prompts, collections, tools, categories/taxonomy, learning-path public info, reviews, comparisons, free-tools directory info, blog, role pages, navigation/structure, SEO metadata.
- **OUT OF SCOPE:** gated Instructions, gated video/member content, dashboard-only content, private search, saved lists, playbooks, private community.
- **Rules:** no bypassing access restrictions; no scraping member endpoints; no paywall/auth circumvention; the target platform must **never misrepresent** that it contains gated source material. Where gated Instructions would sit, the platform shows only content we author/own or a clear boundary notice.
- **Extraction rule:** the ingestion pipeline reads only public URLs and public fields; scope is enforced at ingest (see `02`, `04`).

## 6. Public Techpresso feature inventory (target product surface)

From recon (`TECHPRESSO_FEATURE_MATRIX.md`). Counts are current sitemap scale, not a v1 import target (v1 imports a pilot first — see `05`).

| Type | Public? | In v1 | Route pattern |
|---|---|---|---|
| Homepage | yes | yes | `/{locale}` |
| Tutorial (overview) | yes (overview) | yes | `/{locale}/courses/<slug>` |
| Tutorial listing + category | yes | yes | `/{locale}/courses?category=` |
| Prompt page | yes | yes | `/{locale}/prompts/<slug>` |
| Prompt listing | yes | yes | `/{locale}/prompts` |
| Collection / learning path | yes | yes | `/{locale}/collections/<slug>`, `/{locale}/learn` |
| Tool page | yes | yes | `/{locale}/tools/<slug>` |
| Tool directory | yes | yes | `/{locale}/tools` |
| Compare (platform) | yes | yes | `/{locale}/compare/<slug>` |
| Compare tools | yes | yes | `/{locale}/compare-tools/<slug>` |
| Review | yes | yes | `/{locale}/reviews/<slug>` |
| AI-by-role | yes | yes | `/{locale}/ai-for/<role>` |
| Blog post | yes | yes | `/{locale}/blog/<slug>` |
| Community showcase | yes (read) | yes (read-only) | `/{locale}/community[/<slug>]` |
| Free-tool directory/page | yes (info) | yes (shell) | `/{locale}/free-tools[/<slug>]` |
| Search | gated | our own | `/{locale}/search` |
| Pricing/deals/dashboard/etc. | gated/external | no | — |

## 7. Page / content types

Each type is a **content entity** (source of truth, English canonical) + **N locale variants**, rendered by one template. Full field lists in `02_CONTENT_SYSTEM.md`. Public tutorial entities carry Overview fields only; `instructions_body`/`video` are optional, owned-or-empty, never gated-sourced.

## 8. Navigation

Reproduce the public IA (see `TECHPRESSO_MASTER_MAP.md` §13), localized per locale:
- **Header:** Courses, AI Tools, Learning Paths, Compare, Prompts, Free tools + language switcher (new) + (future) auth CTA placeholder. Flat, no dropdowns.
- **Footer:** Platform, AI by Role (18), Prompt Library (curated internal links), social, legal, language switcher. All labels localized; targets resolve per-locale slug.
- **Language switcher (new):** switches to the current entity's sibling variant in the chosen locale (by content ID); falls back to the locale home if no variant exists.

## 9. Information architecture

Hub → detail, dense internal linking. Every detail page carries a "Related" block and role/prompt footer links (the SEO mesh). IA is identical per locale; only language + slugs differ. See `02` for the relationship graph.

## 10. Language architecture

- **Locales (v1):** `en` (canonical source), `ms` (Malaysian Malay), `th` (Thai), `vi` (Vietnamese).
- **Extensible:** adding a locale = adding a locale code + its variants + validators (no architecture change). Future: id, zh-Hans, zh-Hant, ja, ko, my, fil, etc.
- **Independence:** each locale publishes independently (decision 3). A page exists in a locale only when that locale's variant is `published`.
- **English is always the pivot** for translation; never relay (decision 7).

## 11. URL architecture (decision 1 — reasoning)

**Locked: path-prefix for every locale — `/{locale}/...`, e.g. `/ms/prompts/<slug>`.**

Why over subdomain / ccTLD / query-param:
- **One domain's authority is shared** across all locales (subdomains/ccTLDs split authority; a new product cannot afford that).
- **Simplest correct hreflang + sitemap** generation and lowest ops cost; no per-locale DNS/TLS/registration.
- **Scales to 10+ Asian locales** by adding a path segment, nothing else.
- **Google-supported** and unambiguous for the crawler (locale is in the path, not inferred).
- Query-param locales are the weakest for indexing and are rejected.

Rules:
- Every locale is explicitly prefixed, **including English (`/en`)** — uniform, avoids root/`/en` duplicate-content ambiguity.
- Root `/` issues a **302** to a locale by `Accept-Language` (default `/en`); `/` is not itself indexed as content.
- `x-default` hreflang → `/en`.
- Locale codes are ISO 639-1 (`ms`, `th`, `vi`); reserve BCP-47 region form (`zh-Hans`) for future.

## 12. Slug strategy (decision 2 — reasoning)

**Locked: localized slugs, keyed to a stable content ID.**

- Each entity has an immutable **`content_id`** (ULID). Slugs are per-locale, human-readable, localized (`/ms/petua/...` uses a Malay slug), because in-language slugs measurably help local SEO and CTR.
- **hreflang clusters are built by `content_id`**, not by slug — so localized slugs never break cross-locale linking.
- **Canonical** = the page's own localized URL (self-canonical per locale).
- **Slug history:** every slug change writes a history row; old slugs **301** to current. Prevents link rot as translations are refined.
- **Collision control:** slugs unique per (locale, type); generator de-dupes with a numeric suffix; validator blocks collisions (see `04`).
- English slugs may mirror the source's public slugs where sensible; localized slugs are generated in the localization pipeline and human-checkable.

## 13. SEO architecture

SEO is a **first-class subsystem, not polish** (see `06` §SEO and `04`). Reproduce Techpresso's observed mechanisms, made multilingual:
- **Programmatic page breadth** — templates × data rows generate long-tail coverage (tool×role prompt matrix, compare pairs, is-X-worth-it, ai-for-role).
- **Per-type JSON-LD recipes** (Course, SoftwareApplication, Review/Rating, FAQPage, BreadcrumbList, CollectionPage, BlogPosting, ItemList) — generated per locale with correct `inLanguage`.
- **Dense internal linking** (related blocks + footer role/prompt mesh) resolved per locale.
- **Per-locale** titles/descriptions/H1s/slugs, **hreflang** clusters, **per-locale sitemaps** + a sitemap index, `robots` allowing crawl of public content and disallowing any app routes.
- **Freshness** signals (`dateModified`) surfaced per entity.
- **Uniqueness** enforced (no duplicate titles/descriptions within a locale) — validator-gated.

## 14. Responsive / mobile requirements

- Mobile-first; the source is responsive with a mobile toggle menu. Match breakpoints behavior (desktop ≥1024, tablet 768, mobile 390-ish).
- Logical-property CSS (inline/block) so future RTL/complex scripts (Burmese, etc.) need no rewrite.
- Core Web Vitals budget (see `04` performance checks): LCP < 2.5s, CLS < 0.1, INP < 200ms on mid-tier mobile.

## 15. Search (our own)

- Techpresso search is member-gated → out of scope as a source.
- We build **our own public search** over our own catalog: `/{locale}/search?q=`, locale-scoped, server-side index (Postgres full-text or a search service), returns our published entities in that locale. Empty-state + related suggestions. Detailed later (post-v1 acceptable; directory/nav discovery works without it).

## 16. Public / community experience

- Reproduce the **read-only** public community showcase (workflow cards: tool tag, difficulty, "saves ≈Nh/week", author, counts) as content entities.
- No posting/upvoting/profiles in v1. Architect a `CommunityPost` entity + author + interaction counters as data so an owned community can be layered on later.

## 17. Free-tools experience

- Reproduce the **directory + individual tool landing pages + UX shell** (title, description, FAQ, schema) as content entities.
- Tool **logic** is stubbed behind a capability interface (`FreeTool.implementation_ref`) so each utility can be implemented later without touching the directory/SEO layer.

## 18. Future monetization placeholder

- No payments in v1. Reserve: a `Plan`/`Offer` content type (unused), a pricing route placeholder, and CTA slots (localized) that currently point to a configurable URL. No external checkout wired.

## 19. Future community architecture

- `CommunityPost`, `Author`, `Interaction` entities exist as read-only in v1. Future: auth + write API + moderation queue can attach to the same entities without schema rework.

## 20. Future language expansion

- Adding a locale is a data + config operation: register locale code, run the translation pipeline, pass validators, publish. No template or schema changes. Target roster documented in `TECHPRESSO_MASTER_MAP.md` §20.

## 21. Analytics / event architecture

- Privacy-respecting analytics (self-hostable, e.g. Plausible/Umami or GA4 if required), locale-tagged.
- **Event taxonomy (minimal v1):** `page_view{locale,type,content_id}`, `language_switch{from,to}`, `search{locale,query,results}`, `related_click`, `cta_click{target}`, `outbound_click`. Enough to measure per-locale organic performance and internal-link efficacy without heavy instrumentation.

---

## Recommended platform stack (engineering recommendation, not a business decision)

- **Framework:** Next.js App Router (React Server Components) — matches the source and the existing template (Next 16.3.0). Locale via a `[locale]` route segment.
- **Rendering:** SSG + Incremental Static Regeneration / on-demand revalidation, so 2k→100k pages render at scale without per-request cost; ISR revalidates on content publish.
- **Content DB + CMS (decision 8 — both):** **Postgres as source of truth + Payload CMS** (self-hosted, Postgres-native, built-in localization, drafts/versioning, access control, non-dev admin + review workflow). *Alternative:* Sanity (hosted content lake, GROQ, strong localization) if a managed service is preferred over self-hosting. Rationale + trade-offs in `02` and `06`.
- **Translation:** LLM-based (Claude models) per-field, glossary-injected, English-pivot, with the QA gates in `03`/`04`. Never relay through a non-English language.
- **Deploy:** Node host with ISR support (Vercel or a Node server); this is the Next.js clone, independent of the other project's cPanel setup.

*This stack is a recommendation derived from the requirements + SEO/engineering best practice; `06` challenges it. If any part needs a business call (e.g. hosted vs self-hosted CMS, analytics vendor), it is isolated in the final report — not assumed silently.*
