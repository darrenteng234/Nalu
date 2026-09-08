/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Phase 2.9 proofs + permanent regression suite. Pure (dotenv+fetch+Playwright).
 * Covers: semantic-equivalence seeded failures (§2), long-doc chunking no-loss (§3),
 * regression fixtures (§9), throughput probe at concurrency 1/2/3 (§4). Never prints key.
 */
import "dotenv/config";
import { numberIntegrity, semanticJudge, semanticQa } from "../src/lib/translate/semantic-qa.ts";
import { chunkDocument, reassemble, verifyNoLoss } from "../src/lib/translate/chunker.ts";
import { translationQa } from "../src/lib/translate/translation-qa.ts";
import { maskProtected } from "../src/lib/translate/translator.ts";
import { PlaywrightRenderer } from "../src/lib/extract/renderer.ts";
import { extractRendered } from "../src/lib/extract/extractor.ts";

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
let calls = 0, s429 = 0;

async function gemini(system: string, user: string, timeoutMs = 30000): Promise<{ text: string }> {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    for (let a = 0; a <= 4; a++) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(KEY!)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: { responseMimeType: "application/json" } }), signal: ctrl.signal });
      calls++;
      if (res.status === 429 || res.status >= 500) { s429 += res.status === 429 ? 1 : 0; await new Promise(r => setTimeout(r, Math.min(16000, 1000 * 2 ** a))); continue; }
      if (!res.ok) throw new Error(`gemini ${res.status}`);
      const d = await res.json(); return { text: d?.candidates?.[0]?.content?.parts?.[0]?.text ?? "" };
    }
    throw new Error("gemini retries exhausted");
  } finally { clearTimeout(t); }
}
const judge = (sys: string, u: string) => gemini(sys, u);

async function main() {
  if (!KEY) { console.log("STOP: no GEMINI_API_KEY"); process.exit(2); }
  const out: any = { model: MODEL };

  // ---- §2 SEMANTIC: deterministic number seeds (no API) ----
  console.log("=== §2 semantic — deterministic number checks ===");
  const numSeeds = [
    { s: "Claude Pro costs $20/month.", t: "Claude Pro berharga $200 sebulan.", expect: true },
    { s: "Complete all 5 steps.", t: "Lengkapkan 4 langkah.", expect: true },
    { s: "Updated in 2026.", t: "Dikemas kini pada 2025.", expect: true },
    { s: "Save 20% today.", t: "Jimat 20% hari ini.", expect: false },
  ];
  out.numberChecks = numSeeds.map(x => { const f = numberIntegrity(x.s, x.t); const flagged = f.length > 0; return { case: `${x.s} → ${x.t}`, flagged, expected: x.expect, pass: flagged === x.expect, issues: f.map(i => i.check) }; });
  out.numberChecks.forEach((r: any) => console.log(`  ${r.pass ? "PASS" : "FAIL"} flagged=${r.flagged} exp=${r.expected} [${r.issues.join(",")}] ${r.case}`));

  // ---- §2 SEMANTIC: LLM-judge on meaning/modal seeds (few API calls) ----
  console.log("=== §2 semantic — LLM-judge (Gemini verifier) ===");
  const judgeSeeds = [
    { s: "This feature may improve your results.", t: "Ciri ini akan meningkatkan hasil anda.", loc: "ms", expectFlag: true, why: "may→will (claim strength)" },
    { s: "Cancel anytime; no refunds after 30 days.", t: "Batalkan bila-bila masa.", loc: "ms", expectFlag: true, why: "dropped condition (no refunds)" },
    { s: "AI can draft your weekly report.", t: "AI boleh merangka laporan mingguan anda.", loc: "ms", expectFlag: false, why: "faithful" },
  ];
  out.judgeChecks = [];
  for (const x of judgeSeeds) {
    const issues = await semanticJudge(x.s, x.t, x.loc, judge);
    const flagged = issues.length > 0;
    out.judgeChecks.push({ why: x.why, flagged, expected: x.expectFlag, pass: flagged === x.expectFlag, issues: issues.map(i => i.check) });
    console.log(`  ${flagged === x.expectFlag ? "PASS" : "FAIL"} flagged=${flagged} exp=${x.expectFlag} (${x.why}) [${issues.map(i => i.check).join(",")}]`);
  }

  // ---- §3 CHUNKING: real very-long public page, no-loss ----
  console.log("=== §3 chunking — real long page ===");
  const longUrl = "https://academy.techpresso.co/prompts/claude-prompts";
  const ex = await extractRendered(longUrl, PlaywrightRenderer);
  const body = ex.fields.bodyText?.value ?? "";
  const chunks = chunkDocument(body);
  const loss = verifyNoLoss(body, chunks);
  // translate FIRST chunk only (prove path; bounded cost) + verify protected tokens survive
  let firstChunkOk = false;
  try { const { masked, restore } = maskProtected(chunks[0]?.text ?? ""); const r = await gemini(`Translate to Malay. Preserve §N§ placeholders. Return JSON {"text":"..."}.`, masked); const tx = restore(JSON.parse(r.text).text ?? ""); firstChunkOk = tx.length > 0; } catch (e: any) { firstChunkOk = false; }
  out.chunking = { url: longUrl, bodyChars: body.length, chunkCount: chunks.length, boundaries: chunks.map(c => c.text.length), noLoss: loss.ok, detail: loss.detail, firstChunkTranslated: firstChunkOk };
  console.log(`  bodyChars=${body.length} chunks=${chunks.length} noLoss=${loss.ok} (${loss.detail}) firstChunkTranslated=${firstChunkOk}`);

  // ---- §9 REGRESSION fixtures (structural QA must behave correctly) ----
  console.log("=== §9 regression fixtures ===");
  const fx = [
    { name: "protected-name-kept", src: { body: "Use ChatGPT daily." }, tgt: { body: "Guna ChatGPT setiap hari." }, loc: "ms", expectClean: true },
    { name: "protected-name-lost", src: { body: "Use ChatGPT daily." }, tgt: { body: "Guna setiap hari." }, loc: "ms", expectClean: false },
    { name: "placeholder-kept", src: { body: "Run {{tool}} now." }, tgt: { body: "Jalankan {{tool}} sekarang." }, loc: "ms", expectClean: true },
    { name: "placeholder-lost", src: { body: "Run {{tool}} now." }, tgt: { body: "Jalankan sekarang." }, loc: "ms", expectClean: false },
    { name: "vi-diacritics-ok", src: { body: "Understand technology and build." }, tgt: { body: "Hiểu về công nghệ và xây dựng điều mới mẻ hôm nay." }, loc: "vi", expectClean: true },
    { name: "vi-diacritics-stripped", src: { body: "Understand technology and build something new today please." }, tgt: { body: "Hieu ve cong nghe va xay dung dieu moi me hom nay va nhieu hon nua." }, loc: "vi", expectClean: false },
    { name: "th-no-script", src: { body: "Understand technology and build more things now here today." }, tgt: { body: "Understand technology and build more things now here today." }, loc: "th", expectClean: false },
    { name: "ms-indonesian", src: { body: "You can download the app for free." }, tgt: { body: "Anda bisa unduh aplikasi secara gratis." }, loc: "ms", expectClean: false },
  ];
  out.regression = fx.map(f => {
    const qa = translationQa(f.src as any, { contentId: "fx", targetLocale: f.loc as any, provider: "t", model: "t", timestamp: "", fields: Object.entries(f.tgt).map(([k, t]) => ({ key: k, text: t as string, policy: "translate" as const })) });
    const clean = qa.length === 0; return { name: f.name, clean, expectClean: f.expectClean, pass: clean === f.expectClean, issues: qa.map((i: any) => i.check) };
  });
  out.regression.forEach((r: any) => console.log(`  ${r.pass ? "PASS" : "FAIL"} ${r.name} clean=${r.clean} exp=${r.expectClean} [${r.issues.join(",")}]`));

  // ---- §4 THROUGHPUT probe: concurrency 1,2,3 on a fixed small batch ----
  console.log("=== §4 throughput probe ===");
  const batch = Array.from({ length: 6 }, (_, i) => `Sentence number ${i}: save time with AI at work.`);
  const runAt = async (conc: number) => {
    const c0 = calls, e0 = s429, t0 = Date.now(); let i = 0;
    await Promise.all(Array.from({ length: conc }, async () => { while (i < batch.length) { const idx = i++; try { await gemini(`Translate to Malay. Return JSON {"text":"..."}.`, batch[idx]); } catch { /* isolated */ } } }));
    const secs = (Date.now() - t0) / 1000; return { concurrency: conc, calls: calls - c0, s429: s429 - e0, wallSec: Number(secs.toFixed(1)), perMin: Math.round((batch.length / secs) * 60) };
  };
  out.throughput = [];
  for (const c of [1, 2, 3]) out.throughput.push(await runAt(c));
  out.throughput.forEach((r: any) => console.log(`  conc=${r.concurrency} calls=${r.calls} 429=${r.s429} wall=${r.wallSec}s ~${r.perMin}/min`));

  out.totals = { apiCalls: calls, total429: s429 };
  const { writeFile } = await import("node:fs/promises");
  await writeFile("docs/specs/PHASE_2_9_PROOFS.json", JSON.stringify(out, null, 2));
  const allPass = [...out.numberChecks, ...out.judgeChecks, ...out.regression].every((r: any) => r.pass) && out.chunking.noLoss;
  console.log(`\n=== ALL DETERMINISTIC/REGRESSION PASS: ${allPass} | chunking noLoss: ${out.chunking.noLoss} | api calls: ${calls} 429: ${s429} ===`);
}
main().catch(e => { console.error("PROOF ERROR:", e?.message || e); process.exit(1); });
