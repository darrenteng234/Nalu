import { runPipeline } from "@/lib/pipeline";

/** POST /pilot/run — execute the controlled pilot pipeline. Dev-gated. */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production" && req.headers.get("x-pilot-token") !== process.env.PILOT_TOKEN) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const log = await runPipeline();
  return Response.json(log);
}
export const GET = POST; // convenience for manual dev trigger
