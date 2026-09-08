/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GET /launch/prove?action=... — Phase 3 rendered-proof driver (Step 5). Sets up
 * a real EN article, generates its MS variant through the REAL provider + QA gate,
 * and drives the state machine so each §13 case can be rendered in the browser:
 *
 *   setup       create/refresh EN article (published) + generate MS (mt_generated|in_review)
 *   approve     approved → published (only legal path; hook-guarded)
 *   touch-en    bump EN sourceVersion + mark MS stale; then show publish is blocked
 *   seed-bad    write a deliberately bad MS (Indonesian + untranslated) → QA blocks
 *   try-publish attempt to publish MS directly (expected to THROW unless approved+fresh)
 *   status      report current EN/MS states + URLs
 *   reset       remove the demo content
 *
 * Dev-gated. Uses getTranslator() → real Gemini when GEMINI_API_KEY is set.
 */
import { payloadClient } from "@/lib/content/payload";
import { generateMsVariant } from "@/lib/launch/translate-article";
import { MockTranslator, type Translator } from "@/lib/translate/translator";
import { approveVariant, publishVariant, unpublishVariant, markStaleForSource } from "@/lib/launch/transitions";
import { entityPath } from "@/lib/content/segments";

const CID = "phase3-ms-demo";
const SLUG = "phase3-malay-first-demo";

const EN = {
  title: "Write Better AI Prompts: A Beginner Tutorial",
  summary: "Learn how to write a good prompt step-by-step. This free tutorial takes about 10 minutes and covers 3 core techniques used by over 5000 teams.",
  sections: [
    { id: "s1", heading: "Why prompts matter", body: "A prompt is the instruction you give an AI tool like ChatGPT. A clear prompt can improve your results by 40 percent. Start with a specific goal, then add context." },
    { id: "s2", heading: "Three techniques", body: "First, give the model a role. Second, show one example. Third, ask for a specific format. These 3 steps work for most tasks and take under 5 minutes to apply." },
  ],
  faq: [{ id: "f1", q: "Is this tutorial free?", a: "Yes, this tutorial is completely free to read." }],
};

/**
 * Deterministic QA-CLEAN Malay fixture for THIS demo article (native phrasing,
 * numbers + ChatGPT preserved, termbase terms used). Lets the post-fix happy path
 * (in_review → approved → published) render without spending real Gemini quota.
 * NOT a real translator — a labelled proof fixture, used only via ?mock=good.
 */
const GOOD_MS: Record<string, string> = {
  title: "Menulis Gesaan AI yang Lebih Baik: Tutorial untuk Pemula",
  summary: "Belajar cara menulis gesaan yang baik langkah demi langkah. Tutorial percuma ini mengambil masa kira-kira 10 minit dan merangkumi 3 teknik teras yang digunakan oleh lebih 5000 pasukan.",
  seoTitle: "Menulis Gesaan AI yang Lebih Baik untuk Pemula",
  seoDescription: "Belajar menulis gesaan AI langkah demi langkah dalam tutorial percuma ini.",
  sec0_heading: "Mengapa gesaan penting",
  sec0_body: "Gesaan ialah arahan yang anda berikan kepada alat AI seperti ChatGPT. Gesaan yang jelas boleh meningkatkan hasil anda sebanyak 40 peratus. Mulakan dengan matlamat khusus, kemudian tambah konteks.",
  sec1_heading: "Tiga teknik",
  sec1_body: "Pertama, berikan model satu peranan. Kedua, tunjukkan satu contoh. Ketiga, minta format tertentu. 3 langkah ini berkesan untuk kebanyakan tugas dan mengambil masa kurang 5 minit.",
  faq_q0: "Adakah tutorial ini percuma?",
  faq_a0: "Ya, tutorial ini percuma sepenuhnya untuk dibaca.",
};
const GoodMsFixtureTranslator: Translator = {
  provider: "fixture", model: "phase3-ms-demo",
  async translate(req) {
    return { contentId: req.contentId, targetLocale: req.targetLocale, provider: this.provider, model: this.model, timestamp: new Date().toISOString(),
      fields: req.fields.map((f) => (f.policy === "protect" || f.policy === "skip" ? { ...f } : { key: f.key, text: GOOD_MS[f.key] ?? f.text, policy: f.policy })) };
  },
  async translateBatch(reqs) { return Promise.all(reqs.map((r) => this.translate(r))); },
  async validate() { return { ok: true, detail: "demo fixture" }; },
};

async function findVariant(p: any, locale: string) {
  const r = await p.find({ collection: "variants", where: { and: [{ contentId: { equals: CID } }, { locale: { equals: locale } }] }, limit: 1, depth: 0 });
  return r.docs[0];
}
async function upsertVariant(p: any, locale: string, data: any) {
  const ex = await findVariant(p, locale);
  return ex ? p.update({ collection: "variants", id: ex.id, data, depth: 0 }) : p.create({ collection: "variants", data, depth: 0 });
}

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production" && req.headers.get("x-pilot-token") !== process.env.PILOT_TOKEN) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const action = new URL(req.url).searchParams.get("action") ?? "status";
  const p = await payloadClient();

  const statusReport = async () => {
    const en = await findVariant(p, "en");
    const ms = await findVariant(p, "ms");
    const srcR = await p.find({ collection: "sources", where: { contentId: { equals: CID } }, limit: 1, depth: 0 });
    const src = srcR.docs[0];
    return {
      contentId: CID,
      sourceVersion: (src as any)?.sourceVersion ?? null,
      en: en ? { status: en.status, url: entityPath("en", "article", en.slug) } : null,
      ms: ms ? { status: ms.status, url: entityPath("ms", "article", ms.slug), stale: ms.translation?.stale ?? false, translatedFromSourceVersion: ms.translation?.translatedFromSourceVersion } : null,
      note: "public reads serve status=published only; hreflang cluster = published locales only.",
    };
  };

  try {
    if (action === "setup") {
      // EN source (published, source of truth)
      const srcEx = await p.find({ collection: "sources", where: { contentId: { equals: CID } }, limit: 1, depth: 0 });
      const srcData = { contentId: CID, type: "article", sourceVersion: 1, fieldHashes: { en: "v1" }, ingestStatus: "structured", datePublished: new Date().toISOString() };
      if (srcEx.docs[0]) await p.update({ collection: "sources", id: srcEx.docs[0].id, data: srcData as any, depth: 0 });
      else await p.create({ collection: "sources", data: srcData as any, depth: 0 });

      await upsertVariant(p, "en", {
        contentId: CID, locale: "en", type: "article", status: "published", publishedAt: new Date().toISOString(),
        title: EN.title, slug: SLUG, summary: EN.summary, sections: EN.sections, faq: EN.faq,
        seo: { title: EN.title, description: "Learn to write better AI prompts step by step in this free beginner tutorial.", noindex: false },
      });

      // ?mock=1 injects the deterministic MockTranslator (state-machine proofs
      // without spending real quota); default uses the real provider (Gemini).
      const mock = new URL(req.url).searchParams.get("mock");
      const override = mock === "good" ? GoodMsFixtureTranslator : mock === "1" ? MockTranslator : undefined;
      const gen = await generateMsVariant(CID, "ms", undefined, override);
      return Response.json({ action, provider: override?.provider ?? "real", generated: gen, state: await statusReport() });
    }

    if (action === "approve") {
      const ms = await findVariant(p, "ms");
      if (!ms) return Response.json({ error: "no MS variant; run setup" }, { status: 400 });
      await approveVariant(ms.id, undefined, "phase-3 proof: human approval");
      await publishVariant(ms.id);
      return Response.json({ action, state: await statusReport() });
    }

    if (action === "touch-en") {
      const srcR = await p.find({ collection: "sources", where: { contentId: { equals: CID } }, limit: 1, depth: 0 });
      const src = srcR.docs[0] as any;
      if (!src) return Response.json({ error: "no source; run setup" }, { status: 400 });
      await p.update({ collection: "sources", id: src.id, data: { sourceVersion: (src.sourceVersion ?? 1) + 1, fieldHashes: { en: "v2" } } as any, depth: 0 });
      const staled = await markStaleForSource(CID);
      // The stale MS stays published (users keep a page) but is flagged; to prove
      // a stale translation can never be RE-published as fresh, unpublish it and
      // attempt to republish — the hook must reject it until retranslation.
      let republish = "n/a";
      const ms = await findVariant(p, "ms");
      if (ms) {
        await unpublishVariant(ms.id, "approved");
        try { await publishVariant(ms.id); republish = "NOT blocked (defect!)"; }
        catch (e) { republish = `blocked: ${String(e).slice(0, 160)}`; }
      }
      return Response.json({ action, staledVariants: staled, staleRepublishAttempt: republish, state: await statusReport() });
    }

    if (action === "seed-bad") {
      // deliberately bad MS: Indonesian contamination + body identical to EN → QA must block
      await upsertVariant(p, "ms", {
        contentId: CID, locale: "ms", type: "article", status: "mt_generated",
        title: EN.title, slug: SLUG, summary: EN.summary, /* identical → untranslated */
        sections: [{ id: "s1", heading: "gratis", body: "This is free to unduh sekarang" }],
        seo: { title: EN.title, description: EN.summary, noindex: false },
        translation: { translatedFromSourceVersion: 1, translationVersion: 1, stale: false },
      });
      let publishBlocked = "n/a";
      const ms = await findVariant(p, "ms");
      try { await publishVariant(ms.id); publishBlocked = "NOT blocked (defect!)"; } catch (e) { publishBlocked = `blocked: ${String(e).slice(0, 140)}`; }
      return Response.json({ action, publishAttempt: publishBlocked, note: "MS at mt_generated; direct publish rejected by hook", state: await statusReport() });
    }

    if (action === "try-publish") {
      const ms = await findVariant(p, "ms");
      if (!ms) return Response.json({ error: "no MS variant; run setup" }, { status: 400 });
      try { await publishVariant(ms.id); return Response.json({ action, result: "published (was approved+fresh)", state: await statusReport() }); }
      catch (e) { return Response.json({ action, result: `REJECTED: ${String(e).slice(0, 200)}`, state: await statusReport() }, { status: 200 }); }
    }

    if (action === "reset") {
      for (const loc of ["en", "ms"]) { const v = await findVariant(p, loc); if (v) await p.delete({ collection: "variants", id: v.id }); }
      const srcR = await p.find({ collection: "sources", where: { contentId: { equals: CID } }, limit: 1, depth: 0 });
      if (srcR.docs[0]) await p.delete({ collection: "sources", id: srcR.docs[0].id });
      return Response.json({ action, reset: true });
    }

    return Response.json({ action: "status", state: await statusReport() });
  } catch (e) {
    return Response.json({ action, error: String(e) }, { status: 500 });
  }
}
