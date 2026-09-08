import type { CollectionConfig } from "payload";

/**
 * Taxonomy (course/tool categories + roles). Small, no independent-publish need,
 * so labels/slugs use Payload field-level localization (docs/specs/02 §3.11).
 */
export const Categories: CollectionConfig = {
  slug: "categories",
  admin: { group: "Content", useAsTitle: "label", defaultColumns: ["label", "kind", "key"] },
  access: { read: () => true },
  fields: [
    { name: "key", type: "text", required: true, unique: true, index: true, admin: { description: "Stable language-neutral key (e.g. 'marketing')." } },
    {
      name: "kind",
      type: "select",
      required: true,
      options: [
        { label: "Course category", value: "course_category" },
        { label: "Tool category", value: "tool_category" },
        { label: "Role", value: "role" },
      ],
    },
    { name: "label", type: "text", required: true, localized: true },
    { name: "slug", type: "text", required: true, localized: true },
  ],
};
