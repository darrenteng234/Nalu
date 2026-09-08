import type { ContentType } from "./constants";

/**
 * Map each content type to its public URL segment and back.
 * URL shape: /{locale}/{segment}/{slug}  (home = /{locale}).
 * Segments are stable, English, language-neutral path words; localized *slugs*
 * live in the last position. hreflang/canonical resolve by contentId, not slug.
 */
export const TYPE_SEGMENT: Record<ContentType, string> = {
  tutorial: "tutorials",
  prompt_page: "prompts",
  prompt: "prompts", // individual prompts render inside a prompt_page; not a top route in v1
  collection: "collections",
  tool: "tools",
  compare_platform: "compare",
  compare_tools: "compare-tools",
  review: "reviews",
  role_page: "ai-for",
  blog_post: "blog",
  community_post: "community",
  free_tool: "free-tools",
  article: "articles",
};

export const SEGMENT_TYPE: Record<string, ContentType> = Object.entries(TYPE_SEGMENT).reduce(
  (acc, [type, seg]) => {
    // first type wins for a shared segment (prompt_page owns "prompts")
    if (!acc[seg]) acc[seg] = type as ContentType;
    return acc;
  },
  {} as Record<string, ContentType>,
);

/** Build a locale-prefixed path for an entity. */
export function entityPath(locale: string, type: ContentType, slug: string): string {
  const seg = TYPE_SEGMENT[type];
  return `/${locale}/${seg}/${slug}`;
}

/** Hub path for a type (listing page). */
export function hubPath(locale: string, segment: string): string {
  return `/${locale}/${segment}`;
}
