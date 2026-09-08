/**
 * Pure publish-gate decision (Phase 3 §2/§3). Extracted from the Variants
 * beforeChange hook so it is unit-testable without Payload. A translated
 * (non-EN) variant may be published ONLY from `approved`/`published` and ONLY
 * when not stale. EN (source of truth) is always publishable.
 */
export interface PublishCheck {
  locale: string;
  prevStatus?: string;          // status before this write
  translatedFromSourceVersion?: number;
  sourceVersion?: number;
  stale?: boolean;
}
export interface PublishDecision { ok: boolean; reason?: string }

/**
 * Human approval gate (§5/§8): a translated variant may be approved ONLY from
 * `in_review` (QA-passed) or `approved` (idempotent). A QA-blocked `mt_generated`
 * variant is never approvable — approval is a second gate, not a QA override.
 */
export function canApprove(status: string, locale: string): PublishDecision {
  if (locale === "en") return { ok: true };
  if (status === "in_review" || status === "approved") return { ok: true };
  return { ok: false, reason: `only a QA-passed (in_review) variant may be approved; was "${status}"` };
}

export function assertPublishable(c: PublishCheck): PublishDecision {
  if (c.locale === "en") return { ok: true };
  const legal = c.prevStatus === "approved" || c.prevStatus === "published";
  if (!legal) return { ok: false, reason: `must be human-reviewed (approved) before publishing; was "${c.prevStatus ?? "(new)"}"` };
  const tv = c.translatedFromSourceVersion;
  const sv = c.sourceVersion ?? 1;
  if (c.stale === true || (typeof tv === "number" && tv < sv)) {
    return { ok: false, reason: `translation is stale (from source v${tv} < current v${sv})` };
  }
  return { ok: true };
}
