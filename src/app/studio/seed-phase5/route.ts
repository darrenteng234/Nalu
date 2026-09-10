/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GET /studio/seed-phase5 — DEV ONLY. Seeds one of each new job-first type
 * (prompt_page, teach_ai, workflow) as published EN content so the Phase 5
 * templates can be verified in the browser. Idempotent by contentId. Not for
 * production content — real content is authored in Studio / the AI pipeline.
 */
import { payloadClient } from "@/lib/content/payload";

const now = new Date().toISOString();

async function upsert(p: any, contentId: string, type: string, source: any, variant: any) {
  const sx = await p.find({ collection: "sources", where: { contentId: { equals: contentId } }, limit: 1, depth: 0 });
  const sData = { contentId, type, sourceVersion: 1, ingestStatus: "structured", datePublished: now, dateModified: now, ...source };
  if (sx.docs[0]) await p.update({ collection: "sources", id: sx.docs[0].id, data: sData, depth: 0 });
  else await p.create({ collection: "sources", data: sData, depth: 0 });
  const vx = await p.find({ collection: "variants", where: { and: [{ contentId: { equals: contentId } }, { locale: { equals: "en" } }] }, limit: 1, depth: 0 });
  const vData = { contentId, locale: "en", type, status: "published", publishedAt: now, ...variant };
  if (vx.docs[0]) await p.update({ collection: "variants", id: vx.docs[0].id, data: vData, depth: 0 });
  else await p.create({ collection: "variants", data: vData, depth: 0 });
}

export async function GET() {
  if (process.env.NODE_ENV === "production") return Response.json({ error: "forbidden" }, { status: 403 });
  const p = await payloadClient();

  // 1. PROMPT
  await upsert(p, "p5_prompt_email", "prompt_page",
    { neutralData: {
      whatThisDoes: "Drafts a clear, professional email to a client from a few notes.",
      bestFor: "Freelancers, SME owners, account managers",
      worksWith: ["ChatGPT", "Claude", "Gemini"],
      beforeYouStart: "Have the client's name, the purpose of the email, and any key points or dates ready.",
      promptText: "You are helping me write a professional email to a client.\n\nContext:\n- Client: [name/company]\n- Purpose: [what this email is about]\n- Key points: [bullet points]\n- Tone: warm, clear, professional\n\nWrite the email. Keep it under 150 words, use short paragraphs, and end with one clear next step. Give me 2 subject line options.",
      whyThisWorks: "It gives the model a role, the context it needs, a length constraint, and a desired outcome — the four things that turn a vague request into a usable draft.",
      makeItYours: { label: "Teach AI to write like you", href: "/en/teach-ai/teach-ai-to-write-like-you" },
    } },
    { title: "Write an email to a client", slug: "write-a-client-email",
      summary: "Turn a few notes into a clear, professional client email — with subject lines.",
      seo: { title: "Write a client email with AI", description: "A ready-to-use prompt that drafts a professional client email from a few notes.", noindex: false } });

  // 2. TEACH AI
  await upsert(p, "p5_teach_write", "teach_ai",
    { neutralData: {} },
    { title: "Teach AI to write like you", slug: "teach-ai-to-write-like-you",
      summary: "Teach AI your writing style once, then reuse it for every task. This is a reusable method, not a single prompt.",
      seo: { title: "Teach AI to write like you", description: "A reusable method: let AI study your examples, interview you, and build a style profile you can reuse.", noindex: false },
      sections: [
        { id: "s1", heading: "Give AI real examples", body: "Paste 3–5 pieces of your own writing.", items: ["PROMPT: Here are examples of my writing. Study them and note the patterns in tone, sentence length, and vocabulary. Do not summarize the content yet."] },
        { id: "s2", heading: "Let AI interview you", body: "Instead of guessing, let it ask.", items: ["PROMPT: Interview me with 5 questions to understand how I like to write emails. Ask one question at a time."] },
        { id: "s3", heading: "Build your style profile", body: "Turn the answers into something reusable.", items: ["PROMPT: Based on my examples and answers, write a short reusable 'style profile' I can paste into future chats so you write like me."] },
        { id: "s4", heading: "Write using your style", body: "Reuse the profile for any task.", items: ["PROMPT: Using my style profile above, write [the task]."] },
        { id: "s5", heading: "Check it sounds like you", body: "Correct mistakes so it improves.", items: ["PROMPT: Does this sound like me based on my style profile? Point out anything off and rewrite those parts."] },
      ] });

  // 3. WORKFLOW
  await upsert(p, "p5_workflow_meeting", "workflow",
    { neutralData: { outcome: "A ready-to-send client follow-up email built from your meeting.", flow: ["RECORD", "TRANSCRIBE", "EXTRACT", "REVIEW", "WRITE", "SEND"] } },
    { title: "Turn a meeting into a client follow-up", slug: "meeting-to-client-follow-up",
      summary: "A practical workflow: from a recorded meeting to a clear follow-up email your client will actually read.",
      seo: { title: "Turn a meeting into a client follow-up", description: "Step-by-step workflow to convert a meeting recording into a client follow-up email.", noindex: false },
      sections: [
        { id: "w1", heading: "Record the meeting", body: "Record with the client's consent using your meeting tool." },
        { id: "w2", heading: "Transcribe", body: "Generate a transcript from the recording." },
        { id: "w3", heading: "Extract the key points", items: ["PROMPT: From this transcript, list the decisions made, action items with owners, and any dates mentioned."] },
        { id: "w4", heading: "Review", body: "Check the extracted points for accuracy before writing." },
        { id: "w5", heading: "Write the follow-up", items: ["PROMPT: Write a short follow-up email summarizing the decisions and action items above. Warm, clear, under 150 words, with one next step."] },
        { id: "w6", heading: "Send", body: "Review once more, then send." },
      ] });

  return Response.json({ seeded: ["write-a-client-email", "teach-ai-to-write-like-you", "meeting-to-client-follow-up"] });
}
