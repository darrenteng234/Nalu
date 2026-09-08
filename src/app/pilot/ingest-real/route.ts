/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Payload docs (F-A) */
import { payloadClient } from "@/lib/content/payload";
import { extract } from "@/lib/extract/extractor";

const BASE = "https://academy.techpresso.co";
const SAMPLE = [
  `${BASE}/tools/gumloop`,
  `${BASE}/courses/introduction-to-claude`,
  `${BASE}/reviews/is-claude-pro-worth-it`,
  `${BASE}/compare-tools/chatgpt-vs-claude`,
  `${BASE}/prompts/claude-prompts`,
  `${BASE}/ai-for/marketers`,
  `${BASE}/collections/learn-claude`,
  `${BASE}/free-tools/prompt-optimizer`,
  `${BASE}/community/reconcile-expenses-from-receipts-wagjdx`,
  `${BASE}/dashboard`, // gated — must be refused
];

const lastSeg = (u: string) => new URL(u).pathname.split("/").filter(Boolean).slice(-1)[0];
const cid = (u: string) => `tp-${lastSeg(u)}`;

/** GET /pilot/ingest-real — real PUBLIC extraction → English master + provenance. Dev-gated. */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production" && req.headers.get("x-pilot-token") !== process.env.PILOT_TOKEN) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const p = await payloadClient();
  const log: any = { fetched: 0, refused: 0, ingested: 0, skipped: [], perItem: [] };

  for (const url of SAMPLE) {
    try {
      const ex = await extract(url);
      if (ex.scopeDecision === "out-of-scope") { log.refused++; log.perItem.push({ url, result: "REFUSED (gated)" }); continue; }
      log.fetched++;
      if (ex.httpStatus !== 200 || ex.inferredType === "unknown" || ex.fields.title.status !== "ok") {
        log.skipped.push({ url, reason: `http=${ex.httpStatus} type=${ex.inferredType} title=${ex.fields.title.status}` });
        continue;
      }
      const contentId = cid(url);
      const type = ex.inferredType;

      // provenance snapshot (structured English, never raw HTML)
      const coverage: Record<string, string> = {};
      for (const [k, v] of Object.entries(ex.fields)) coverage[k] = (v as any).status;
      await upsert(p, "source-snapshots", { contentId: { equals: contentId } }, {
        contentId, sourceUrl: url, sourceType: type, sourceIdentifier: lastSeg(url),
        retrievedAt: ex.retrievedAt, rawHash: ex.rawHash, httpStatus: ex.httpStatus,
        scopeDecision: ex.scopeDecision, extractionStatus: ex.anomalies.length ? "partial" : "ok",
        fieldCoverage: coverage,
        normalizedSnapshot: { title: ex.fields.title.value, description: ex.fields.description.value, headings: ex.fields.headings.value, faq: ex.fields.faq.value, jsonLdTypes: ex.fields.jsonLdTypes.value, breadcrumb: ex.fields.breadcrumb.value },
      });

      // relationships (by contentId) from same-origin content links, minus self
      const rels = (ex.fields.relationships.value ?? [])
        .map((r) => ({ rel: "related", targetContentId: `tp-${r.targetUrl.split("/").filter(Boolean).slice(-1)[0]}` }))
        .filter((r) => r.targetContentId !== contentId)
        .slice(0, 8);

      await upsert(p, "sources", { contentId: { equals: contentId } }, {
        contentId, type, sourceVersion: 1,
        fieldHashes: { en: ex.rawHash },
        sourceUrl: url,
        datePublished: ex.fields.datePublished.value ?? null,
        dateModified: ex.fields.dateModified.value ?? null,
        neutralData: { jsonLdTypes: ex.fields.jsonLdTypes.value, applicationCategory: "AI Tool" },
        relationships: rels,
        ingestStatus: "structured",
      });

      // English master variant. Body is FLAGGED-empty (RSC body not extractable from raw HTML);
      // sections carry the heading outline only. summary = meta description.
      // Failure isolation: if the variant write fails (e.g. slug collision), mark the
      // Source ingestStatus=error (retryable) so no orphan source is left as "missing master".
      const headings = ex.fields.headings.value ?? [];
      try {
        await upsert(p, "variants", { and: [{ contentId: { equals: contentId } }, { locale: { equals: "en" } }] }, {
          contentId, locale: "en", type, status: "published", publishedAt: new Date().toISOString(),
          title: ex.fields.title.value, slug: lastSeg(url),
          summary: ex.fields.description.value ?? undefined,
          sections: headings.slice(0, 12).map((h, i) => ({ id: `h${i}`, heading: h })),
          faq: (ex.fields.faq.value ?? []).map((f, i) => ({ id: `f${i}`, q: f.q, a: f.a })),
          seo: { title: ex.fields.title.value, description: ex.fields.description.value ?? undefined, noindex: false },
          translation: { translatedFromSourceVersion: 1, translationVersion: 1, localizationVersion: 1, stale: false },
        });
      } catch (ve) {
        await upsert(p, "sources", { contentId: { equals: contentId } }, { contentId, type, ingestStatus: "error" });
        log.perItem.push({ url, contentId, result: `ISOLATED (variant failed, source marked error, retryable): ${ve}` });
        continue;
      }
      log.ingested++;
      log.perItem.push({ url, contentId, type, headings: headings.length, faq: (ex.fields.faq.value ?? []).length, bodyExtracted: false });
    } catch (e) {
      log.perItem.push({ url, result: `ERROR ${e}` });
    }
  }
  return Response.json(log);
}

async function upsert(p: any, collection: string, where: any, data: any) {
  const ex = await p.find({ collection, where, limit: 1, depth: 0 });
  if (ex.docs[0]) return p.update({ collection, id: ex.docs[0].id, data, depth: 0 });
  return p.create({ collection, data, depth: 0 });
}
