import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import type { ContentType } from "@/lib/content/constants";
import { getPublishedBySlug, getRelated, findRedirect, getToolsBySlugs } from "@/lib/content/queries";
import { entityPath } from "@/lib/content/segments";
import { buildMetadata } from "@/lib/seo/metadata";
import { jsonLd } from "@/lib/seo/jsonld";
import { Container, EntityView, RelatedList } from "@/components/templates/Views";
import { t } from "@/lib/i18n/ui";

/** Which relationship names to surface as "Related" per type. */
const REL_FOR: Partial<Record<ContentType, string[]>> = {
  tutorial: ["related", "tool"],
  tool: ["tutorial"],
  collection: ["step"],
  role_page: ["featured"],
  prompt_page: ["related"],
  compare_tools: ["tool"],
  free_tool: ["related"],
  community_post: ["related"],
};

export async function detailMetadata(type: ContentType, locale: string, slug: string): Promise<Metadata> {
  const entity = await getPublishedBySlug(type, locale, slug);
  if (!entity) return {};
  return buildMetadata(entity);
}

export async function DetailPage({ type, locale, slug }: { type: ContentType; locale: string; slug: string }) {
  const entity = await getPublishedBySlug(type, locale, slug);
  if (!entity) {
    // slug changed? 301 to the current slug. Else 404.
    const r = await findRedirect(locale, slug);
    if (r) permanentRedirect(entityPath(locale, type, r.newSlug)); // 308 for SEO on slug change
    notFound();
  }

  const rels = REL_FOR[type] ?? ["related"];
  const relatedEntities = (await Promise.all(rels.map((rel) => getRelated(entity, rel, locale)))).flat();
  // de-dup by contentId
  const seen = new Set<string>();
  const related = relatedEntities.filter((e) => (seen.has(e.contentId) ? false : (seen.add(e.contentId), true)));

  const ld = jsonLd(entity);

  // Disclosed commercial CTAs (Phase 4). Links go through /go/<tool> (tracked,
  // noindex). Only tools that still exist + are active render.
  const recs = entity.commerce?.recommendedTools ?? [];
  const tools = recs.length ? await getToolsBySlugs(recs.map((r) => r.toolSlug)) : [];
  const toolBySlug = new Map(tools.map((t2) => [t2.slug, t2]));
  const cta = recs
    .map((r) => ({ ...r, tool: toolBySlug.get(r.toolSlug) }))
    .filter((r) => r.tool);

  return (
    <Container narrow>
      <div style={{ padding: "2.5rem 0" }}>
        <EntityView entity={entity} related={<RelatedList locale={locale} title={t(locale, "related")} entities={related} />} />
        {cta.length ? (
          <section aria-label="Recommended tools" style={{ marginTop: "2.5rem", maxWidth: "68ch", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
              {cta.some((c) => c.tool!.disclosureRequired) ? "Recommended tools · contains affiliate links" : "Recommended tools"}
            </div>
            {cta.map((c) => (
              <div key={c.toolSlug} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm, 10px)", padding: "1rem 1.15rem", background: "var(--surface)" }}>
                <div style={{ fontWeight: 700 }}>{c.tool!.name}</div>
                {c.why ? <p style={{ margin: "0.35rem 0 0.75rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{c.why}</p> : null}
                <a
                  href={`/go/${encodeURIComponent(c.toolSlug)}?a=${encodeURIComponent(entity.contentId)}&l=${encodeURIComponent(locale)}`}
                  rel="sponsored nofollow noopener"
                  style={{ display: "inline-block", padding: "0.5rem 1rem", borderRadius: "999px", background: "var(--brand-primary)", color: "var(--brand-on, #fff)", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}
                >
                  {c.cta || "Try it"} →
                </a>
              </div>
            ))}
          </section>
        ) : null}
      </div>
      {ld.map((block, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }} />
      ))}
    </Container>
  );
}
