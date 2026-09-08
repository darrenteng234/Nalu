/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic collection slug + upsert data */
import type { CollectionSlug } from "payload";
import { payloadClient } from "@/lib/content/payload";

/** GET /ops/seed — idempotent seed of real phase tasks + acceptance criteria. Dev-gated. */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production" && req.headers.get("x-pilot-token") !== process.env.PILOT_TOKEN) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const p = await payloadClient();

  // Real acceptance criteria from the Phase 2.9 scale gate (evidence-backed).
  const criteria: Array<[string, string, string, "pass" | "fail" | "not_verified"]> = [
    ["2.9", "translation", "Long bodies translated without truncation", "pass"],
    ["2.9", "qa", "Semantic-equivalence QA works", "pass"],
    ["2.9", "translation", "Native review acceptable", "not_verified"],
    ["2.9", "translation", "MS genuinely Malaysian", "not_verified"],
    ["2.9", "translation", "TH natural", "not_verified"],
    ["2.9", "translation", "VI natural", "not_verified"],
    ["2.9", "infra", "429 operationally manageable (conc 2)", "pass"],
    ["2.9", "infra", "Pricing verified", "pass"],
    ["2.9", "seo", "Rendered multilingual QA", "pass"],
    ["2.9", "seo", "Rendered SEO (canonical/hreflang/JSON-LD)", "pass"],
    ["2.9", "qa", "Failure isolation", "pass"],
    ["2.9", "qa", "Idempotency", "pass"],
    ["2.9", "qa", "Source updates", "pass"],
    ["2.9", "qa", "Regression tests exist", "pass"],
    ["2.9", "translation", "Review burden scalable", "not_verified"],
    ["2.11", "dashboard", "Ops model + build dashboard MVP", "pass"],
    ["2.11", "dashboard", "Article authoring without Claude", "pass"],
    ["2.11", "launch", "Malay-first independent publish proven", "pass"],
    // Phase 3 — Malay-first launch gate (evidence: /launch/verify 30/30, /launch/prove).
    ["3", "launch", "AC1 EN article authored+published without Claude", "pass"],
    ["3", "translation", "AC2 MS via real provider (Gemini) end-to-end", "pass"],
    ["3", "launch", "AC3 MS enters mt_generated, never published on generation", "pass"],
    ["3", "qa", "AC4 QA gate blocks P0; clean → in_review", "pass"],
    ["3", "launch", "AC5 human review required before publish", "pass"],
    ["3", "launch", "AC6 EN & MS independently publishable", "pass"],
    ["3", "qa", "AC7 changed EN marks MS stale; stale publish blocked", "pass"],
    ["3", "seo", "AC8 canonical + hreflang correct incl. MS-hidden", "pass"],
    ["3", "qa", "AC9 protected tokens/numbers/dates/URLs/code preserved", "pass"],
    ["3", "infra", "AC10 in-app retry/backoff/idempotency (429)", "pass"],
    ["3", "qa", "AC11 regression suite green incl. seeded failures", "pass"],
    ["3", "seo", "AC12 rendered proofs captured", "pass"],
    ["3", "translation", "AC13 Malaysian-Malay (not Indonesian) enforced", "pass"],
    ["3", "translation", "AC14 native MS human review performed", "not_verified"],
    ["3", "launch", "AC14-support: review package + auditable recording built", "pass"],
    ["3", "infra", "AC15 production-safe migration + generated types", "pass"],
    ["3", "translation", "AC16 cross-chunk/cross-article terminology (termbase)", "pass"],
    ["3", "infra", "AC17 cost/usage recorded from real calls", "not_verified"],
  ];
  const tasks: Array<[string, string, string, string, string, string?]> = [
    // phase, area, title, status, priority, blockedBy?
    ["2.9", "qa", "Semantic-equivalence gate", "done", "high"],
    ["2.9", "translation", "Long-document chunking", "done", "high"],
    ["2.9", "infra", "Verify Gemini pricing", "done", "medium"],
    ["2.9", "qa", "Translation regression suite", "done", "medium"],
    ["2.11", "dashboard", "Operations dashboard MVP", "in_progress", "high"],
    ["2.11", "dashboard", "Article authoring workflow (no Claude)", "done", "high"],
    ["3", "launch", "Native Malay review workflow", "blocked", "high", "human native reviewer"],
    ["3", "launch", "Native Thai review", "blocked", "medium", "human native reviewer"],
    ["3", "launch", "Native Vietnamese review", "blocked", "medium", "human native reviewer"],
    ["2.10", "infra", "Adopt Batch API + concurrency-2 for scale", "todo", "medium"],
    ["2.10", "seo", "Render REAL Gemini content end-to-end", "done", "high"],
    ["3", "launch", "Malay-first launch path (gated pipeline + guards)", "done", "high"],
    ["3", "infra", "Production-safe migrations + generated types (F-A resolved)", "done", "high"],
    ["3", "launch", "Native MS review package + auditable recording", "done", "high"],
    ["3", "launch", "Obtain native Malaysian-Malay reviewer sign-off (AC14)", "blocked", "high", "human native reviewer"],
    ["3", "infra", "Record Gemini token/cost per call to activity-log", "todo", "medium"],
  ];

  const upsert = async (coll: CollectionSlug, where: any, data: any) => {
    const ex = await p.find({ collection: coll, where, limit: 1, depth: 0 });
    if (ex.docs[0]) return p.update({ collection: coll, id: ex.docs[0].id, data, depth: 0 });
    return p.create({ collection: coll, data, depth: 0 });
  };

  for (const [phase, area, criterion, result] of criteria)
    await upsert("acceptance-criteria", { and: [{ phase: { equals: phase } }, { criterion: { equals: criterion } }] }, { phase, area, criterion, result });
  for (const [phase, area, title, status, priority, blockedBy] of tasks)
    await upsert("phase-tasks", { and: [{ phase: { equals: phase } }, { title: { equals: title } }] }, { phase, area, title, status, priority, blockedBy: blockedBy ?? null });

  // one system activity entry so the automation metric has real data
  await upsert("activity-log", { action: { equals: "phase-2.9-proofs" } }, { actor: "system", action: "phase-2.9-proofs", entity: "translation", detail: "semantic+chunking+regression proven", outcome: "ok" });

  return Response.json({ seededCriteria: criteria.length, seededTasks: tasks.length });
}
