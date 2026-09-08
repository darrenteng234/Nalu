import type { CollectionConfig } from "payload";
import { contentTypeOptions, difficultyOptions } from "../lib/content/constants";

/**
 * SOURCE = canonical, language-neutral entity (docs/specs/02 §1/§3).
 * One row per real content item. Holds the stable `contentId`, language-neutral
 * fields, relationships (by contentId), source version + per-field hashes for
 * change detection (docs/specs/02 §7/§8). Localized text lives in `variants`.
 *
 * Generic/polymorphic (a `type` discriminator) rather than one collection per
 * type: this is a deliberate refinement of docs/specs/02 (which described
 * per-type tables) — it lets a NEW public type be added without a schema/table
 * change, satisfying "future types without redesign". Type-specific neutral
 * fields live in `neutralData` (JSON); typed columns cover the common ones.
 */
export const Sources: CollectionConfig = {
  slug: "sources",
  admin: { useAsTitle: "contentId", group: "Content", defaultColumns: ["contentId", "type", "sourceVersion", "updatedAt"] },
  access: { read: ({ req }) => Boolean(req.user) },
  fields: [
    {
      name: "contentId",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { description: "Immutable ULID. Cross-locale key. Never reuse or change." },
    },
    { name: "type", type: "select", required: true, index: true, options: contentTypeOptions },

    // Change detection (docs/specs/02 §7/§8)
    { name: "sourceVersion", type: "number", required: true, defaultValue: 1, index: true },
    { name: "fieldHashes", type: "json", admin: { description: "{ fieldKey: sha256 } for field-level change detection." } },
    { name: "sourceUrl", type: "text", admin: { description: "Public source URL (in-scope only). Never a gated URL." } },

    // Common language-neutral fields (nullable per type)
    { name: "difficulty", type: "select", options: difficultyOptions },
    { name: "datePublished", type: "date" },
    { name: "dateModified", type: "date" },
    { name: "image", type: "upload", relationTo: "media" },
    {
      name: "hasVideo",
      type: "checkbox",
      defaultValue: false,
      admin: { description: "Informational badge only. Gated video is OUT OF SCOPE (docs/specs/01 §5)." },
    },

    // Type-specific neutral fields that don't warrant a column yet.
    { name: "neutralData", type: "json", admin: { description: "Type-specific language-neutral fields (enums, refs, config)." } },

    // Relationships by contentId (language-agnostic, docs/specs/02 §4).
    {
      name: "relationships",
      type: "array",
      admin: { description: "Edges to other entities by contentId. Resolved to locale slugs at render." },
      fields: [
        { name: "rel", type: "text", required: true, admin: { description: "e.g. tool, related, step, category, role, prompt" } },
        { name: "targetContentId", type: "text", required: true },
        { name: "order", type: "number", admin: { description: "For ordered rels (e.g. collection steps)." } },
      ],
    },

    // Ingestion bookkeeping (idempotent/resumable imports, docs/specs/05 Phase 2).
    {
      name: "ingestStatus",
      type: "select",
      defaultValue: "extracted",
      options: [
        { label: "extracted", value: "extracted" },
        { label: "structured", value: "structured" },
        { label: "error", value: "error" },
      ],
    },
    { name: "lastIngestRunId", type: "text" },
    {
      // Lifecycle vs the public source (Phase 2.6 §23 deletion policy).
      name: "lifecycleStatus",
      type: "select",
      defaultValue: "active",
      index: true,
      options: [
        { label: "active", value: "active" },
        { label: "source_missing", value: "source_missing" },
        { label: "review_required", value: "review_required" },
        { label: "unpublished", value: "unpublished" },
        { label: "archived", value: "archived" },
      ],
    },
    { name: "sourceMissingSince", type: "date" },
  ],
};
