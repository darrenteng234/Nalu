/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GET /studio/seed-user — DEV ONLY. Creates a first local admin for testing the
 * founder flow when none exists. Not a real account; local dev credentials only.
 * No-op if a user already exists. Never available in production.
 */
import { payloadClient } from "@/lib/content/payload";

export async function GET() {
  if (process.env.NODE_ENV === "production") return Response.json({ error: "forbidden" }, { status: 403 });
  const p = await payloadClient();
  const existing = await p.find({ collection: "users", limit: 1, depth: 0 });
  if (existing.docs[0]) return Response.json({ created: false, note: "user already exists" });
  await p.create({ collection: "users", data: { email: "founder@nalu.local", password: "nalu-dev-1234" } as any });
  return Response.json({ created: true, email: "founder@nalu.local" });
}
