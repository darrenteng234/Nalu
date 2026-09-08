import type { ContentType } from "@/lib/content/constants";

/** Studio article types → underlying Source/Variant `type` (no new content model). */
export const STUDIO_TYPES: Record<string, ContentType> = {
  article: "article",
  tool: "tool",
  comparison: "compare_tools",
  workflow: "tutorial",
};

export interface CreateInput {
  title: string; content: string; studioType?: string; locale?: string;
  heroImageUrl?: string; category?: string; tags?: string; author?: string;
}
