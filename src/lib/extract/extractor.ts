/* eslint-disable @typescript-eslint/no-explicit-any -- JSON-LD from arbitrary public pages is untyped by nature */
/**
 * Real PUBLIC-source extractor. Fetches a public URL, enforces the scope
 * boundary, and produces a STRUCTURED English representation separated from
 * presentation (docs/specs/01 §5, Phase 2.5 §4/§7). Never fetches gated paths,
 * never fabricates missing fields — missing → flagged.
 *
 * Pure module: no Payload import (runs in scripts and in-Next). Parsing uses the
 * page's own <head> metadata + JSON-LD (clean structured data) + heading outline,
 * NOT brittle body-HTML scraping. Body prose is best-effort and FLAGGED.
 */

export const DISALLOWED_PREFIXES = ["/admin", "/api", "/auth", "/welcome", "/dashboard", "/my-list", "/playbooks"];

export interface ExtractField<T> { value: T | null; status: "ok" | "missing" | "partial" | "flagged"; note?: string }
export interface ExtractedSource {
  sourceUrl: string;
  scopeDecision: "in-scope" | "out-of-scope";
  httpStatus: number;
  retrievedAt: string;
  rawHash: string;
  inferredType: string;
  fields: {
    title: ExtractField<string>;
    description: ExtractField<string>;
    canonical: ExtractField<string>;
    headings: ExtractField<string[]>;
    faq: ExtractField<Array<{ q: string; a: string }>>;
    jsonLdTypes: ExtractField<string[]>;
    breadcrumb: ExtractField<string[]>;
    datePublished: ExtractField<string>;
    dateModified: ExtractField<string>;
    images: ExtractField<number>;
    relationships: ExtractField<Array<{ rel: string; targetUrl: string }>>;
    bodyText: ExtractField<string>;
  };
  anomalies: string[];
}

function sha16(s: string): string {
  // lightweight non-crypto hash (djb2) to avoid node:crypto in edge/util contexts
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0");
}

const SEGMENT_TYPE: Record<string, string> = {
  tools: "tool", courses: "tutorial", prompts: "prompt_page", collections: "collection",
  "compare-tools": "compare_tools", compare: "compare_platform", reviews: "review",
  "ai-for": "role_page", blog: "blog_post", community: "community_post", "free-tools": "free_tool",
};

export function scopeCheck(pathname: string): "in-scope" | "out-of-scope" {
  return DISALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/")) ? "out-of-scope" : "in-scope";
}

function matchAll(re: RegExp, s: string): RegExpMatchArray[] {
  return [...s.matchAll(re)];
}
function decode(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").trim();
}

/** Parse already-fetched HTML into a structured English representation. */
export function parseHtml(sourceUrl: string, html: string, httpStatus: number): ExtractedSource {
  const url = new URL(sourceUrl);
  const seg = url.pathname.split("/").filter(Boolean)[0] ?? "";
  const inferredType = SEGMENT_TYPE[seg] ?? "unknown";
  const anomalies: string[] = [];

  const titleM = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const descM = html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i);
  const canonM = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i);

  // JSON-LD blocks
  const ldBlocks = matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi, html);
  const ldTypes: string[] = [];
  let faq: Array<{ q: string; a: string }> = [];
  let breadcrumb: string[] = [];
  let datePublished: string | null = null;
  let dateModified: string | null = null;
  for (const b of ldBlocks) {
    try {
      const parsed = JSON.parse(b[1]);
      const nodes = Array.isArray(parsed) ? parsed : parsed["@graph"] ? parsed["@graph"] : [parsed];
      for (const n of nodes) {
        const ty = n["@type"];
        if (ty) (Array.isArray(ty) ? ty : [ty]).forEach((x: string) => ldTypes.push(x));
        if (ty === "FAQPage" && Array.isArray(n.mainEntity)) {
          faq = n.mainEntity.map((q: any) => ({ q: decode(String(q.name ?? "")), a: decode(String(q.acceptedAnswer?.text ?? "")) })).filter((f: any) => f.q && f.a);
        }
        if (ty === "BreadcrumbList" && Array.isArray(n.itemListElement)) {
          breadcrumb = n.itemListElement.map((i: any) => decode(String(i.name ?? i.item?.name ?? ""))).filter(Boolean);
        }
        if (n.datePublished) datePublished = String(n.datePublished);
        if (n.dateModified) dateModified = String(n.dateModified);
      }
    } catch { anomalies.push("json-ld block failed to parse"); }
  }

  // Heading outline
  const headings = matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi, html)
    .map((m) => decode(m[1].replace(/<[^>]+>/g, "")))
    .filter((h) => h.length > 0 && h.length < 160)
    .slice(0, 40);

  // Images (count) + internal relationship links (same-origin content links)
  const imgCount = matchAll(/<img\b[^>]*>/gi, html).length;
  const relLinks = matchAll(/href="(\/(?:tools|courses|prompts|collections|compare-tools|reviews|ai-for|free-tools|community)\/[^"#?]+)"/gi, html)
    .map((m) => ({ rel: "related", targetUrl: m[1] }));
  const relUnique = Array.from(new Map(relLinks.map((r) => [r.targetUrl, r])).values()).slice(0, 30);

  // Body prose is intentionally BEST-EFFORT and flagged: real pages are RSC-streamed,
  // so a clean body extraction is not reliable from raw HTML. We do NOT store raw HTML.
  const bodyText: ExtractField<string> = { value: null, status: "flagged", note: "RSC-streamed body not reliably extractable from raw HTML; requires a rendered-DOM extractor (documented gap)." };

  const f = <T,>(value: T | null, missingNote?: string): ExtractField<T> =>
    value === null || (Array.isArray(value) && value.length === 0) ? { value: (value ?? null) as T | null, status: "missing", note: missingNote } : { value, status: "ok" };

  return {
    sourceUrl,
    scopeDecision: scopeCheck(url.pathname),
    httpStatus,
    retrievedAt: new Date().toISOString(),
    rawHash: sha16(html),
    inferredType,
    fields: {
      title: f(titleM ? decode(titleM[1]) : null, "no <title>"),
      description: f(descM ? decode(descM[1]) : null, "no meta description"),
      canonical: f(canonM ? decode(canonM[1]) : null, "no canonical"),
      headings: f(headings.length ? headings : null, "no h1/h2 found"),
      faq: f(faq.length ? faq : null, "no FAQPage JSON-LD"),
      jsonLdTypes: f(ldTypes.length ? Array.from(new Set(ldTypes)) : null, "no JSON-LD"),
      breadcrumb: f(breadcrumb.length ? breadcrumb : null, "no BreadcrumbList"),
      datePublished: f(datePublished),
      dateModified: f(dateModified),
      images: { value: imgCount, status: "ok" },
      relationships: f(relUnique.length ? relUnique : null, "no internal content links"),
      bodyText,
    },
    anomalies,
  };
}

/**
 * Extract using a Renderer (e.g. PlaywrightRenderer) so RSC-streamed bodies are
 * captured. Scope-enforced. bodyText is populated from the rendered main text.
 */
export async function extractRendered(
  sourceUrl: string,
  renderer: { render: (u: string) => Promise<{ html: string; status: number; renderedText?: string }> },
): Promise<ExtractedSource> {
  const url = new URL(sourceUrl);
  if (scopeCheck(url.pathname) === "out-of-scope") {
    return { sourceUrl, scopeDecision: "out-of-scope", httpStatus: 0, retrievedAt: new Date().toISOString(), rawHash: "", inferredType: "unknown", fields: {} as ExtractedSource["fields"], anomalies: ["REFUSED: gated prefix — not fetched"] };
  }
  const r = await renderer.render(sourceUrl);
  const parsed = parseHtml(sourceUrl, r.html, r.status);
  const body = (r.renderedText ?? "").replace(/\s+\n/g, "\n").trim();
  if (body.length > 0) {
    parsed.fields.bodyText = { value: body, status: body.length >= 250 ? "ok" : "partial", note: `rendered main text (${body.length} chars)` };
  }
  return parsed;
}

/** Fetch a public URL (scope-enforced) and parse it. */
export async function extract(sourceUrl: string): Promise<ExtractedSource> {
  const url = new URL(sourceUrl);
  if (scopeCheck(url.pathname) === "out-of-scope") {
    return {
      sourceUrl, scopeDecision: "out-of-scope", httpStatus: 0, retrievedAt: new Date().toISOString(),
      rawHash: "", inferredType: "unknown",
      fields: {} as ExtractedSource["fields"],
      anomalies: ["REFUSED: path is under a disallowed/gated prefix — not fetched"],
    };
  }
  const res = await fetch(sourceUrl, { headers: { "user-agent": "NALU-pilot-extractor/0.1 (+public-content-only)" } });
  const html = await res.text();
  return parseHtml(sourceUrl, html, res.status);
}
