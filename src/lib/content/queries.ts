/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs are untyped until payload-types.ts is generated (Phase-1 finding F-A) */
import { payloadClient } from "./payload";
import type { ContentType } from "./constants";
import { LOCALE_CODES, DEFAULT_LOCALE } from "../i18n/locales";
import { entityPath } from "./segments";

/** A resolved entity = its Source (neutral) + one locale Variant (localized). */
export interface ResolvedEntity {
  contentId: string;
  type: ContentType;
  locale: string;
  slug: string;
  title: string;
  summary?: string;
  sections?: Array<{ id: string; heading?: string; body?: string; items?: string[] }>;
  faq?: Array<{ id: string; q: string; a: string }>;
  commerce?: { recommendedTools?: Array<{ toolSlug: string; why?: string; cta?: string }> };
  seo: { title?: string; description?: string; noindex?: boolean };
  source: {
    difficulty?: string | null;
    datePublished?: string | null;
    dateModified?: string | null;
    sourceVersion: number;
    relationships: Array<{ rel: string; targetContentId: string; order?: number | null }>;
    neutralData?: Record<string, unknown> | null;
  };
}

type VariantDoc = Record<string, any>;
type SourceDoc = Record<string, any>;

function shape(v: VariantDoc, s: SourceDoc): ResolvedEntity {
  return {
    contentId: v.contentId,
    type: v.type,
    locale: v.locale,
    slug: v.slug,
    title: v.title,
    summary: v.summary ?? undefined,
    sections: v.sections ?? undefined,
    faq: v.faq ?? undefined,
    commerce: v.commerce ?? undefined,
    seo: { title: v.seo?.title, description: v.seo?.description, noindex: v.seo?.noindex },
    source: {
      difficulty: s?.difficulty ?? null,
      datePublished: s?.datePublished ?? null,
      dateModified: s?.dateModified ?? null,
      sourceVersion: s?.sourceVersion ?? 1,
      relationships: s?.relationships ?? [],
      neutralData: s?.neutralData ?? null,
    },
  };
}

async function sourceFor(contentId: string): Promise<SourceDoc | null> {
  const p = await payloadClient();
  const r = await p.find({ collection: "sources", where: { contentId: { equals: contentId } }, limit: 1, depth: 0 });
  return r.docs[0] ?? null;
}

/** One published entity by (type, locale, slug). Returns null if not published in this locale. */
export async function getPublishedBySlug(type: ContentType, locale: string, slug: string): Promise<ResolvedEntity | null> {
  const p = await payloadClient();
  const r = await p.find({
    collection: "variants",
    where: {
      and: [
        { type: { equals: type } },
        { locale: { equals: locale } },
        { slug: { equals: slug } },
        { status: { equals: "published" } },
      ],
    },
    limit: 1,
    depth: 0,
  });
  const v = r.docs[0];
  if (!v) return null;
  const s = await sourceFor(v.contentId);
  return shape(v, s ?? {});
}

/** All published variants of a type in a locale (for hubs / listings). */
export async function listPublishedByType(type: ContentType, locale: string, limit = 100): Promise<ResolvedEntity[]> {
  const p = await payloadClient();
  const r = await p.find({
    collection: "variants",
    where: { and: [{ type: { equals: type } }, { locale: { equals: locale } }, { status: { equals: "published" } }] },
    limit,
    depth: 0,
    sort: "-updatedAt",
  });
  const out: ResolvedEntity[] = [];
  for (const v of r.docs) out.push(shape(v, (await sourceFor(v.contentId)) ?? {}));
  return out;
}

/** Resolve a published variant for a contentId in a locale (for relationship rendering). */
export async function getPublishedByContentId(contentId: string, locale: string): Promise<ResolvedEntity | null> {
  const p = await payloadClient();
  const r = await p.find({
    collection: "variants",
    where: { and: [{ contentId: { equals: contentId } }, { locale: { equals: locale } }, { status: { equals: "published" } }] },
    limit: 1,
    depth: 0,
  });
  const v = r.docs[0];
  if (!v) return null;
  return shape(v, (await sourceFor(contentId)) ?? {});
}

/** Related entities (resolved to THIS locale; unpublished-in-locale are omitted — decision 3). */
export async function getRelated(
  entity: ResolvedEntity,
  rel: string,
  locale: string,
): Promise<ResolvedEntity[]> {
  const edges = entity.source.relationships
    .filter((e) => e.rel === rel)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const out: ResolvedEntity[] = [];
  for (const e of edges) {
    const r = await getPublishedByContentId(e.targetContentId, locale);
    if (r) out.push(r); // omit if not published in this locale
  }
  return out;
}

/** hreflang cluster: locales in which this contentId is PUBLISHED, as {locale: url}. */
export async function hreflangCluster(contentId: string): Promise<Record<string, string>> {
  const p = await payloadClient();
  const r = await p.find({
    collection: "variants",
    where: { and: [{ contentId: { equals: contentId } }, { status: { equals: "published" } }] },
    limit: LOCALE_CODES.length,
    depth: 0,
  });
  const map: Record<string, string> = {};
  for (const v of r.docs) map[v.locale] = entityPath(v.locale, v.type, v.slug);
  return map;
}

/** Slug-history lookup for 301 redirects. */
export async function findRedirect(locale: string, oldSlug: string): Promise<{ type: string; newSlug: string } | null> {
  const p = await payloadClient();
  const r = await p.find({
    collection: "slug-history",
    where: { and: [{ locale: { equals: locale } }, { oldSlug: { equals: oldSlug } }] },
    limit: 1,
    sort: "-changedAt",
    depth: 0,
  });
  const h = r.docs[0];
  return h ? { type: h.type, newSlug: h.newSlug } : null;
}

/** Search over published NALU-owned content in a locale (pilot: title/summary contains). */
export async function search(locale: string, q: string, limit = 30): Promise<ResolvedEntity[]> {
  const p = await payloadClient();
  if (!q.trim()) return [];
  const r = await p.find({
    collection: "variants",
    where: {
      and: [
        { locale: { equals: locale } },
        { status: { equals: "published" } },
        { or: [{ title: { like: q } }, { summary: { like: q } }] },
      ],
    },
    limit,
    depth: 0,
  });
  const out: ResolvedEntity[] = [];
  for (const v of r.docs) out.push(shape(v, (await sourceFor(v.contentId)) ?? {}));
  return out;
}

/** Resolve a variant of ANY status for founder PREVIEW (never used for public serving). */
export async function resolveForPreview(contentId: string, locale: string): Promise<ResolvedEntity | null> {
  const p = await payloadClient();
  const r = await p.find({ collection: "variants", where: { and: [{ contentId: { equals: contentId } }, { locale: { equals: locale } }] }, limit: 1, depth: 0 });
  const v = r.docs[0];
  if (!v) return null;
  return shape(v, (await sourceFor(contentId)) ?? {});
}

/** Fetch active tool records by slug (for rendering disclosed commercial CTAs). */
export async function getToolsBySlugs(slugs: string[]): Promise<Array<{ slug: string; name: string; disclosureRequired: boolean }>> {
  if (!slugs.length) return [];
  const p = await payloadClient();
  const r = await p.find({ collection: "tools", where: { and: [{ slug: { in: slugs } }, { active: { equals: true } }] }, limit: 50, depth: 0 });
  return r.docs.map((d: any) => ({ slug: d.slug, name: d.name, disclosureRequired: d.disclosureRequired !== false }));
}

/** All published variants (any type) in a locale — for sitemap. */
export async function allPublished(locale: string): Promise<Array<{ url: string; lastmod?: string }>> {
  const p = await payloadClient();
  const r = await p.find({
    collection: "variants",
    where: { and: [{ locale: { equals: locale } }, { status: { equals: "published" } }] },
    limit: 5000,
    depth: 0,
  });
  const out: Array<{ url: string; lastmod?: string }> = [];
  for (const v of r.docs) {
    const s = await sourceFor(v.contentId);
    out.push({ url: entityPath(v.locale, v.type, v.slug), lastmod: s?.dateModified ?? v.updatedAt });
  }
  return out;
}

export { DEFAULT_LOCALE };
