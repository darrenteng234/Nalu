import type { CollectionConfig } from "payload";

/**
 * Auditable source provenance (Phase 2.5 §6). Answers "exactly what public
 * source produced this NALU record?" One snapshot per retrieval. Only public,
 * in-scope content is ever recorded; gated fetches are refused before this.
 */
export const SourceSnapshots: CollectionConfig = {
  slug: "source-snapshots",
  admin: { group: "System", useAsTitle: "sourceUrl", defaultColumns: ["sourceUrl", "sourceType", "scopeDecision", "retrievedAt"] },
  access: { read: ({ req }) => Boolean(req.user) },
  indexes: [{ fields: ["contentId"] }],
  fields: [
    { name: "contentId", type: "text", index: true },
    { name: "sourceUrl", type: "text", required: true },
    { name: "sourceType", type: "text" },
    { name: "sourceIdentifier", type: "text" },
    { name: "retrievedAt", type: "date", required: true },
    { name: "rawHash", type: "text", admin: { description: "Hash of the fetched public HTML." } },
    { name: "httpStatus", type: "number" },
    { name: "scopeDecision", type: "select", options: [{ label: "in-scope", value: "in-scope" }, { label: "out-of-scope", value: "out-of-scope" }] },
    { name: "extractionStatus", type: "select", options: [{ label: "ok", value: "ok" }, { label: "partial", value: "partial" }, { label: "failed", value: "failed" }] },
    { name: "fieldCoverage", type: "json", admin: { description: "{ field: status } per-field extraction outcome." } },
    { name: "normalizedSnapshot", type: "json", admin: { description: "Structured English representation (presentation-independent). Never raw source HTML." } },
  ],
};
