/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs untyped (F-A) */
/**
 * Variant state transitions (Phase 3 §2/§8). The ONLY sanctioned way to change a
 * variant's publication state. Enforces the launch invariant together with the
 * Variants beforeChange hook: a translated (non-EN) variant reaches `published`
 * ONLY from `approved` (human-reviewed) and ONLY when not stale.
 */
import { payloadClient } from "@/lib/content/payload";
import { canApprove } from "./publish-guard";

async function logActivity(action: string, entity: string, locale: string, detail: string, outcome: "ok" | "failed" | "review_required", actor = "system") {
  try {
    const p = await payloadClient();
    await p.create({ collection: "activity-log", data: { actor, action, entity, locale, detail, outcome } as any, depth: 0 });
  } catch { /* activity-log is best-effort telemetry, never blocks a transition */ }
}

export async function getSourceVersion(contentId: string): Promise<number> {
  const p = await payloadClient();
  const r = await p.find({ collection: "sources", where: { contentId: { equals: contentId } }, limit: 1, depth: 0 });
  return (r.docs[0] as any)?.sourceVersion ?? 1;
}

/**
 * Human review approval: `in_review` → `approved`. A QA-blocked variant
 * (still `mt_generated` because it had a P0) is NOT approvable — human review may
 * only sign off content the automated gate already cleared (§5/§8). This closes
 * the "approve bypasses QA P0" hole: approval is a second gate, never an override.
 */
export async function approveVariant(id: string | number, reviewer?: string | number, reviewNotes?: string) {
  const p = await payloadClient();
  const v: any = await p.findByID({ collection: "variants", id, depth: 0 });
  const decision = canApprove(v.status, v.locale);
  if (!decision.ok) throw new Error(`Cannot approve ${v.locale} variant: ${decision.reason}.`);
  const updated = await p.update({
    collection: "variants", id, depth: 0,
    data: { status: "approved", translation: { ...(v.translation ?? {}), reviewer: reviewer ?? v.translation?.reviewer ?? null, reviewNotes: reviewNotes ?? v.translation?.reviewNotes ?? null } } as any,
  });
  await logActivity("variant.approve", v.contentId, v.locale, `approved by reviewer ${reviewer ?? "?"}`, "ok", `editor:${reviewer ?? "?"}`);
  return updated;
}

/** Publish: approved → published. The hook rejects non-EN publish that isn't approved+fresh. */
export async function publishVariant(id: string | number) {
  const p = await payloadClient();
  const v: any = await p.findByID({ collection: "variants", id, depth: 0 });
  const updated = await p.update({ collection: "variants", id, depth: 0, data: { status: "published", publishedAt: new Date().toISOString() } as any });
  await logActivity("variant.publish", v.contentId, v.locale, `published (from ${v.status})`, "ok");
  return updated;
}

/** Withdraw a published variant (e.g. reviewer rejects after approval, or source went stale). */
export async function unpublishVariant(id: string | number, toStatus: "approved" | "in_review" | "mt_generated" = "in_review") {
  const p = await payloadClient();
  const v: any = await p.findByID({ collection: "variants", id, depth: 0 });
  const updated = await p.update({ collection: "variants", id, depth: 0, data: { status: toStatus, publishedAt: null } as any });
  await logActivity("variant.unpublish", v.contentId, v.locale, `unpublished → ${toStatus}`, "review_required");
  return updated;
}

/**
 * Mark every non-EN variant of a content item stale when its EN source advanced
 * (§3/§7, AC7). Stale variants stay as-is (a published MS is not yanked from
 * users) but are flagged; the publish hook then blocks re-publish until they are
 * retranslated + re-reviewed, so a stale translation is never served AS FRESH.
 */
export async function markStaleForSource(contentId: string): Promise<number> {
  const p = await payloadClient();
  const sv = await getSourceVersion(contentId);
  const r = await p.find({ collection: "variants", where: { and: [{ contentId: { equals: contentId } }, { locale: { not_equals: "en" } }] }, limit: 100, depth: 0 });
  let n = 0;
  for (const v of r.docs as any[]) {
    const tv = v.translation?.translatedFromSourceVersion ?? sv;
    if (tv < sv && v.translation?.stale !== true) {
      await p.update({ collection: "variants", id: v.id, depth: 0, data: { translation: { ...(v.translation ?? {}), stale: true } } as any });
      await logActivity("variant.mark_stale", contentId, v.locale, `EN advanced to v${sv}; MS from v${tv}`, "review_required");
      n++;
    }
  }
  return n;
}
