/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Payload docs (F-A) */
import { payloadClient } from "@/lib/content/payload";

/**
 * Source deletion / removal policy (Phase 2.6 §23). A source that disappears from
 * public discovery is NEVER auto-deleted. It transitions ACTIVE → SOURCE_MISSING
 * (grace), and only after review/policy → UNPUBLISHED → ARCHIVED. A mass-deletion
 * guard aborts if too much of the corpus goes missing at once (likely a discovery
 * fault, not real removals).
 */
export const MASS_DELETION_THRESHOLD = 0.3; // >30% missing in one run → abort, flag for review

export interface RemovalReport {
  discovered: number; known: number; missing: string[];
  action: "applied" | "aborted-mass-deletion-guard";
  transitioned: Array<{ contentId: string; from: string; to: string }>;
}

export async function reconcileRemovals(discoveredUrls: string[]): Promise<RemovalReport> {
  const p = await payloadClient();
  const discovered = new Set(discoveredUrls);
  const sources = (await p.find({ collection: "sources", where: { sourceUrl: { exists: true } }, limit: 5000, depth: 0 })).docs as any[];
  const known = sources.filter((s) => s.sourceUrl);
  const missing = known.filter((s) => !discovered.has(s.sourceUrl)).map((s) => s.contentId);

  // mass-deletion guard: if a large fraction vanished at once, do NOT act.
  if (known.length > 0 && missing.length / known.length > MASS_DELETION_THRESHOLD) {
    return { discovered: discovered.size, known: known.length, missing, action: "aborted-mass-deletion-guard", transitioned: [] };
  }

  const transitioned: RemovalReport["transitioned"] = [];
  for (const s of known) {
    const isMissing = !discovered.has(s.sourceUrl);
    const cur = s.lifecycleStatus ?? "active";
    if (isMissing && cur === "active") {
      await p.update({ collection: "sources", id: s.id, data: { lifecycleStatus: "source_missing", sourceMissingSince: new Date().toISOString() }, depth: 0 });
      transitioned.push({ contentId: s.contentId, from: cur, to: "source_missing" });
    } else if (!isMissing && cur === "source_missing") {
      // reappeared → back to active
      await p.update({ collection: "sources", id: s.id, data: { lifecycleStatus: "active", sourceMissingSince: null }, depth: 0 });
      transitioned.push({ contentId: s.contentId, from: cur, to: "active" });
    }
  }
  return { discovered: discovered.size, known: known.length, missing, action: "applied", transitioned };
}
