import type { CollectionConfig } from "payload";

/**
 * COMMERCIAL TOOL DATABASE (Phase 4 §5). First-class AI-tool records used for
 * affiliate recommendations. Affiliate data is VOLATILE: commission + program
 * status carry a `lastVerifiedAt` and an `active` flag, and are never assumed
 * permanent. Never invent an affiliate relationship — `affiliateStatus` must be
 * backed by `sourceUrl` evidence. Start with a small, verifiable seed set.
 */
export const Tools: CollectionConfig = {
  slug: "tools",
  admin: { group: "Commerce", useAsTitle: "name", defaultColumns: ["name", "vendor", "category", "affiliateStatus", "active", "lastVerifiedAt"] },
  access: { read: () => true }, // public: needed to render CTAs on public pages
  fields: [
    { name: "name", type: "text", required: true, index: true },
    { name: "slug", type: "text", required: true, unique: true, index: true, admin: { description: "Stable key used in /go/<slug>." } },
    { name: "vendor", type: "text" },
    { name: "officialUrl", type: "text", required: true, admin: { description: "Canonical official product URL (used when no affiliate link)." } },
    { name: "category", type: "text", index: true },
    { name: "audience", type: "text" },
    { name: "useCases", type: "textarea" },
    { name: "pricingSummary", type: "text" },
    { name: "hasFreePlan", type: "checkbox", defaultValue: false },

    // Affiliate (volatile — evidence + verification required)
    { name: "affiliateStatus", type: "select", defaultValue: "none", options: [
      { label: "none (no program known)", value: "none" },
      { label: "available (verified)", value: "available" },
      { label: "applied / pending", value: "pending" },
      { label: "closed / rejected", value: "closed" },
    ] },
    { name: "affiliateUrl", type: "text", admin: { description: "Verified affiliate/tracking URL. Empty → /go falls back to officialUrl." } },
    { name: "commissionType", type: "select", options: [
      { label: "recurring %", value: "recurring_pct" },
      { label: "one-time %", value: "onetime_pct" },
      { label: "flat", value: "flat" },
      { label: "unknown", value: "unknown" },
    ] },
    { name: "commissionValue", type: "text", admin: { description: "e.g. '25%' or 'USD 50'. Free text — never assume permanence." } },
    { name: "recurring", type: "checkbox", defaultValue: false },
    { name: "cookieDuration", type: "text", admin: { description: "e.g. '45 days'." } },
    { name: "disclosureRequired", type: "checkbox", defaultValue: true },
    { name: "sourceUrl", type: "text", admin: { description: "Evidence for the affiliate terms (official affiliate page). REQUIRED to claim a program." } },
    { name: "lastVerifiedAt", type: "date", admin: { description: "When affiliate terms were last verified. Stale → re-verify before trusting." } },
    { name: "active", type: "checkbox", defaultValue: true, index: true, admin: { description: "Include in recommendations. Turn off when a program closes." } },
  ],
};
