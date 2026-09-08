# TECHPRESSO_FEATURE_MATRIX.md

Reconnaissance date: 2026-09-05. Source: `https://academy.techpresso.co` (public, unauthenticated).
Evidence basis: `robots.txt`, `sitemap.xml` (2,056 URLs), SSR HTML + JSON-LD schema of 21 representative pages, Next.js RSC payloads.

Legend for `techpresso_status`: **LIVE** (observed public), **GATED** (exists but login/member required), **UNKNOWN — REQUIRES DECISION**, **INACCESSIBLE**.
`clone_status` is our local project `~/Desktop/NATIVE/Website project/techpresso-clone` (currently the untouched cloner template — only the default scaffold route exists).
`v1_requirement`: **MUST** / **SHOULD** / **LATER** / **EXCLUDE** — proposed, pending your approval in the Open Decisions.

> **SOURCE SCOPE BOUNDARY (authoritative, D7 resolved 2026-09-05):** permission covers **public/free content only**. Subscription-gated content — tutorial Instructions bodies, videos, dashboard, private search, saved lists, playbooks, private/Telegram community — is **OUT OF SCOPE**: not extracted, no access-restriction bypass, and never misrepresented as present in our platform. Any "gated" row below is documented for understanding only, EXCLUDED as a *source*. We may still build our *own* equivalents from our *own* content (e.g. a public search over our own catalog) — that is a target-platform feature, not reproduction of gated source. Public tutorials: **PUBLIC OVERVIEW = in scope**, **GATED INSTRUCTIONS = out of scope**. Authorized pipeline: `PUBLIC SOURCE → EXTRACT → STRUCTURE → ENGLISH MASTER → MS/TH/VI → LOCALIZE → VALIDATE → REVIEW → PUBLISH`.

| feature | techpresso_status | clone_status | v1_requirement | evidence | unknowns |
|---|---|---|---|---|---|
| Homepage / landing | LIVE | MISSING | MUST | `/` HTTP 200; JSON-LD Product+AggregateRating+Review+FAQPage+SearchAction | — |
| Global nav header + footer | LIVE | MISSING | MUST | **RESOLVED (browser):** header = 6 flat links (Courses, AI Tools, Learning Paths, Compare, Prompts, Free tools) + Login(→/dashboard) + Get Started(→#pricing) + mobile toggle; **no dropdowns**. Footer 4 groups: Platform (11), AI by Role (18), Prompt Library (24 curated), social (X, LinkedIn). © Dupple | — |
| Site search | GATED (members only) | MISSING | SHOULD (our own) | **RESOLVED (browser+JSON-LD):** `SearchAction.target` = `/dashboard?search={term}`; login-gated; **no public search UI/route**. Techpresso's search is OUT OF SCOPE, but we MAY build our own public search over our OWN catalog | in-dashboard search behavior INACCESSIBLE |
| Courses/Tutorials listing | LIVE | MISSING | MUST | `/courses` hub, 366 tutorial pages | filter/sort mechanism client-rendered — UNKNOWN |
| Individual tutorial page | LIVE (public part) | MISSING | MUST | **RESOLVED (browser):** public = TOC sidebar + banner + category[] (`?category=` links) + date + readTime + difficulty + linked tool + Overview tab (TL;DR/who-for/what-build) + Related; **Instructions tab is PAYWALLED** ("Unlock full AI Academy $19/mo") | full Instructions body INACCESSIBLE (member) |
| Tutorial video content | GATED (member) | MISSING | EXCLUDE production (host UI only) | **RESOLVED (browser+FAQ):** homepage/FAQ assert "step-by-step video walkthroughs, new weekly"; **no video player renders publicly** — it sits behind the paywall in Instructions; a "Video" badge marks tutorials that have one | per-tutorial video existence INACCESSIBLE; **user rule: we do NOT produce videos** |
| Prompt library listing | LIVE | MISSING | MUST | `/prompts` hub (1.1 MB SSR) | pagination/filter UNKNOWN |
| Prompt page (programmatic) | LIVE | MISSING | MUST | 1,395 pages `/prompts/<tool>-prompts-<role/topic>`; CollectionPage+FAQPage(+Article+Person) | copy-to-clipboard + variables UNKNOWN (client) |
| Prompt collections | LIVE | MISSING | MUST | `/collections/<slug>`, 20 pages; CollectionPage+Course+ItemList | how items are curated — UNKNOWN |
| AI tools directory | LIVE | MISSING | MUST | `/tools` hub; ItemList+SoftwareApplication | filter/sort client — UNKNOWN |
| Individual tool page | LIVE | MISSING | MUST | **RESOLVED (browser):** page = "{Tool} Tutorials" index. Fields: name, description (1 para), applicationCategory "AI Tool", image, category tags, tutorial count, "Video" badge, **list of related tutorials**. SoftwareApplication schema carries NO price/offers/rating. Only surfaced relationship: tool→tutorials | pricing/free-paid/review-link NOT shown → do not assume they exist as fields |
| Tool categories | LIVE (as tag filter) | MISSING | SHOULD | **RESOLVED:** categories are tags, filtered via `/courses?category=<slug>` query param (~11 course categories observed); no dedicated category route | full tag taxonomy list partial |
| Compare (course platforms) | LIVE | MISSING | SHOULD | `/compare` + 8 pages; Product+Offer+Brand+FAQPage | comparison data source UNKNOWN |
| Compare tools (tool vs tool) | LIVE | MISSING | SHOULD | `/compare-tools` + 14 pages; Review+Rating+SoftwareApplication+FAQ | rating source UNKNOWN |
| Reviews ("is X worth it") | LIVE | MISSING | SHOULD | `/reviews` + 21 pages; Review+Rating+SoftwareApplication+Article+FAQ | rating methodology UNKNOWN |
| Free interactive tools | LIVE | MISSING | LATER | `/free-tools` + 13 utilities (prompt optimizer, excel formula gen, etc.); SoftwareApplication+FAQ+Offer | each is a client app; some may call backend/AI API — UNKNOWN |
| Role / "AI for <profession>" | LIVE | MISSING | MUST | `/ai-for/<role>`, 18 pages; CollectionPage+Course+FAQPage | — |
| Learning paths | LIVE (public) | MISSING | SHOULD | **RESOLVED (browser):** `/learn` = path hub grouped START HERE / BY ROLE / BY USE CASE / BY GOAL / ADVANCED. Each path card → `/collections/<slug>`. **Learning paths ARE the 20 collections**, rendered as an ordered "GUIDED PATH" (steps 1..N, each = title+difficulty+time+tool) + full topic tutorial list + "Start the path" CTA | progress/completion tracking needs account → GATED; step tutorials paywalled |
| Community / workflows | LIVE (read) | MISSING | SHOULD | `/community` + 32 posts `/community/<slug>-<hash>`; TechArticle+Person+InteractionCounter | submission/upvote/comment = write actions, GATED behind `/auth` |
| Blog / updates | LIVE | MISSING | SHOULD | `/blog` + 61 posts; BlogPosting+Breadcrumb | publish cadence UNKNOWN |
| Newsletter | LIVE (external) | MISSING | SHOULD | **RESOLVED:** footer "Newsletter" → `https://techpresso.co` (parent newsletter brand); no on-academy signup form | — |
| Deals / marketplace | LIVE (gated, external) | MISSING | EXCLUDE (source) | **RESOLVED:** homepage "570+ deals / $3M+" + FAQ; link → `account.dupple.com/dashboard/deals-login/` (member) | deal data gated → **OUT OF SCOPE** (no bypass); public marketing copy only |
| Pricing / membership | LIVE (external checkout) | MISSING | EXCLUDE (v1) | **RESOLVED (browser):** `#pricing` section on `/`; plans Monthly $40 / Annual $19 / Lifetime $499 / Teams; CTAs → external Dupple. Payment flow external → **OUT OF SCOPE** for our public/i18n v1 | our own commerce is a separate later decision |
| Community participation | GATED (Telegram) | MISSING | EXCLUDE (v1) | **RESOLVED (FAQ):** after signup users get an invite to a private **Telegram** community; on-site `/community` is a read-only public showcase, not an on-site forum | Telegram side INACCESSIBLE |
| Account / login / auth | GATED | MISSING | EXCLUDE (source) | `/auth/`, `/api/`, `/admin/` Disallowed | flow INACCESSIBLE → **OUT OF SCOPE**; no bypass |
| Saved / bookmarked ("my list") | GATED | MISSING | EXCLUDE (source) | `/my-list/` Disallowed → login | **OUT OF SCOPE** (gated) |
| Playbooks | GATED | MISSING | EXCLUDE (source) | `/playbooks/` Disallowed | member-only → **OUT OF SCOPE** (no access, no bypass) |
| Structured-data / SEO schema layer | LIVE (extensive) | MISSING | MUST | 20+ schema `@type`s across templates | — |
| Sitemap.xml | LIVE (2,056 urls) | MISSING (template default) | MUST | fetched, parsed | regeneration cadence UNKNOWN |
| i18n / multilingual | **ABSENT** | MISSING | MUST (our differentiator) | **no `hreflang` on any page**; single-language English | Techpresso gives no i18n reference — we design it ourselves |

## Headline gaps
- **Everything is MISSING in the clone** — local project is the untouched template; `/clone-website` has not been run.
- **Techpresso is English-only, no i18n.** Our multilingual layer is net-new; no reference pattern to copy. This is the single biggest design decision.
- **Bulk of the product = programmatic pages**: 1,395 prompt pages + 366 tutorials + 97 tools = ~91% of routes. The system is a content/data pipeline, not a hand-built site.
- **Write features are gated** (auth, my-list, dashboard, playbooks) — INACCESSIBLE publicly; document-only, excluded from v1 per your rule.

## Browser-pass additions (2026-09-05)
- **Freemium paywall is the core business model.** Public sees tutorial *Overview* + metadata; the *Instructions* body + video sit behind a $19/mo paywall. Search, deals, community (Telegram), dashboard, saved lists = members only. Checkout is fully external on **Dupple** (`checkout.dupple.com`, `account.dupple.com`). **Our v1 is the public/SEO layer + i18n; the member area & payments are a separate, later concern.**
- **Content freshness signals confirmed:** per-tutorial `PUBLISHED <date>`, "Video" badge, "new tutorials every week / 10–15 weekly" (FAQ). Good change-detection inputs.
- **Learning paths = collections** (no separate data type). One entity, two renderings (`/learn` hub + `/collections/<slug>` guided path).
