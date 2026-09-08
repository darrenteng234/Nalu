import type { Metadata } from "next";
import type { ResolvedEntity } from "../content/queries";
import { hreflangCluster } from "../content/queries";
import { entityPath } from "../content/segments";
import { DEFAULT_LOCALE } from "../i18n/locales";
import { abs, SITE_NAME } from "../site";

/**
 * Template-driven metadata: title, description, canonical (self), hreflang cluster
 * (published locales only, keyed by contentId) + x-default → English, OG.
 * Never hand-edited per page (docs/specs/01 §13, docs/specs/04 §D).
 */
export async function buildMetadata(entity: ResolvedEntity): Promise<Metadata> {
  const cluster = await hreflangCluster(entity.contentId);
  const canonicalPath = entityPath(entity.locale, entity.type, entity.slug);
  const languages: Record<string, string> = {};
  for (const [loc, path] of Object.entries(cluster)) languages[loc] = abs(path);
  if (cluster[DEFAULT_LOCALE]) languages["x-default"] = abs(cluster[DEFAULT_LOCALE]);

  const title = entity.seo.title || entity.title;
  const description = entity.seo.description || entity.summary || undefined;

  return {
    title,
    description,
    alternates: { canonical: abs(canonicalPath), languages },
    robots: entity.seo.noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: abs(canonicalPath),
      siteName: SITE_NAME,
      locale: entity.locale,
      type: "article",
    },
  };
}
