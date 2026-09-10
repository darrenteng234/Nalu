/** Shared enums for the content model (docs/specs/02). Single source of truth. */

/** Public content types discovered in reconnaissance (docs/specs/01 §6). */
export const CONTENT_TYPES = [
  "tutorial",
  "prompt_page",
  "prompt",
  "collection",
  "tool",
  "compare_platform",
  "compare_tools",
  "review",
  "role_page",
  "blog_post",
  "community_post",
  "free_tool",
  "article", // user-authored (Phase 2.11) — same Source+Variant model + detail template
  // Phase 5 (CEO product V1): the job-first product layers. All reuse the
  // Source+Variant model + render infra — no new backend collections.
  "solution", // "How do I accomplish X?" — the job entry point
  "teach_ai", // signature NALU method: make AI work like you (multi-step system)
  "workflow", // practical multi-step recipe to complete a recurring job
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const contentTypeOptions = CONTENT_TYPES.map((v) => ({
  label: v.replace(/_/g, " "),
  value: v,
}));

/**
 * Per-variant publication + translation state (docs/specs/02 §6, docs/specs/03 §E).
 * A variant is public/indexable ONLY at `published`. State is per (contentId, locale),
 * so locales publish INDEPENDENTLY (decision 3).
 */
export const VARIANT_STATUSES = [
  "draft",
  "mt_generated",
  "in_review",
  "approved",
  "published",
  "archived",
] as const;
export type VariantStatus = (typeof VARIANT_STATUSES)[number];

export const variantStatusOptions = VARIANT_STATUSES.map((v) => ({
  label: v.replace(/_/g, " "),
  value: v,
}));

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export const difficultyOptions = DIFFICULTIES.map((v) => ({ label: v, value: v }));
