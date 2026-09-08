import { runQa } from "@/lib/qa";

/** GET /pilot/qa — run automated QA over the pilot dataset. Dev-gated. */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production" && req.headers.get("x-pilot-token") !== process.env.PILOT_TOKEN) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const report = await runQa();
  const status = report.summary.p0 === 0 && report.summary.p1 === 0 ? 200 : 422;
  return Response.json(report, { status });
}
