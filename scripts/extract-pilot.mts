/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Phase 2.5 real-content extraction pilot (pure; no Payload).
 * Fetches a small, structurally diverse PUBLIC sample + one gated URL (must be
 * refused). Writes structured results + a per-field coverage report. No verbatim
 * body content is printed — only structure/coverage/anomalies.
 */
import { extract, type ExtractedSource } from "../src/lib/extract/extractor.ts";

const BASE = "https://academy.techpresso.co";
const SAMPLE = [
  { url: `${BASE}/tools/gumloop`, why: "tool · short" },
  { url: `${BASE}/courses/introduction-to-claude`, why: "tutorial · medium · TL;DR/sections" },
  { url: `${BASE}/reviews/is-claude-pro-worth-it`, why: "review · long · many H2 + FAQ" },
  { url: `${BASE}/compare-tools/chatgpt-vs-claude`, why: "compare · FAQ + rating + relationships" },
  { url: `${BASE}/prompts/claude-prompts`, why: "prompt page · large · lists" },
  { url: `${BASE}/ai-for/marketers`, why: "role · CollectionPage + Course + FAQ" },
  { url: `${BASE}/collections/learn-claude`, why: "collection / learning path" },
  { url: `${BASE}/free-tools/prompt-optimizer`, why: "free tool · interactive" },
  { url: `${BASE}/community/reconcile-expenses-from-receipts-wagjdx`, why: "community · user-submitted" },
  { url: `${BASE}/dashboard`, why: "GATED — must be REFUSED by scope guard" },
];

const FIELD_KEYS = ["title", "description", "canonical", "headings", "faq", "jsonLdTypes", "breadcrumb", "datePublished", "dateModified", "images", "relationships", "bodyText"] as const;

function cov(status: string) { return status === "ok" ? "ok " : status === "flagged" ? "FLG" : status === "partial" ? "PRT" : "MIS"; }

async function main() {
  const results: ExtractedSource[] = [];
  for (const s of SAMPLE) {
    try {
      const r = await extract(s.url);
      results.push(r);
      const path = new URL(s.url).pathname;
      if (r.scopeDecision === "out-of-scope") { console.log(`REFUSED  ${path}  — ${r.anomalies[0]}`); continue; }
      const cells = FIELD_KEYS.map((k) => `${k}:${cov((r.fields as any)[k]?.status ?? "MIS")}`).join("  ");
      console.log(`HTTP ${r.httpStatus} ${r.inferredType.padEnd(14)} ${path}`);
      console.log(`   types=[${(r.fields.jsonLdTypes.value ?? []).slice(0, 8).join(",")}]`);
      console.log(`   ${cells}`);
      console.log(`   headings=${r.fields.headings.value?.length ?? 0} faq=${r.fields.faq.value?.length ?? 0} rels=${r.fields.relationships.value?.length ?? 0} imgs=${r.fields.images.value} anomalies=${r.anomalies.length}`);
    } catch (e) {
      console.log(`ERROR ${s.url} — ${e}`);
    }
  }
  // coverage summary
  const inScope = results.filter((r) => r.scopeDecision === "in-scope");
  console.log("\n=== FIELD COVERAGE (in-scope pages: ok / total) ===");
  for (const k of FIELD_KEYS) {
    const ok = inScope.filter((r) => (r.fields as any)[k]?.status === "ok").length;
    console.log(`${k.padEnd(16)} ${ok}/${inScope.length}`);
  }
  const refused = results.filter((r) => r.scopeDecision === "out-of-scope").length;
  console.log(`\nscope-guard refusals: ${refused} (expected ≥1)`);

  const out = "/private/tmp/claude-501/-Users-darrenteng-Desktop-NATIVE-Website-project-topsystems-website/1ecdd5c4-d7b5-4cac-a45e-2a52030701d6/scratchpad/real-extracted.json";
  await (await import("node:fs/promises")).writeFile(out, JSON.stringify(results, null, 2));
  console.log(`\nwrote ${out}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
