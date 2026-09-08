/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Phase 2.8 real full-body multilingual pilot. Pure (dotenv + fetch + Playwright),
 * no Payload/DB. Renders real public pages (headless), extracts full public body,
 * gates completeness, translates EN→MS/TH/VI (Gemini, direct pivot, concurrency),
 * QA, cost telemetry, failure/idempotency/source-update tests. Never prints the key.
 * Does NOT reproduce source bodies in output — only structure/coverage/QA/cost.
 */
import "dotenv/config";
import { PlaywrightRenderer } from "../src/lib/extract/renderer.ts";
import { extractRendered } from "../src/lib/extract/extractor.ts";
import { checkCompleteness } from "../src/lib/extract/contracts.ts";
import { maskProtected, policyFor } from "../src/lib/translate/translator.ts";
import { translationQa } from "../src/lib/translate/translation-qa.ts";
import { writeFile, readFile } from "node:fs/promises";

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
const BASE = "https://academy.techpresso.co";
const BODY_MAX = 24000; // safety ceiling only; full public bodies translated (Step 6: no meaningful truncation)
const CONCURRENCY = 2; // low, to respect provider rate limits (429 at 6)
const CACHE_FILE = "docs/specs/.phase28-cache.json"; // resumable + idempotent (Step 10): locale|hash → translation

let stat429 = 0; const permanentFailures = 0; void permanentFailures;
let cache: Record<string, string> = {};
const runStart = Date.now();
const norm0 = (s: string) => s.replace(/\s+/g, " ").trim();
const fhash = (s: string) => { let h = 5381; const n = norm0(s); for (let i = 0; i < n.length; i++) h = ((h << 5) + h + n.charCodeAt(i)) >>> 0; return h.toString(16); };
let cacheDirty = 0;
async function persistCache() { await writeFile(CACHE_FILE, JSON.stringify(cache)); cacheDirty = 0; }
const BODY_TYPES = new Set(["tutorial", "review", "blog_post", "compare_tools", "compare_platform", "community_post"]);
const LOCALES = ["ms", "th", "vi"] as const;
const LOCALE_NAME: Record<string, string> = { ms: "Malaysian Malay (as used in Malaysia, NOT Indonesian)", th: "Thai", vi: "Vietnamese" };

// ~15 entities across every public page type + varied complexity. (why) documented in the report.
const MANIFEST: Array<{ url: string; type: string }> = [
  { url: `${BASE}/tools/gumloop`, type: "tool" },
  { url: `${BASE}/courses/introduction-to-claude`, type: "tutorial" },
  { url: `${BASE}/courses/creating-simple-video-games-with-claude`, type: "tutorial" },
  { url: `${BASE}/reviews/is-claude-pro-worth-it`, type: "review" },
  { url: `${BASE}/reviews/is-chatgpt-plus-worth-it`, type: "review" },
  { url: `${BASE}/compare-tools/chatgpt-vs-claude`, type: "compare_tools" },
  { url: `${BASE}/compare/udemy-ai-courses`, type: "compare_platform" },
  { url: `${BASE}/prompts/claude-prompts`, type: "prompt_page" },
  { url: `${BASE}/prompts/grok-bot-prompts-sales`, type: "prompt_page" },
  { url: `${BASE}/collections/learn-claude`, type: "collection" },
  { url: `${BASE}/ai-for/marketers`, type: "role_page" },
  { url: `${BASE}/free-tools/prompt-optimizer`, type: "free_tool" },
  { url: `${BASE}/blog/grok-bot-for-gtm`, type: "blog_post" },
  { url: `${BASE}/community/reconcile-expenses-from-receipts-wagjdx`, type: "community_post" },
  { url: `${BASE}/dashboard`, type: "GATED-control" },
];

const usage = { input: 0, output: 0, calls: 0, retries: 0, latencyTotal: 0 };
const byLocale: Record<string, { in: number; out: number; calls: number }> = { ms: { in: 0, out: 0, calls: 0 }, th: { in: 0, out: 0, calls: 0 }, vi: { in: 0, out: 0, calls: 0 } };

async function callGemini(system: string, user: string, opts: { model?: string; timeoutMs?: number; maxRetries?: number } = {}) {
  const model = opts.model ?? MODEL, timeoutMs = opts.timeoutMs ?? 45000, maxRetries = opts.maxRetries ?? 5;
  const body = { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: { responseMimeType: "application/json", responseSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } } };
  let attempt = 0, lastErr: any;
  while (attempt <= maxRetries) {
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), timeoutMs); const t0 = Date.now();
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(KEY!)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: ctrl.signal });
      clearTimeout(timer); usage.calls++; usage.latencyTotal += Date.now() - t0;
      if (!res.ok) { if (res.status === 429) stat429++; const retryable = res.status === 429 || res.status >= 500; if (retryable && attempt < maxRetries) { attempt++; usage.retries++; await new Promise(r => setTimeout(r, Math.min(16000, 1000 * 2 ** attempt))); continue; } throw Object.assign(new Error(`gemini ${res.status}`), { status: res.status, retryable }); }
      const data = await res.json(); const um = data.usageMetadata || {}; usage.input += um.promptTokenCount || 0; usage.output += um.candidatesTokenCount || 0;
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      let text: string; try { text = String(JSON.parse(raw).text ?? "").trim(); } catch { throw Object.assign(new Error("malformed"), { retryable: attempt < maxRetries }); }
      return { text, tokens: { in: um.promptTokenCount || 0, out: um.candidatesTokenCount || 0 } };
    } catch (e: any) { clearTimeout(timer); lastErr = e; const retryable = e.name === "AbortError" || e.retryable; if (retryable && attempt < maxRetries) { attempt++; usage.retries++; await new Promise(r => setTimeout(r, Math.min(16000, 1000 * 2 ** attempt))); continue; } throw e; }
  }
  throw lastErr;
}

let cacheHits = 0;
async function translateField(text: string, locale: string) {
  const ckey = `${locale}|${fhash(text)}`;
  if (cache[ckey] !== undefined) { cacheHits++; return cache[ckey]; } // idempotent + resumable: skip completed work
  const { masked, restore } = maskProtected(text); const hasTok = /§\d+§/.test(masked);
  const sys = `Translate from English into ${LOCALE_NAME[locale] ?? locale}. Natural, native phrasing — not word-for-word. Do not invent or omit meaning; keep numbers/dates exact.${hasTok ? " Preserve every §N§ placeholder exactly and add none." : ""} Never translate via another language. Return ONLY JSON {"text":"<translation>"}.`;
  const r = await callGemini(sys, masked); byLocale[locale].in += r.tokens.in; byLocale[locale].out += r.tokens.out; byLocale[locale].calls++;
  const out = restore(r.text);
  cache[ckey] = out; if (++cacheDirty >= 5) await persistCache();
  return out;
}

async function pool<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length) as any; let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => { while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx]); } }));
  return out;
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const hash = (s: string) => { let h = 5381; const n = norm(s); for (let i = 0; i < n.length; i++) h = ((h << 5) + h + n.charCodeAt(i)) >>> 0; return h.toString(16); };

async function main() {
  if (!KEY) { console.log("STOP: GEMINI_API_KEY not visible."); process.exit(2); }
  console.log("MODEL:", MODEL, "| KEY: SET (hidden) | Playwright headless");
  try { cache = JSON.parse(await readFile(CACHE_FILE, "utf8")); console.log(`resumed cache: ${Object.keys(cache).length} translated fields`); } catch { console.log("fresh cache"); }
  const renderer = PlaywrightRenderer;
  const report: any = { model: MODEL, bodyMax: BODY_MAX, entities: [], gatedRefused: 0 };
  const masters: any[] = [];

  // ---- Extraction (headless, full body) + completeness gate ----
  for (const m of MANIFEST) {
    try {
      const ex = await extractRendered(m.url, renderer);
      if (ex.scopeDecision === "out-of-scope") { report.gatedRefused++; report.entities.push({ url: m.url, type: m.type, result: "REFUSED (gated)" }); continue; }
      const bodyRaw = ex.fields.bodyText?.value ?? "";
      const body = bodyRaw.slice(0, BODY_MAX);
      const en: Record<string, string> = {};
      if (ex.fields.title.value) en.title = ex.fields.title.value;
      if (ex.fields.description.value) en.summary = ex.fields.description.value;
      if (body) en.body = body;
      (ex.fields.faq.value ?? []).slice(0, 2).forEach((f, i) => { en[`faq_q${i}`] = f.q; en[`faq_a${i}`] = f.a; });
      const gate = checkCompleteness(m.type as any, ex, bodyRaw);
      report.entities.push({ url: m.url, type: m.type, httpStatus: ex.httpStatus, sourceHash: ex.rawHash, retrievedAt: ex.retrievedAt, enFields: Object.keys(en).length, bodyChars: bodyRaw.length, bodyTranslatedChars: body.length, headings: ex.fields.headings.value?.length ?? 0, faq: (ex.fields.faq.value ?? []).length, completeness: gate.status, missing: gate.missing });
      if (gate.ok) masters.push({ url: m.url, type: m.type, en });
      else console.log(`  GATE-FAIL ${m.type} ${m.url} missing=${gate.missing.join(",")}`);
    } catch (e: any) { report.entities.push({ url: m.url, type: m.type, result: `EXTRACT ERROR ${e?.message || e}` }); }
  }
  console.log(`extracted: ${masters.length} publishable, gatedRefused: ${report.gatedRefused}, total: ${MANIFEST.length}`);

  // ---- Translate all masters × 3 locales (concurrency) + QA ----
  const jobs: Array<{ mi: number; loc: string; key: string; text: string }> = [];
  masters.forEach((mst, mi) => { for (const loc of LOCALES) for (const [k, v] of Object.entries(mst.en)) { if (k === "body" && !BODY_TYPES.has(mst.type)) continue; jobs.push({ mi, loc, key: k, text: v as string }); } });
  console.log(`translation jobs: ${jobs.length} (entities ${masters.length} × locales 3 × fields)`);
  const done = await pool(jobs, CONCURRENCY, async (j) => { try { return { ...j, out: await translateField(j.text, j.loc), ok: true }; } catch (e: any) { return { ...j, out: "", ok: false, err: e?.message }; } });

  // assemble + QA
  const qaSummary: any = { ms: { entities: 0, p0: 0, p1: 0, p2: 0 }, th: { entities: 0, p0: 0, p1: 0, p2: 0 }, vi: { entities: 0, p0: 0, p1: 0, p2: 0 } };
  const translated: Record<number, Record<string, Record<string, string>>> = {};
  const failCount = done.filter(d => !d.ok).length;
  for (const d of done) { if (!d.ok) continue; (translated[d.mi] ??= {})[d.loc] ??= {}; translated[d.mi][d.loc][d.key] = d.out; }
  const entityQa: any[] = [];
  masters.forEach((mst, mi) => {
    for (const loc of LOCALES) {
      const fields = translated[mi]?.[loc] ?? {};
      const qa = translationQa(mst.en, { contentId: mst.url, targetLocale: loc as any, provider: "google", model: MODEL, timestamp: "", fields: Object.entries(fields).map(([key, text]) => ({ key, text, policy: policyFor(key) })) });
      qaSummary[loc].entities++; for (const iss of qa) qaSummary[loc][iss.severity.toLowerCase()]++;
      entityQa.push({ type: mst.type, url: mst.url, loc, issues: qa.map((i: any) => `${i.severity}:${i.check}:${i.field}`) });
    }
  });
  report.qa = qaSummary; report.translationFailures = failCount;

  // ---- Native-review stratified sample (title/summary/1 faq for varied types) ----
  const stratified = masters.filter((m, i) => [0, 1, 3, 7, 9, 12].includes(i)).slice(0, 6);
  const rev = ["# PHASE 2.8 — NATIVE REVIEW SAMPLE", "", `Model: ${MODEL}. Stratified across page types. Reviewers score accuracy/naturalness/terminology/tone/diacritics/Malaysian-not-Indonesian. Full bodies omitted here for length; see the pilot for full-body QA.`, ""];
  stratified.forEach((mst, si) => {
    const mi = masters.indexOf(mst);
    rev.push(`## ${si + 1}. ${mst.type} — ${mst.url}`);
    for (const k of ["title", "summary", "faq_a0"]) {
      if (!mst.en[k]) continue;
      rev.push(`**${k}**`, `- EN: ${mst.en[k]}`, `- MS: ${translated[mi]?.ms?.[k] ?? ""}`, `- TH: ${translated[mi]?.th?.[k] ?? ""}`, `- VI: ${translated[mi]?.vi?.[k] ?? ""}`, "");
    }
  });
  await writeFile("docs/specs/PHASE_2_8_NATIVE_REVIEW.md", rev.join("\n"));

  // ---- Failure test ----
  let failIsolated = false, failAudit = "", timeoutRetried = false;
  try { await callGemini("x", "y", { model: "gemini-nonexistent-zzz", maxRetries: 0 }); } catch (e: any) { failIsolated = true; failAudit = `status=${e.status} retryable=${!!e.retryable}`; }
  const beforeRetry = usage.retries; try { await callGemini("x", "y", { timeoutMs: 1, maxRetries: 1 }); } catch { timeoutRetried = usage.retries > beforeRetry; }
  report.failure = { isolated: failIsolated, audit: failAudit, timeoutRetried, translationJobFailures: failCount, note: "field-level failures isolated; entity still QA'd on delivered fields" };
  report.rateLimit = { total429: stat429, retries: usage.retries, backoff: "exponential 1s→16s cap", cacheHits, concurrency: CONCURRENCY, permanentFailures: failCount };

  // ---- Idempotency + source-update (field-hash, whitespace-normalized) ----
  const idemCache: Record<string, boolean> = {};
  const sample = masters[0].en;
  // measures skip-vs-process at the pilot's own level; underlying translateField also globally caches
  const runOnce = async (fields: Record<string, string>, loc: string) => { let t = 0, s = 0; for (const [, v] of Object.entries(fields)) { const h = `${loc}|${hash(v)}`; if (idemCache[h]) { s++; continue; } idemCache[h] = true; await translateField(v, loc); t++; } return { translated: t, skipped: s }; };
  try {
    const idem1 = await runOnce(sample, "ms");
    const idem2 = await runOnce(sample, "ms");
    const semChange = { ...sample, summary: (sample.summary ?? sample.title) + " (now includes a new limit of 5 projects.)" }; // semantic
    const idemSem = await runOnce(semChange, "ms");
    const nonSem = { ...semChange, title: semChange.title + "   " }; // whitespace only → normalized → skip
    const idemNon = await runOnce(nonSem, "ms");
    report.idempotency = { firstRun: idem1, rerunUnchanged: idem2, afterSemanticChange: idemSem, afterNonSemanticChange: idemNon, ok: idem2.translated === 0 && idemSem.translated === 1 && idemNon.translated === 0 };
  } catch (e: any) { report.idempotency = { error: e?.message || String(e), note: "isolated; run did not abort" }; }

  // ---- Cost ----
  const RATE_IN = 0.25, RATE_OUT = 1.50; // per 1M tokens — spec-quoted for flash-lite, UNVERIFIED; reverify at Google pricing
  const cost = (usage.input / 1e6) * RATE_IN + (usage.output / 1e6) * RATE_OUT;
  const perEntity = cost / Math.max(1, masters.length);
  report.cost = {
    model: MODEL, calls: usage.calls, retries: usage.retries, inputTokens: usage.input, outputTokens: usage.output,
    avgLatencyMs: Math.round(usage.latencyTotal / Math.max(1, usage.calls)),
    byLocale, rate: { inPer1M: RATE_IN, outPer1M: RATE_OUT, note: "SPEC-QUOTED, UNVERIFIED — reverify actual Google pricing" },
    pilotCostUSD: Number(cost.toFixed(5)), costPerEntityUSD: Number(perEntity.toFixed(5)),
    projection: { "100": Number((perEntity * 100).toFixed(2)), "1000": Number((perEntity * 1000).toFixed(2)), "full~2056": Number((perEntity * 2056).toFixed(2)), note: "×3 locales already included in per-entity; label = ESTIMATE" },
  };

  report.throughput = { wallSeconds: Math.round((Date.now() - runStart) / 1000), apiCalls: usage.calls, cacheHits, effectiveFieldsPerMin: Math.round((usage.calls + cacheHits) / Math.max(1, (Date.now() - runStart) / 60000)) };
  await persistCache();
  await writeFile("docs/specs/PHASE_2_8_PILOT_RESULTS.json", JSON.stringify({ report, entityQa }, null, 2));
  console.log("\n=== SUMMARY ==="); console.log(JSON.stringify(report, null, 1));
}
main().catch(e => { console.error("PILOT ERROR:", e?.message || e); process.exit(1); });
