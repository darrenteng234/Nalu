import type { CollectionConfig } from "payload";
import { LOCALE_CODES } from "../lib/i18n/locales";

/**
 * LIGHTWEIGHT OPPORTUNITY RECORD (Phase 4 §8). NOT an Ahrefs/Keyword-Planner
 * replacement. We do NOT have authenticated keyword-metric access, so metric
 * fields explicitly allow NOT_AVAILABLE rather than inventing numbers. Later we
 * may feed authenticated Google Keyword Planner / Ahrefs data into these fields.
 */
const availability = [
  { label: "not available", value: "NOT_AVAILABLE" },
  { label: "low", value: "low" },
  { label: "medium", value: "medium" },
  { label: "high", value: "high" },
];

export const Opportunities: CollectionConfig = {
  slug: "opportunities",
  admin: { group: "Research", useAsTitle: "topic", defaultColumns: ["topic", "language", "country", "decision", "confidence", "lastCheckedAt"] },
  access: { read: ({ req }) => Boolean(req.user) },
  fields: [
    { name: "topic", type: "text", required: true },
    { name: "candidateKeyword", type: "text" },
    { name: "language", type: "select", defaultValue: "en", options: LOCALE_CODES.map((c) => ({ label: c, value: c })) },
    { name: "country", type: "text", defaultValue: "MY" },
    { name: "searchIntent", type: "select", options: [
      { label: "informational", value: "informational" },
      { label: "commercial", value: "commercial" },
      { label: "transactional", value: "transactional" },
      { label: "navigational", value: "navigational" },
    ] },
    // Metric fields — each allows NOT_AVAILABLE (never fabricate numbers).
    { name: "commercialIntent", type: "select", defaultValue: "NOT_AVAILABLE", options: availability },
    { name: "freshness", type: "select", defaultValue: "NOT_AVAILABLE", options: availability },
    { name: "demandEvidence", type: "textarea", admin: { description: "Observed evidence (e.g. autocomplete, forum volume). NOT invented numbers." } },
    { name: "serpObservation", type: "textarea", admin: { description: "What the SERP looks like (who ranks, AIO present?)." } },
    { name: "competitionObservation", type: "select", defaultValue: "NOT_AVAILABLE", options: availability },
    { name: "affiliatePotential", type: "select", defaultValue: "NOT_AVAILABLE", options: availability },
    { name: "naluUniqueness", type: "select", defaultValue: "NOT_AVAILABLE", options: availability },
    { name: "confidence", type: "select", defaultValue: "low", options: [
      { label: "low", value: "low" }, { label: "medium", value: "medium" }, { label: "high", value: "high" },
    ] },
    { name: "decision", type: "select", defaultValue: "considering", options: [
      { label: "considering", value: "considering" },
      { label: "pursue", value: "pursue" },
      { label: "parked", value: "parked" },
      { label: "rejected", value: "rejected" },
      { label: "published", value: "published" },
    ] },
    { name: "sourceUrls", type: "array", fields: [{ name: "url", type: "text" }] },
    { name: "lastCheckedAt", type: "date" },
  ],
};
