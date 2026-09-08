import type { ResolvedEntity } from "../content/queries";
import { abs, SITE_NAME } from "../site";
import { entityPath, hubPath, TYPE_SEGMENT } from "../content/segments";

/**
 * Per-type JSON-LD recipes, generated from structured content (docs/specs/01 §13).
 * inLanguage is always the page locale. No fabricated ratings/reviews.
 */
export function jsonLd(entity: ResolvedEntity): object[] {
  const url = abs(entityPath(entity.locale, entity.type, entity.slug));
  const org = { "@type": "Organization", name: SITE_NAME, url: abs(`/${entity.locale}`) };
  const base = { inLanguage: entity.locale, url, name: entity.seo.title || entity.title, description: entity.seo.description || entity.summary };
  const blocks: object[] = [];

  const authorName = (entity.source.neutralData?.author as string) || undefined;
  const author = authorName ? { "@type": "Person", name: authorName } : org;

  switch (entity.type) {
    case "article":
      blocks.push({
        "@context": "https://schema.org", "@type": "Article", ...base,
        author, publisher: org,
        datePublished: entity.source.datePublished, dateModified: entity.source.dateModified,
        ...(entity.source.neutralData?.heroImageUrl ? { image: entity.source.neutralData.heroImageUrl as string } : {}),
      });
      break;
    case "tutorial":
      blocks.push({ "@context": "https://schema.org", "@type": "Course", ...base, provider: org });
      break;
    case "tool":
      blocks.push({ "@context": "https://schema.org", "@type": "SoftwareApplication", ...base, applicationCategory: (entity.source.neutralData?.applicationCategory as string) || "AI Tool" });
      break;
    case "prompt_page":
    case "collection":
    case "role_page":
      blocks.push({ "@context": "https://schema.org", "@type": "CollectionPage", ...base });
      break;
    case "compare_tools":
    case "compare_platform":
      blocks.push({ "@context": "https://schema.org", "@type": "Article", ...base, author: org });
      break;
    case "blog_post":
      blocks.push({ "@context": "https://schema.org", "@type": "BlogPosting", ...base, author: org, datePublished: entity.source.datePublished, dateModified: entity.source.dateModified });
      break;
    case "community_post":
      blocks.push({ "@context": "https://schema.org", "@type": "TechArticle", ...base });
      break;
    case "free_tool":
      blocks.push({ "@context": "https://schema.org", "@type": "SoftwareApplication", ...base, applicationCategory: "UtilitiesApplication" });
      break;
    default:
      blocks.push({ "@context": "https://schema.org", "@type": "WebPage", ...base });
  }

  // Breadcrumb: home → type hub → this entity (docs/specs Phase 2.5 §14).
  blocks.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: abs(`/${entity.locale}`) },
      { "@type": "ListItem", position: 2, name: TYPE_SEGMENT[entity.type], item: abs(hubPath(entity.locale, TYPE_SEGMENT[entity.type])) },
      { "@type": "ListItem", position: 3, name: entity.title, item: url },
    ],
  });

  if (entity.faq && entity.faq.length) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: entity.locale,
      mainEntity: entity.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  return blocks;
}
