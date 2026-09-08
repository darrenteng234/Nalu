import type { MetadataRoute } from "next";
import { abs } from "@/lib/site";

/**
 * Robots (Phase 4). Blocks internal/non-public routes from all crawlers. AI stance:
 * ALLOW search/citation bots (OAI-SearchBot, PerplexityBot, Claude-SearchBot) under
 * the same rules as normal crawlers, so NALU is eligible for AI-answer citations.
 * `/go` (affiliate redirects) is disallowed so it is never indexed.
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = ["/admin", "/api", "/pilot", "/ops", "/launch", "/studio", "/go"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: "OAI-SearchBot", allow: "/", disallow },
      { userAgent: "PerplexityBot", allow: "/", disallow },
      { userAgent: "Claude-SearchBot", allow: "/", disallow },
    ],
    sitemap: abs("/sitemap.xml"),
  };
}
