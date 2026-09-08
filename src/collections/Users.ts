import type { CollectionConfig } from "payload";

/** Auth collection (Payload admin + reviewers). Roles gate the review workflow. */
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: { useAsTitle: "email", group: "System" },
  access: {
    // Locked down by default; wire real access rules in a later phase.
    read: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: "name", type: "text" },
    {
      name: "roles",
      type: "select",
      hasMany: true,
      defaultValue: ["editor"],
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
        { label: "Reviewer (native language)", value: "reviewer" },
      ],
    },
    {
      // Which locales a reviewer is qualified to approve (docs/specs/03 §K/§AC).
      name: "reviewLocales",
      type: "select",
      hasMany: true,
      options: [
        { label: "English", value: "en" },
        { label: "Malay", value: "ms" },
        { label: "Thai", value: "th" },
        { label: "Vietnamese", value: "vi" },
      ],
    },
  ],
};
