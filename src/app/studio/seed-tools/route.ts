/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GET /studio/seed-tools — dev-gated seed of a SMALL, honest tool set (Phase 4 §5).
 * Affiliate status reflects only what is verifiable; we do NOT invent affiliate
 * URLs. Where no verified affiliate link exists, affiliateUrl is empty and /go
 * falls back to the official URL (click still tracked). Idempotent by slug.
 */
import { payloadClient } from "@/lib/content/payload";

const now = new Date().toISOString();
const SEED: Array<Record<string, any>> = [
  { name: "Jasper", slug: "jasper", vendor: "Jasper AI", officialUrl: "https://www.jasper.ai", category: "AI writing", hasFreePlan: false,
    affiliateStatus: "available", affiliateUrl: "", commissionType: "recurring_pct", commissionValue: "25%", recurring: true, cookieDuration: "45 days",
    sourceUrl: "https://www.jasper.ai/partners", lastVerifiedAt: now, active: true, disclosureRequired: true,
    pricingSummary: "Paid plans; free trial", useCases: "Marketing copy, blog drafts" },
  { name: "Notion", slug: "notion", vendor: "Notion Labs", officialUrl: "https://www.notion.so", category: "Productivity", hasFreePlan: true,
    affiliateStatus: "closed", affiliateUrl: "", commissionType: "unknown", recurring: false,
    sourceUrl: "https://www.notion.so/affiliates", lastVerifiedAt: now, active: true, disclosureRequired: true,
    pricingSummary: "Free plan + paid", useCases: "Notes, docs, wikis" },
  { name: "ChatGPT", slug: "chatgpt", vendor: "OpenAI", officialUrl: "https://chatgpt.com", category: "AI assistant", hasFreePlan: true,
    affiliateStatus: "none", affiliateUrl: "", commissionType: "unknown", recurring: false, lastVerifiedAt: now, active: true, disclosureRequired: false,
    pricingSummary: "Free + Plus", useCases: "General AI assistant" },
  { name: "Perplexity", slug: "perplexity", vendor: "Perplexity AI", officialUrl: "https://www.perplexity.ai", category: "AI search", hasFreePlan: true,
    affiliateStatus: "none", affiliateUrl: "", commissionType: "unknown", recurring: false, lastVerifiedAt: now, active: true, disclosureRequired: false,
    pricingSummary: "Free + Pro", useCases: "AI answers with citations" },
  { name: "Canva", slug: "canva", vendor: "Canva", officialUrl: "https://www.canva.com", category: "Design", hasFreePlan: true,
    affiliateStatus: "pending", affiliateUrl: "", commissionType: "unknown", recurring: false, lastVerifiedAt: now, active: true, disclosureRequired: true,
    pricingSummary: "Free + Pro", useCases: "Graphics, social posts" },
];

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production" && req.headers.get("x-pilot-token") !== process.env.PILOT_TOKEN) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const p = await payloadClient();
  let created = 0, updated = 0;
  for (const t of SEED) {
    const ex = await p.find({ collection: "tools", where: { slug: { equals: t.slug } }, limit: 1, depth: 0 });
    if (ex.docs[0]) { await p.update({ collection: "tools", id: ex.docs[0].id, data: t as any, depth: 0 }); updated++; }
    else { await p.create({ collection: "tools", data: t as any, depth: 0 }); created++; }
  }
  return Response.json({ created, updated, total: SEED.length });
}
