import type { CollectionConfig } from "payload";

/** Uploads (og images, tool logos, tutorial banners). Public read. */
export const Media: CollectionConfig = {
  slug: "media",
  admin: { group: "Content" },
  access: { read: () => true },
  upload: {
    staticDir: "public/uploads",
    mimeTypes: ["image/*"],
  },
  fields: [
    // Alt is localized (a11y + SEO, docs/specs/04 H `asset.alt_present`).
    { name: "alt", type: "text", localized: true },
  ],
};
