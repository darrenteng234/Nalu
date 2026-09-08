/**
 * GET /launch/review — native-review support (Phase 3 AC14). Dev-gated.
 *   ?contentId=..&locale=ms                    → the review package (read-only)
 *   ?contentId=..&locale=ms&action=record
 *       &decision=approve|reject&reviewer=..&notes=..   → record a HUMAN decision
 *
 * Recording an approval is a HUMAN action; this endpoint never self-approves.
 * Approve is routed through the QA-enforcing gate (approveVariant/canApprove).
 */
import { buildReviewPackage, recordReview } from "@/lib/launch/review";
import type { LocaleCode } from "@/lib/i18n/locales";

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production" && req.headers.get("x-pilot-token") !== process.env.PILOT_TOKEN) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const u = new URL(req.url);
  const contentId = u.searchParams.get("contentId");
  const locale = (u.searchParams.get("locale") ?? "ms") as LocaleCode;
  if (!contentId) return Response.json({ error: "contentId required" }, { status: 400 });

  try {
    if (u.searchParams.get("action") === "record") {
      const decision = u.searchParams.get("decision");
      if (decision !== "approve" && decision !== "reject") return Response.json({ error: "decision must be approve|reject" }, { status: 400 });
      const result = await recordReview(contentId, locale, {
        decision,
        reviewer: u.searchParams.get("reviewer") ?? "",
        notes: u.searchParams.get("notes") ?? "",
      });
      return Response.json({ action: "record", ...result });
    }
    return Response.json(await buildReviewPackage(contentId, locale));
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 400 });
  }
}
