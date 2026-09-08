# 02 — CONTENT SYSTEM (Data Architecture)

**Principle:** data-first. Content lives as structured **entities**; page **templates** render them. We never hand-author thousands of static pages. 2,000 → 20,000 → 100,000 pages must be a data-volume change, not an architecture change.

Companion: `01_PRODUCT_SPEC.md` (scope/decisions), `03` (translation), `04` (QA).

---

## 1. Core modeling pattern: Source + Variant

Every content type splits into two layers:

```
<Entity>Source        // canonical, English, language-neutral relationships
   └─ <Entity>Variant[locale]   // per-locale localized fields + publication state
```

- **Source** = the single source of truth (English master). Holds language-neutral data: IDs, relationships (by ID), taxonomy refs, numeric/enum fields, source version.
- **Variant** = one row per locale. Holds only translatable/localizable fields + SEO fields + slug + publication + translation/localization versions.
- Relationships are stored **on the Source, by `content_id`** — language-agnostic, so localized slugs and independent publication never break links.

This pattern is uniform across all types; adding a locale = adding Variant rows. Adding a type = one Source + one Variant table + one template.

## 2. Identity & keys

- **`content_id`** — immutable ULID, per Source entity. Primary cross-locale key; hreflang clusters and internal links resolve by this.
- **`type`** — enum: `tutorial | prompt_page | prompt | collection | tool | compare_platform | compare_tools | review | role_page | blog_post | community_post | free_tool | nav_menu`.
- **Variant PK** = (`content_id`, `locale`).
- **`slug`** — per (locale, type), unique, mutable; old values kept in `slug_history` (301s).
- Never key anything by slug. Never reuse a `content_id`.

## 3. Entity catalog

Field lists below are the **public** in-scope fields. `[N]` = language-neutral (Source), `[L]` = localized (Variant), `[SEO]` = SEO variant field, `[REL]` = relationship (Source, by id).

### 3.1 Tutorial (public overview only)
- [N] content_id, type, difficulty(enum), read_time_min, date_published, date_modified, source_version, has_video(bool, informational badge only)
- [REL] tool_ref, category_refs[], related_tutorial_refs[], collection_refs[]
- [L] title, description, tldr, who_this_is_for[], what_youll_build, toc_sections[] (headings only, public)
- [L][SEO] seo_title, seo_description, slug, og_image_ref
- **Excluded / owned-or-empty:** `instructions_body`, `video_url` — never populated from gated source; only if we author/own them.
- publication: status, translation_version, localization_version per variant.

### 3.2 Prompt page (programmatic index) + Prompt
- **PromptPage** [N] content_id, tool_ref, role_or_topic_ref; [REL] prompt_refs[], related_prompt_page_refs[], related_tutorial_refs[]; [L] title, intro, group_headings[], faq[]; [L][SEO] seo_title/desc/slug.
- **Prompt** [N] content_id, tool_ref, variables[] (protected tokens — see `03` §N); [L] title, body (with protected tokens preserved), notes; grouped under a PromptPage.
- The tool×role/topic matrix is generated from taxonomy, not hand-listed.

### 3.3 Collection / Learning path
- [N] content_id, group(enum: start_here|by_role|by_use_case|by_goal|advanced), difficulty, est_time_min; [REL] **ordered** step_refs[] (tutorial ids, order matters), full_topic_refs[]; [L] title, description, cta_label; [L][SEO] seo fields.
- `/learn` hub is a view over Collections grouped by `group`.

### 3.4 Tool
- [N] content_id, application_category, image_ref, date_modified; [REL] tutorial_refs[] (the tool→tutorials index), (optional future) prompt_page_refs[], review_ref, compare_refs[]; [L] name (usually protected/untranslated — see `03` §M), description; [L][SEO] seo fields.
- No price/rating fields (not public on source).

### 3.5 Compare (platform) & Compare-tools
- [N] content_id, subtype(platform|tools), operand_refs[] (by id/brand); [REL] related refs; [L] title, intro, comparison_table (structured rows), verdict, faq[]; [L][SEO] seo fields.

### 3.6 Review ("is-X-worth-it")
- [N] content_id, tool_ref, rating(numeric, if publicly shown), date_modified; [L] title, sections[] (H2 + body), verdict, faq[]; [L][SEO] seo fields.

### 3.7 Role page (`/ai-for/<role>`)
- [N] content_id, role_ref; [REL] featured_tutorial_refs[], featured_prompt_page_refs[]; [L] title, intro, faq[]; [L][SEO] seo fields.

### 3.8 Blog post
- [N] content_id, date_published, date_modified, author_ref; [REL] related_refs[]; [L] title, body, excerpt; [L][SEO] seo fields.

### 3.9 Community post (read-only showcase)
- [N] content_id, tool_ref, difficulty, time_saved_label, author_name, interaction_counts (imported, static); [L] title, summary; [L][SEO] seo fields.
- No write features in v1.

### 3.10 Free tool (directory + shell)
- [N] content_id, category, implementation_ref(nullable — capability stub); [L] name, description, faq[]; [L][SEO] seo fields.
- Logic not implemented in v1; `implementation_ref` lets a tool be wired later.

### 3.11 Taxonomy: Category, Tag, Tool-ref, Role
- **Category** [N] id, kind(course_category|tool_category); [L] label, slug.
- **Role** [N] id; [L] label, slug (the 18 roles).
- Taxonomy is itself Source+Variant so labels/slugs localize.

### 3.12 Navigation / footer structures
- `nav_menu` entities (header, footer groups) as data: ordered items → {label[L], target: content_id | route | external_url}. Localized labels; targets resolve to per-locale slugs at render. Never hardcode nav in templates.

## 4. Relationship graph (by content_id)

```
Tool 1─* Tutorial
Tool 1─* PromptPage        (future surface)
Tool 1─0..1 Review
Tool *─* Compare(tools)
PromptPage 1─* Prompt
Collection *─* Tutorial    (ordered steps + full topic list)
RolePage *─* Tutorial, *─* PromptPage
Tutorial *─* Tutorial      (related)
Category/Role *─* (any)    (taxonomy)
Every entity ─* related_refs (the SEO mesh)
```
All edges live on Source rows as ID arrays / join tables. Rendering resolves the current locale's variant for each ref; if a ref has no published variant in the active locale, it is **omitted or shown in fallback per decision 3** (see §9).

## 5. SEO & structured-data fields

Per Variant:
- `seo_title`, `seo_description`, `slug`, `og_image_ref`, `canonical_url` (derived), `noindex`(bool, default false), `hreflang_group` = content_id.
- `structured_data` is **generated** from entity fields per type recipe (not stored free-form): the template emits the JSON-LD recipe for its type with `inLanguage=<locale>`. Recipes per type are enumerated in `01` §13 and validated in `04`.

## 6. Publication state (per Variant)

`status ∈ { draft, mt_generated, in_review, approved, published, archived }`.
- A page is publicly renderable/indexable only at `published`.
- Independent per locale (decision 3): `en` can be `published` while `ms` is `in_review`.
- `archived` → route 301s to parent hub or successor (see redirects).

## 7. Versioning (three axes)

- **`source_version`** — bumps when the English Source content changes (content hash + timestamp). Field-level hashes stored (`field_hashes{field: sha}`) to detect *which* fields changed.
- **`translation_version`** — per Variant; the source_version it was translated from. If `variant.translated_from_source_version < source.source_version` for a changed field → **stale** (re-translate that field only).
- **`localization_version`** — bumps when localization rules/glossary change enough to warrant re-localization even without source change.
- Full version history retained for rollback (§13).

## 8. Update detection (DISCOVER → DETECT CHANGE)

- **Discover:** periodic read of the public sitemap + hub pages → URL set diff (added/removed).
- **Detect change:** for known entities, compare public field hashes + `dateModified` → mark changed Sources; compute field-level diff.
- **Do not assume a fixed cadence** — detect actual changes; schedule is just how often we *check*, not an assumption of how often source changes.
- New unrecognized URL patterns → **triage queue** (human classifies new page type; pipeline never guesses a template). See `04`.

## 9. Missing-variant behavior (decision 3)

- Render a locale page only if its Variant is `published`.
- Internal links to an entity lacking a published variant in the active locale: **omit** from lists, or (config) show with a fallback badge; never 404 the whole page, never block the locale.
- hreflang cluster lists only locales that are `published` for that content_id (+ `x-default` → en). Never emit hreflang to an unpublished/again 404 URL.
- Locale sitemap contains only that locale's `published` URLs.

## 10. Canonical URLs & hreflang

- Canonical = self, per-locale localized URL.
- hreflang cluster = all published variants sharing `content_id`, keyed by locale, plus `x-default=en`.
- Generated at render/build from the entity, never hand-maintained.

## 11. Redirects

- `slug_history(content_id, locale, old_slug, new_slug, changed_at)` → 301 old→current.
- `archived` entity → 301 to configured successor or parent hub.
- Removed source entity (disappeared from sitemap) → **soft-delete** (archive), keep variants, 301; never hard-delete (see `04` accidental-deletion guard).

## 12. Storage design (recommended)

- **Postgres** source of truth. Tables: `source_entity`, `variant(content_id, locale, …)`, `prompt`, `slug_history`, `relationship`(edge table), `taxonomy_source`/`taxonomy_variant`, `nav_menu`, `version_history`, `ingest_run`, `triage_queue`.
- **Payload CMS** over Postgres for the non-dev editing/review workflow (decision 8): localization, drafts/versions, roles/permissions, review states map to §6 statuses.
- **Rendering** reads published content (via CMS API or a read replica / generated content cache) and statically generates + ISR-revalidates on publish.
- **Search index** (Postgres FTS or external) built from published variants.
- *Alternative CMS:* Sanity (hosted, GROQ, localization) — trade-offs in `06`.

## 13. Rollback / history

- Every write to a Variant snapshots prior field values + versions in `version_history`.
- Rollback = restore a prior snapshot (per field or whole variant) and republish.
- Source rollback re-marks affected variants stale.

## 14. Scale guarantees

- No per-page files; pages = template(entity). Import is batched + idempotent (`ingest_run` with per-entity status; re-runs upsert by content_id).
- Adding 10× content = more rows; build uses ISR/on-demand so not all pages render at once.
- Adding a locale = Variant rows + config; no schema/template change.
- Adding a type = 1 Source table + 1 Variant table + 1 template + 1 JSON-LD recipe + validators.

## 15. Ingestion contract (public-only)

- Extractor reads **only public URLs/fields** (scope enforced; gated fields never requested).
- Output = normalized Source + English Variant drafts + relationships by id + field hashes.
- Idempotent: upsert by `content_id`; interrupted runs resume; per-entity failure isolates (does not abort the run).
- Detailed steps in `05` Phase 2.
