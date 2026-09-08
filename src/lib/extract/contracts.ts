import type { ContentType } from "@/lib/content/constants";
import type { ExtractedSource } from "./extractor";

/**
 * Per-type extraction contracts (Phase 2.6 §4/§5). Each type declares the fields
 * that MUST be present for a complete, publishable extraction. A body-bearing
 * type with no body is EXTRACTION_FAILED — it must NOT publish (thin-content gate,
 * §5/§C8). Index-like types (tool/prompt hub/collection/role) require structure
 * (headings/relationships) instead of a prose body.
 */
export const MIN_BODY_CHARS = 250;

type FieldReq = "title" | "description" | "canonical" | "headings" | "body" | "relationships" | "faq";

export const REQUIRED_FIELDS: Record<ContentType, FieldReq[]> = {
  tutorial: ["title", "description", "canonical", "body"],
  review: ["title", "description", "canonical", "body"],
  blog_post: ["title", "description", "canonical", "body"],
  compare_tools: ["title", "description", "canonical", "body"],
  compare_platform: ["title", "description", "canonical", "body"],
  community_post: ["title", "canonical", "body"],
  prompt_page: ["title", "description", "canonical", "headings"],
  collection: ["title", "description", "canonical", "headings"],
  role_page: ["title", "description", "canonical", "headings"],
  tool: ["title", "description", "canonical", "relationships"],
  free_tool: ["title", "description", "canonical"],
  prompt: ["title"],
  article: ["title", "description", "canonical", "body"],
};

export interface CompletenessResult { ok: boolean; missing: string[]; status: "complete" | "EXTRACTION_FAILED" }

/** Gate: does this extraction satisfy its type contract (incl. body length)? */
export function checkCompleteness(type: ContentType, ex: ExtractedSource, bodyText: string | null): CompletenessResult {
  const req = REQUIRED_FIELDS[type] ?? ["title"];
  const missing: string[] = [];
  for (const f of req) {
    if (f === "body") {
      if (!bodyText || bodyText.trim().length < MIN_BODY_CHARS) missing.push(`body(<${MIN_BODY_CHARS} chars)`);
    } else {
      const status = (ex.fields as Record<string, { status?: string } | undefined>)[f]?.status;
      if (status !== "ok") missing.push(f);
    }
  }
  return { ok: missing.length === 0, missing, status: missing.length === 0 ? "complete" : "EXTRACTION_FAILED" };
}
