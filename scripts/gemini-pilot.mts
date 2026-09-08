/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Phase 2.7 Gemini real pilot (Tests 1–6). Pure: dotenv + fetch, no Payload/DB.
 * Never prints the API key. Records model, telemetry, QA. Small controlled sample.
 */
import "dotenv/config";
import { maskProtected, policyFor } from "../src/lib/translate/translator.ts";
import { translationQa } from "../src/lib/translate/translation-qa.ts";
import { extract } from "../src/lib/extract/extractor.ts";
import { writeFile } from "node:fs/promises";

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const REVIEW_OUT = "docs/specs/PHASE_2_7_NATIVE_REVIEW_SAMPLE.md";
const LOCALE_NAME: Record<string, string> = {
  ms: "Malaysian Malay (Bahasa Melayu as used in Malaysia, NOT Indonesian)", th: "Thai", vi: "Vietnamese",
};
const usage = { input: 0, output: 0, calls: 0, retries: 0, latencyMsTotal: 0 };

async function callGemini(system: string, user: string, opts: { model?: string; timeoutMs?: number; maxRetries?: number } = {}) {
  const model = opts.model ?? MODEL;
  const timeoutMs = opts.timeoutMs ?? 30000;
  const maxRetries = opts.maxRetries ?? 1;
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: { responseMimeType: "application/json", responseSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
  };
  let attempt = 0; let lastErr: any;
  while (attempt <= maxRetries) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const t0 = Date.now();
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(KEY!)}`,
        { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: ctrl.signal });
      clearTimeout(timer);
      const latency = Date.now() - t0; usage.latencyMsTotal += latency; usage.calls++;
      if (!res.ok) {
        const retryable = res.status === 429 || res.status >= 500;
        if (retryable && attempt < maxRetries) { attempt++; usage.retries++; await new Promise(r => setTimeout(r, 400)); continue; }
        throw Object.assign(new Error(`gemini ${res.status}`), { status: res.status, retryable });
      }
      const data = await res.json();
      const um = data.usageMetadata || {};
      usage.input += um.promptTokenCount || 0; usage.output += um.candidatesTokenCount || 0;
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      let text: string;
      try { text = String(JSON.parse(raw).text ?? "").trim(); } catch { throw Object.assign(new Error("malformed: non-JSON"), { retryable: false }); }
      return { text, latency, tokens: { in: um.promptTokenCount || 0, out: um.candidatesTokenCount || 0 } };
    } catch (e: any) {
      clearTimeout(timer);
      lastErr = e;
      const retryable = e.name === "AbortError" || e.retryable;
      if (retryable && attempt < maxRetries) { attempt++; usage.retries++; await new Promise(r => setTimeout(r, 400)); continue; }
      throw e;
    }
  }
  throw lastErr;
}

async function translateField(text: string, locale: string, opts = {}) {
  const { masked, restore } = maskProtected(text);
  const hasTokens = /§\d+§/.test(masked);
  const sys = `Translate from English into ${LOCALE_NAME[locale] ?? locale}. Natural, native phrasing — not word-for-word. Do not invent or omit meaning.${hasTokens ? " Preserve every §N§ placeholder exactly and do not add new ones." : ""} Never translate via another language. Return ONLY JSON {"text":"<translation>"}.`;
  const r = await callGemini(sys, masked, opts);
  return { text: restore(r.text), latency: r.latency, tokens: r.tokens };
}

const hash = (s: string) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(16); };

async function main() {
  if (!KEY) { console.log("STOP: GEMINI_API_KEY not visible to process. Ensure it is in .env and the runner loads dotenv."); process.exit(2); }
  console.log("KEY present: SET (value hidden). MODEL:", MODEL);
  const results: any = { model: MODEL };

  // ---- TEST 1: connectivity, tiny sentence, structured output, protected tokens ----
  console.log("\n=== TEST 1 — CONNECTIVITY ===");
  const tiny = "Save time by letting AI draft your weekly report.";
  const t1: any = {};
  for (const loc of ["ms", "th", "vi"]) { const r = await translateField(tiny, loc); t1[loc] = r.text; console.log(`  ${loc}: len=${r.text.length} tokens(in/out)=${r.tokens.in}/${r.tokens.out} ${r.latency}ms`); }
  // protected-token test
  const prot = "Use {{tool}} with ChatGPT at https://example.com/docs — see the [GUIDE].";
  const protMs = await translateField(prot, "ms");
  const tokensOk = ["{{tool}}", "ChatGPT", "https://example.com/docs", "[GUIDE]"].every(tok => protMs.text.includes(tok));
  console.log("  protected-token preservation (ms):", tokensOk ? "PASS" : "FAIL");
  results.test1 = { ms: t1.ms, th: t1.th, vi: t1.vi, protectedTokensPreserved: tokensOk };

  // ---- TEST 2: real public content → EN master → MS/TH/VI → QA ----
  console.log("\n=== TEST 2 — REAL CONTENT ===");
  const url = "https://academy.techpresso.co/reviews/is-claude-pro-worth-it";
  const ex = await extract(url);
  const enMaster: Record<string, string> = { title: ex.fields.title.value ?? "", summary: ex.fields.description.value ?? "" };
  (ex.fields.faq.value ?? []).slice(0, 2).forEach((f, i) => { enMaster[`faq_q${i}`] = f.q; enMaster[`faq_a${i}`] = f.a; });
  console.log("  extracted EN master fields:", Object.keys(enMaster).join(","), "(scope:", ex.scopeDecision + ")");
  const test2: any = {}; const qaAll: any = {};
  for (const loc of ["ms", "th", "vi"]) {
    const fields: any = {};
    for (const [k, v] of Object.entries(enMaster)) { if (!v) continue; const r = await translateField(v, loc); fields[k] = r.text; }
    const qa = translationQa(enMaster, { contentId: "tp-review", targetLocale: loc as any, provider: "google", model: MODEL, timestamp: "", fields: Object.entries(fields).map(([key, text]) => ({ key, text: text as string, policy: policyFor(key) })) });
    test2[loc] = fields; qaAll[loc] = qa;
    console.log(`  ${loc}: fields=${Object.keys(fields).length} QA issues=${qa.length} [${qa.map((i: any) => i.severity + ":" + i.check).join(",")}]`);
  }
  results.test2 = { fields: Object.keys(enMaster).length, qa: Object.fromEntries(Object.entries(qaAll).map(([l, a]: any) => [l, a.length])) };

  // ---- TEST 3: native-review sample ----
  const rev = ["# PHASE 2.7 — NATIVE REVIEW SAMPLE", "", `Model: ${MODEL}. Source: public review page (title/summary/FAQ). For native reviewers — evaluate accuracy, fluency, terminology, diacritics, Malaysian-not-Indonesian.`, ""];
  for (const k of Object.keys(enMaster)) {
    if (!enMaster[k]) continue;
    rev.push(`### ${k}`, `- **EN:** ${enMaster[k]}`, `- **MS:** ${test2.ms[k] ?? ""}`, `- **TH:** ${test2.th[k] ?? ""}`, `- **VI:** ${test2.vi[k] ?? ""}`, "");
  }
  await writeFile(REVIEW_OUT, rev.join("\n"));
  console.log("\n=== TEST 3 — NATIVE REVIEW SAMPLE written:", REVIEW_OUT);

  // ---- TEST 5: failure (bad model → non-retryable, isolated, auditable) + timeout retry ----
  console.log("\n=== TEST 5 — FAILURE RECOVERY ===");
  let failIsolated = false, failAudit = "";
  try { await callGemini("x", "y", { model: "gemini-does-not-exist-xyz", maxRetries: 0 }); }
  catch (e: any) { failIsolated = true; failAudit = `status=${e.status} retryable=${!!e.retryable}`; console.log("  bad-model call isolated:", failAudit); }
  // timeout → retry path
  let timeoutRetried = false;
  try { await callGemini("x", "y", { timeoutMs: 1, maxRetries: 1 }); } catch { timeoutRetried = usage.retries > 0; console.log("  timeout triggered retry:", timeoutRetried); }
  results.test5 = { isolated: failIsolated, audit: failAudit, timeoutRetried };

  // ---- TEST 6: idempotency (hash skip) + targeted retranslate ----
  console.log("\n=== TEST 6 — IDEMPOTENCY ===");
  const cache: Record<string, string> = {};
  const fieldsV1 = { title: enMaster.title, summary: enMaster.summary };
  const run = async (fields: Record<string, string>) => { let translated = 0, skipped = 0; for (const [k, v] of Object.entries(fields)) { const h = `ms|${hash(v)}`; if (cache[h]) { skipped++; continue; } const r = await translateField(v, "ms"); cache[h] = r.text; translated++; } return { translated, skipped }; };
  const r1 = await run(fieldsV1); console.log("  first run:", JSON.stringify(r1));
  const r2 = await run(fieldsV1); console.log("  second run (unchanged):", JSON.stringify(r2));
  const fieldsV2 = { title: enMaster.title, summary: enMaster.summary + " Updated." };
  const r3 = await run(fieldsV2); console.log("  after changing summary:", JSON.stringify(r3));
  results.test6 = { first: r1, second: r2, afterChange: r3, ok: r1.translated === 2 && r2.skipped === 2 && r3.translated === 1 && r3.skipped === 1 };

  // ---- TEST 4: cost/usage ----
  const RATE_IN = 0.10, RATE_OUT = 0.40; // USD per 1M tokens — ASSUMED for 2.5-flash-lite; VERIFY before scale
  const cost = (usage.input / 1e6) * RATE_IN + (usage.output / 1e6) * RATE_OUT;
  results.test4 = { provider: "google", model: MODEL, calls: usage.calls, retries: usage.retries, inputTokens: usage.input, outputTokens: usage.output, avgLatencyMs: Math.round(usage.latencyMsTotal / Math.max(1, usage.calls)), estCostUSD: Number(cost.toFixed(6)), rateNote: "rates ASSUMED, verify provider pricing" };
  console.log("\n=== TEST 4 — COST/USAGE ===\n ", JSON.stringify(results.test4));

  console.log("\n=== SUMMARY ==="); console.log(JSON.stringify(results, null, 1));
}
main().catch(e => { console.error("PILOT ERROR:", e?.message || e); process.exit(1); });
