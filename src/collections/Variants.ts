import type { CollectionConfig } from "payload";
import { contentTypeOptions, variantStatusOptions } from "../lib/content/constants";
import { LOCALE_CODES } from "../lib/i18n/locales";
import { assertPublishable } from "../lib/launch/publish-guard";

/**
 * VARIANT = one localized rendering of a Source, per locale (docs/specs/02 §1).
 * Keyed by (contentId, locale). Carries its OWN `status`, so locales publish
 * INDEPENDENTLY (decision 3): `ms` can be `published` while `th` is `draft`.
 * Holds localized text + SEO fields + slug + translation/localization versions
 * (docs/specs/02 §7, docs/specs/03 §C/§E).
 *
 * NOTE: we deliberately model variants as their OWN documents (not Payload's
 * field-level localization) precisely because Payload's built-in publish status
 * is per-document, not per-locale (Phase 0 finding F3 / R16). This gives true
 * per-locale independent publication.
 */
export const Variants: CollectionConfig = {
  slug: "variants",
  admin: {
    useAsTitle: "title",
    group: "Content",
    defaultColumns: ["title", "contentId", "locale", "type", "status", "updatedAt"],
  },
  access: { read: ({ req }) => Boolean(req.user) },
  indexes: [
    // Enforce one variant per (contentId, locale). Also the primary lookup path.
    { fields: ["contentId", "locale"], unique: true },
    { fields: ["locale", "type", "status"] },
    { fields: ["locale", "type", "slug"], unique: true },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, operation, originalDoc }) => {
        if (!data) return data;
        // Belt-and-suspenders uniqueness (in addition to the DB index) so the
        // admin UI shows a friendly error rather than a raw constraint failure.
        const contentId = data.contentId ?? originalDoc?.contentId;
        const locale = data.locale ?? originalDoc?.locale;
        if (contentId && locale && (operation === "create" || data.contentId || data.locale)) {
          const dup = await req.payload.find({
            collection: "variants",
            where: {
              and: [
                { contentId: { equals: contentId } },
                { locale: { equals: locale } },
                ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
              ],
            },
            limit: 1,
            depth: 0,
          });
          if (dup.totalDocs > 0) {
            throw new Error(`A variant for contentId="${contentId}" locale="${locale}" already exists.`);
          }
        }
        return data;
      },
    ],
    beforeChange: [
      // LAUNCH INVARIANT (Phase 3 §2): a translated (non-EN) variant may reach
      // `published` ONLY from `approved` (human-reviewed) and ONLY when not stale.
      // This is the systemic guard behind the adversarial cases "MS published
      // while QA failed", "stale accidentally published", and "accidental locale
      // mass publication" — no code path can publish an unreviewed/stale MS.
      async ({ data, req, originalDoc }) => {
        if (!data) return data;
        const locale = data.locale ?? originalDoc?.locale;
        const nextStatus = data.status ?? originalDoc?.status;
        // Only guard the TRANSITION INTO published (a non-EN locale becoming
        // public). Field updates of an already-published variant — e.g. marking
        // it stale — must NOT be blocked, or a stale page could never be flagged.
        const enteringPublished = nextStatus === "published" && originalDoc?.status !== "published";
        if (!enteringPublished || !locale || locale === "en") return data;

        const contentId = data.contentId ?? originalDoc?.contentId;
        const tv = data.translation?.translatedFromSourceVersion ?? originalDoc?.translation?.translatedFromSourceVersion;
        const stale = (data.translation?.stale ?? originalDoc?.translation?.stale) === true;
        let sourceVersion = 1;
        if (contentId) {
          const src = await req.payload.find({ collection: "sources", where: { contentId: { equals: contentId } }, limit: 1, depth: 0 });
          sourceVersion = (src.docs[0] as { sourceVersion?: number } | undefined)?.sourceVersion ?? 1;
        }
        const decision = assertPublishable({ locale, prevStatus: originalDoc?.status, translatedFromSourceVersion: tv, sourceVersion, stale });
        if (!decision.ok) throw new Error(`Refusing to publish ${locale} variant: ${decision.reason}.`);
        return data;
      },
    ],
  },
  fields: [
    { name: "contentId", type: "text", required: true, index: true, admin: { description: "FK to sources.contentId (cross-locale key)." } },
    { name: "locale", type: "select", required: true, index: true, options: LOCALE_CODES.map((c) => ({ label: c, value: c })) },
    { name: "type", type: "select", required: true, options: contentTypeOptions, admin: { description: "Mirror of the source type (denormalized for queries)." } },

    // Publication (independent per locale)
    { name: "status", type: "select", required: true, defaultValue: "draft", index: true, options: variantStatusOptions },
    { name: "publishedAt", type: "date" },

    // Localized display fields
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, index: true, admin: { description: "Localized, unique per (locale,type). Slug changes recorded in slug-history for 301s." } },
    {
      name: "summary",
      type: "textarea",
      admin: { description: "Short localized summary / TL;DR (public)." },
    },
    {
      name: "sections",
      type: "json",
      admin: {
        description:
          "Structured localized content blocks: [{ id, heading, body?, items?[] }]. PUBLIC content only — gated Instructions are OUT OF SCOPE and never stored here.",
      },
    },
    {
      name: "faq",
      type: "json",
      admin: { description: "Localized FAQ: [{ id, q, a }]." },
    },
    {
      name: "body",
      type: "richText",
      admin: { description: "Optional rich body (unused by the pilot; sections[] is the structured path)." },
    },

    // Commercial recommendations (Phase 4 §6). Per-locale so a CTA can be localized.
    // Each entry references a tools.slug; the public page renders a disclosed CTA
    // linking through /go/<toolSlug> (server-side tracked). Optional — informational
    // articles with no legitimate commercial connection leave this empty.
    {
      name: "commerce",
      type: "json",
      admin: { description: "{ recommendedTools: [{ toolSlug, why, cta }] } — disclosed affiliate CTAs. Empty when there is no genuine commercial opportunity." },
    },

    // SEO (per locale, docs/specs/02 §5, docs/specs/03 §Q)
    {
      type: "group",
      name: "seo",
      fields: [
        { name: "title", type: "text" },
        { name: "description", type: "textarea" },
        { name: "ogImage", type: "upload", relationTo: "media" },
        { name: "noindex", type: "checkbox", defaultValue: false },
      ],
    },

    // Translation / localization versioning (docs/specs/02 §7, docs/specs/03)
    {
      type: "group",
      name: "translation",
      admin: { description: "Managed by the translation pipeline (docs/specs/03). English (source) variants leave these at defaults." },
      fields: [
        { name: "translatedFromSourceVersion", type: "number", admin: { description: "sources.sourceVersion this was translated from. If < current → stale." } },
        { name: "translationVersion", type: "number", defaultValue: 0 },
        { name: "localizationVersion", type: "number", defaultValue: 0 },
        { name: "confidence", type: "json", admin: { description: "{ fieldKey: 0..1 } confidence scores (docs/specs/03 §H)." } },
        { name: "fieldStatus", type: "json", admin: { description: "{ fieldKey: state } per-field translation status (docs/specs/03 §E)." } },
        { name: "stale", type: "checkbox", defaultValue: false, index: true },
        { name: "reviewer", type: "relationship", relationTo: "users" },
        { name: "reviewNotes", type: "textarea" },
      ],
    },
  ],
};
