/**
 * GET /launch/verify — Phase 3 regression suite (Step 6). Deterministic,
 * network-free unit checks over the launch primitives, INCLUDING seeded failure
 * cases the suite must catch. Dev-gated. Returns machine-readable pass/fail.
 * (Repo has no jest/vitest; the established test harness is a dev route — this
 * runs inside Next so it is not blocked by the Payload-CLI TLA bug F-A.)
 */
import { maskProtected, MockTranslator, policyFor, type Field, type TranslateResult } from "@/lib/translate/translator";
import { translationQa } from "@/lib/translate/translation-qa";
import { numberIntegrity, extractNumbers, semanticQa } from "@/lib/translate/semantic-qa";
import { chunkDocument, reassemble, verifyNoLoss } from "@/lib/translate/chunker";
import { runLaunchGate } from "@/lib/launch/gate";
import { assertPublishable, canApprove } from "@/lib/launch/publish-guard";
import { assertTerms } from "@/lib/launch/termbase";
import { withRetry, isTransient, mapLimit } from "@/lib/translate/retry";

interface Case { name: string; pass: boolean; detail: string }

const tr = (contentId: string, fields: Field[]): TranslateResult => ({ contentId, targetLocale: "ms", fields, provider: "test", model: "t", timestamp: "" });

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production" && req.headers.get("x-pilot-token") !== process.env.PILOT_TOKEN) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const cases: Case[] = [];
  const check = async (name: string, fn: () => boolean | Promise<boolean>, detail = "") => {
    try { cases.push({ name, pass: await fn(), detail }); } catch (e) { cases.push({ name, pass: false, detail: `threw: ${String(e).slice(0, 120)}` }); }
  };

  // ── number preservation ──────────────────────────────────────────────
  await check("number.preserved.pass", () => numberIntegrity("Costs $20 and saves 5 hours", "Kos $20 dan jimat 5 jam").length === 0);
  await check("number.dropped.CAUGHT", () => numberIntegrity("Costs $20 and 5 hours", "Kos dan 5 jam").some((i) => i.check === "number_omitted_or_changed"), "seeded: dropped $20");
  await check("number.invented.CAUGHT", () => numberIntegrity("Costs $20", "Kos $20 untuk 3 orang").some((i) => i.check === "number_invented"), "seeded: invented 3");
  await check("number.separators", () => extractNumbers("1,000 and 1.000").includes("1000"), "thousands separator normalized");

  // ── date preservation (year mutation caught by number integrity) ─────
  await check("date.mutation.CAUGHT", () => numberIntegrity("Released in 2024", "Dikeluarkan pada 2025").length > 0, "seeded: 2024→2025");

  // ── URL / code / protected-token restoration ────────────────────────
  await check("url.preserved", () => { const { masked, restore } = maskProtected("See https://x.io/a?b=1 now"); return !masked.includes("https://") && restore(masked).includes("https://x.io/a?b=1"); });
  await check("code.preserved", () => { const { masked, restore } = maskProtected("Run `npm run build` first"); return !masked.includes("npm run build") && restore(masked).includes("`npm run build`"); });
  await check("protected.name.roundtrip", () => { const { masked, restore } = maskProtected("Use ChatGPT and Claude"); return restore(masked) === "Use ChatGPT and Claude"; });

  // ── no placeholder leakage (gate flags stray §N§) ────────────────────
  await check("placeholder.leak.CAUGHT", async () => {
    const src = { body: "Visit {{link}} today" };
    const r = tr("c1", [{ key: "body", text: "Lawati §0§ hari ini", policy: "translate" }]);
    const g = await runLaunchGate(src, r, "ms");
    return g.issues.some((i) => i.check === "placeholder_leak") && g.verdict === "block";
  }, "seeded: unrestored §0§");

  // ── untranslated-body leakage ────────────────────────────────────────
  await check("untranslated.body.CAUGHT", () => {
    const src = { summary: "This tool helps you write better and faster with your team" };
    const r = tr("c2", [{ key: "summary", text: "This tool helps you write better and faster with your team", policy: "translate" }]);
    return translationQa(src, r).some((i) => i.check === "untranslated_body" || i.check === "english_leakage");
  }, "seeded: MS identical to EN");

  // ── semantic equivalence (judge says not-equivalent → P0) ────────────
  await check("semantic.nonequivalence.CAUGHT", async () => {
    const judge = async () => ({ text: JSON.stringify({ equivalent: false, issues: ["claim strength changed may→will"], confidence: 0.9 }) });
    const s = await semanticQa("It may help", "Ia akan membantu", "ms", judge);
    return s.some((i) => i.check === "semantic_nonequivalence" && i.severity === "P0");
  }, "seeded: may→will");

  // ── Malaysian-Malay localization rules ───────────────────────────────
  await check("ms.indonesian.CAUGHT", () => {
    const src = { summary: "This is free to download" };
    const r = tr("c3", [{ key: "summary", text: "Ini gratis untuk unduh sekarang juga", policy: "translate" }]);
    return translationQa(src, r).some((i) => i.check === "ms_indonesian_contamination");
  }, "seeded: gratis/unduh");
  await check("termbase.inconsistent.CAUGHT", () => assertTerms("Write a good prompt", "Tulis arahan yang baik", "ms").some((t) => t.expected === "gesaan"), "seeded: prompt not 'gesaan'");
  await check("termbase.consistent.pass", () => assertTerms("Write a good prompt", "Tulis gesaan yang baik", "ms").length === 0);

  // ── SEO metadata ─────────────────────────────────────────────────────
  await check("seo.missing.CAUGHT", async () => {
    const r = tr("c4", [{ key: "summary", text: "ringkasan bermakna dengan 5 mata", policy: "translate" }]); // no title/seoTitle
    const g = await runLaunchGate({ summary: "meaningful summary with 5 points" }, r, "ms");
    return g.issues.some((i) => i.layer === "seo" && i.check === "seo_title_missing");
  }, "seeded: no seo title");

  // ── locale publication gating (pure invariant) ───────────────────────
  await check("gate.publish.unreviewed.BLOCK", () => assertPublishable({ locale: "ms", prevStatus: "mt_generated", translatedFromSourceVersion: 1, sourceVersion: 1 }).ok === false, "seeded: publish from mt_generated");
  await check("gate.publish.qafailed.BLOCK", () => assertPublishable({ locale: "ms", prevStatus: "in_review", translatedFromSourceVersion: 1, sourceVersion: 1 }).ok === false, "seeded: publish from in_review");
  await check("gate.publish.approved.ALLOW", () => assertPublishable({ locale: "ms", prevStatus: "approved", translatedFromSourceVersion: 2, sourceVersion: 2 }).ok === true);
  await check("gate.publish.en.ALLOW", () => assertPublishable({ locale: "en", prevStatus: "draft" }).ok === true);

  // ── approve gate: QA-blocked variant is NOT approvable (no override) ─────
  await check("approve.qablocked.BLOCK", () => canApprove("mt_generated", "ms").ok === false, "seeded: approve a P0-blocked MS");
  await check("approve.inreview.ALLOW", () => canApprove("in_review", "ms").ok === true);

  // ── stale translation detection ──────────────────────────────────────
  await check("stale.publish.BLOCK", () => assertPublishable({ locale: "ms", prevStatus: "approved", translatedFromSourceVersion: 1, sourceVersion: 2 }).ok === false, "seeded: tv1 < sv2");
  await check("stale.flag.BLOCK", () => assertPublishable({ locale: "ms", prevStatus: "approved", translatedFromSourceVersion: 2, sourceVersion: 2, stale: true }).ok === false, "seeded: stale flag");

  // ── retry / idempotency ──────────────────────────────────────────────
  await check("retry.transient", () => isTransient(new Error("gemini 429")) && isTransient(new Error("fetch failed")) && !isTransient(new Error("gemini 400")));
  await check("retry.recovers", async () => { let n = 0; const v = await withRetry(async () => { if (n++ < 2) throw new Error("429"); return "ok"; }, { baseMs: 1, capMs: 2 }); return v === "ok" && n === 3; }, "429×2 then success");
  await check("retry.gives.up.nonTransient", async () => { let n = 0; try { await withRetry(async () => { n++; throw new Error("400 bad"); }, { baseMs: 1 }); return false; } catch { return n === 1; } }, "no retry on 400");
  await check("concurrency.limit", async () => { let active = 0, max = 0; await mapLimit([1, 2, 3, 4, 5], 2, async () => { active++; max = Math.max(max, active); await new Promise((r) => setTimeout(r, 3)); active--; return 0; }); return max <= 2; });
  await check("idempotency.mock.stable", async () => { const f: Field[] = [{ key: "title", text: "Hello team", policy: "translate" }]; const a = await MockTranslator.translate({ contentId: "x", sourceLocale: "en", targetLocale: "ms", fields: f }); const b = await MockTranslator.translate({ contentId: "x", sourceLocale: "en", targetLocale: "ms", fields: f }); return a.fields[0].text === b.fields[0].text; });

  // ── long-content chunking / reassembly ───────────────────────────────
  await check("chunk.roundtrip.lossless", () => {
    const doc = Array.from({ length: 400 }, (_, i) => `Paragraph ${i} with content and numbers ${i}.`).join("\n\n");
    const chunks = chunkDocument(doc, 800);
    return chunks.length > 1 && verifyNoLoss(doc, chunks).ok && reassemble(chunks).length > 0;
  }, "400-para doc → chunks → lossless");

  // ── policy sanity ────────────────────────────────────────────────────
  await check("policy.seoTitle.localize", () => policyFor("seoTitle") === "localize" && policyFor("slug") === "skip" && policyFor("body") === "translate");

  const passed = cases.filter((c) => c.pass).length;
  const failed = cases.filter((c) => !c.pass);
  return Response.json(
    { ranAt: new Date().toISOString(), total: cases.length, passed, failed: failed.length, failing: failed, cases },
    { status: failed.length === 0 ? 200 : 422 },
  );
}
