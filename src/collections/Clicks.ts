import type { CollectionConfig } from "payload";

/**
 * AFFILIATE CLICK LOG (Phase 4 §7). One row per outbound /go/<tool> click:
 * proves the article → visitor → commercial-click chain WITHOUT pretending we
 * have revenue. Server-side only; not public.
 */
export const Clicks: CollectionConfig = {
  slug: "clicks",
  admin: { group: "Commerce", useAsTitle: "tool", defaultColumns: ["tool", "article", "locale", "createdAt"] },
  access: { read: ({ req }) => Boolean(req.user), create: () => true }, // created by the /go route; read requires auth
  indexes: [{ fields: ["tool"] }, { fields: ["article"] }, { fields: ["createdAt"] }],
  fields: [
    { name: "tool", type: "text", required: true, index: true, admin: { description: "tools.slug that was clicked." } },
    { name: "article", type: "text", index: true, admin: { description: "contentId of the source article (if known)." } },
    { name: "sourcePage", type: "text", admin: { description: "Path/URL the click came from (referer)." } },
    { name: "locale", type: "text" },
    { name: "destination", type: "text", admin: { description: "Where the click was redirected (affiliate or official)." } },
  ],
};
