/* eslint-disable @typescript-eslint/no-explicit-any */
import { MockTranslator, policyFor, type Field, type TranslateResult } from "@/lib/translate/translator";
import { translationQa } from "@/lib/translate/translation-qa";
import { reconcileRemovals } from "@/lib/pipeline/deletion";
import { payloadClient } from "@/lib/content/payload";

/** GET /pilot/phase26-tests — evidence for translation plumbing, translation-QA, deletion. Dev-gated. */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production" && req.headers.get("x-pilot-token") !== process.env.PILOT_TOKEN) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const out: any = {};

  // --- 1) Mock translation plumbing (field-aware) ---
  const source: Record<string, string> = {
    title: "Flowcast",                                   // proper noun → may stay identical
    summary: "A no-code automation tool for teams.",     // body → should differ
    section0: "Connect your apps and run {{workflow}} on a schedule with Claude.",
  };
  const fields: Field[] = Object.entries(source).map(([key, text]) => ({ key, text, policy: policyFor(key) }));
  const good: TranslateResult = await MockTranslator.translate({ contentId: "t1", sourceLocale: "en", targetLocale: "ms", fields });
  out.mock_translation = { provider: good.provider, fields: good.fields.map((f) => ({ key: f.key, differsFromEn: f.text !== source[f.key] })) };
  out.mock_qa_issues = translationQa(source, good); // expect none

  // --- 2) Translation-QA catches seeded-bad translations ---
  const badMs: TranslateResult = { contentId: "t1", targetLocale: "ms", provider: "seed", model: "seed", timestamp: "", fields: [
    { key: "summary", text: "Alat automasi yang bisa dipakai gratis.", policy: "translate" }, // Indonesian markers
    { key: "section0", text: "Connect your apps and run on a schedule.", policy: "translate" }, // English leakage + placeholder lost + protected name lost
  ]};
  out.seeded_ms_issues = translationQa({ summary: source.summary, section0: source.section0 }, badMs);

  const badVi: TranslateResult = { contentId: "t1", targetLocale: "vi", provider: "seed", model: "seed", timestamp: "", fields: [
    { key: "summary", text: "Cong cu tu dong hoa cho cac nhom lam viec khong can lap trinh", policy: "translate" }, // stripped diacritics
  ]};
  out.seeded_vi_issues = translationQa({ summary: source.summary }, badVi);

  const badTh: TranslateResult = { contentId: "t1", targetLocale: "th", provider: "seed", model: "seed", timestamp: "", fields: [
    { key: "summary", text: "A no-code automation tool for teams and more content here now", policy: "translate" }, // no Thai script
  ]};
  out.seeded_th_issues = translationQa({ summary: source.summary }, badTh);

  // --- 3) Deletion policy ---
  const p = await payloadClient();
  const srcs = (await p.find({ collection: "sources", where: { sourceUrl: { exists: true } }, limit: 5000, depth: 0 })).docs as any[];
  const urls = srcs.map((s) => s.sourceUrl).filter(Boolean);
  if (urls.length >= 2) {
    // (a) one missing → transition to source_missing
    const oneMissing = urls.slice(1);
    out.deletion_one_missing = await reconcileRemovals(oneMissing);
    // reappear → back to active (restore)
    out.deletion_restore = await reconcileRemovals(urls);
    // (b) all missing → mass-deletion guard aborts
    out.deletion_mass_guard = await reconcileRemovals([]);
  } else {
    out.deletion = "insufficient real sources with sourceUrl (run /pilot/ingest-real first)";
  }

  // summary
  const count = (a: any[]) => a.length;
  out.summary = {
    mock_qa_clean: out.mock_qa_issues.length === 0,
    ms_contamination_caught: out.seeded_ms_issues.some((i: any) => i.check === "ms_indonesian_contamination"),
    ms_protected_or_placeholder_caught: out.seeded_ms_issues.some((i: any) => i.check === "protected_name_lost" || i.check === "placeholder_mismatch"),
    vi_diacritics_caught: out.seeded_vi_issues.some((i: any) => i.check === "vi_low_diacritics"),
    th_script_caught: out.seeded_th_issues.some((i: any) => i.check === "th_no_thai_script"),
    deletion_transition_ok: out.deletion_one_missing?.action === "applied" && count(out.deletion_one_missing?.transitioned ?? []) >= 1,
    deletion_mass_guard_ok: out.deletion_mass_guard?.action === "aborted-mass-deletion-guard",
  };
  return Response.json(out);
}
