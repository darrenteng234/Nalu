import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/i18n/locales";
import { allPublished } from "@/lib/content/queries";
import { abs } from "@/lib/site";

export const dynamic = "force-dynamic"; // DB-backed; generated on request, not at build

/**
 * Pilot: one sitemap of all PUBLISHED URLs across locales. At scale this becomes
 * a sharded per-locale sitemap index (generateSitemaps) — noted in the report.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const out: MetadataRoute.Sitemap = [];
  for (const l of LOCALES) {
    out.push({ url: abs(`/${l.code}`), changeFrequency: "weekly", priority: 0.8 });
    const entries = await allPublished(l.code);
    for (const e of entries) {
      out.push({ url: abs(e.url), lastModified: e.lastmod ? new Date(e.lastmod) : undefined });
    }
  }
  return out;
}
