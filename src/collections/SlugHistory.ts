import type { CollectionConfig } from "payload";
import { LOCALE_CODES } from "../lib/i18n/locales";

/**
 * Slug-change log → 301 redirects (docs/specs/02 §11).
 * Links are stored by contentId, so slug changes never break internal links;
 * this collection powers old→current redirects for external/bookmarked URLs.
 */
export const SlugHistory: CollectionConfig = {
  slug: "slug-history",
  admin: { group: "System", useAsTitle: "oldSlug", defaultColumns: ["oldSlug", "newSlug", "locale", "contentId", "changedAt"] },
  access: { read: () => true },
  indexes: [{ fields: ["locale", "oldSlug"] }],
  fields: [
    { name: "contentId", type: "text", required: true, index: true },
    { name: "locale", type: "select", required: true, options: LOCALE_CODES.map((c) => ({ label: c, value: c })) },
    { name: "type", type: "text", required: true },
    { name: "oldSlug", type: "text", required: true, index: true },
    { name: "newSlug", type: "text", required: true },
    { name: "changedAt", type: "date", required: true },
  ],
};
