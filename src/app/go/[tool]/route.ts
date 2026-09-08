/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GET /go/<tool> — controlled outbound affiliate redirect (Phase 4 §7).
 * Logs the click (tool, article, source page, locale, destination) server-side,
 * then 302-redirects to the VERIFIED destination (affiliate URL if present +
 * program available, else the official URL). Never exposes affiliate URLs in
 * page source, never indexable (robots disallows /go + noindex header + 302),
 * and returns a proper redirect. Missing/invalid tool → 404 (no open redirect).
 */
import { payloadClient } from "@/lib/content/payload";

export async function GET(req: Request, ctx: { params: Promise<{ tool: string }> }) {
  const { tool } = await ctx.params;
  const url = new URL(req.url);
  const article = url.searchParams.get("a") || undefined;
  const locale = url.searchParams.get("l") || undefined;

  const notFound = () => new Response("Not found", { status: 404, headers: { "x-robots-tag": "noindex" } });
  if (!tool) return notFound();

  const p = await payloadClient();
  let doc: any;
  try {
    const r = await p.find({ collection: "tools", where: { and: [{ slug: { equals: tool } }, { active: { equals: true } }] }, limit: 1, depth: 0 });
    doc = r.docs[0];
  } catch { return notFound(); }
  if (!doc) return notFound();

  // Verified destination: affiliate URL only when a program is actually available; else official.
  const useAffiliate = doc.affiliateStatus === "available" && !!doc.affiliateUrl;
  const destination: string | undefined = useAffiliate ? doc.affiliateUrl : doc.officialUrl;
  if (!destination || !/^https?:\/\//i.test(destination)) return notFound(); // no destination → do not redirect

  // best-effort click log (never blocks the redirect)
  try {
    await p.create({ collection: "clicks", data: {
      tool, article, locale, destination,
      sourcePage: req.headers.get("referer") || undefined,
    } as any, depth: 0 });
  } catch { /* logging must not break the outbound link */ }

  return new Response(null, { status: 302, headers: { Location: destination, "x-robots-tag": "noindex", "cache-control": "no-store" } });
}
