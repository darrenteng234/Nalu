/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import Link from "next/link";
import { payloadClient } from "@/lib/content/payload";
import { requireUser } from "@/lib/studio/actions";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  draft: "Draft", mt_generated: "Malay — needs review", in_review: "In review", approved: "Approved", published: "Published", archived: "Archived",
};
const statusColor: Record<string, string> = {
  published: "var(--success)", draft: "var(--text-secondary)", in_review: "var(--brand-primary)", mt_generated: "var(--warning, #b45309)", approved: "var(--brand-primary)",
};

export default async function StudioList() {
  try { await requireUser(); } catch { redirect("/admin/login?redirect=/studio"); }
  const p = await payloadClient();
  const vr = await p.find({ collection: "variants", where: { type: { in: ["article", "tool", "compare_tools", "tutorial"] } }, limit: 200, depth: 0, sort: "-updatedAt" });

  const byContent = new Map<string, any[]>();
  for (const v of vr.docs as any[]) { const a = byContent.get(v.contentId) ?? []; a.push(v); byContent.set(v.contentId, a); }

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Your articles</h1>
      {byContent.size === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>No articles yet. Click <strong>+ New article</strong> to paste your first one.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {[...byContent.entries()].map(([cid, vs]) => {
            const en = vs.find((v) => v.locale === "en") ?? vs[0];
            return (
              <Link key={cid} href={`/studio/${cid}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", border: "1px solid var(--border)", borderRadius: 10, padding: "0.85rem 1.1rem", textDecoration: "none", color: "inherit", background: "var(--surface)" }}>
                <span style={{ fontWeight: 600 }}>{en.title}</span>
                <span style={{ display: "flex", gap: "0.5rem", fontSize: "0.78rem" }}>
                  {vs.map((v) => (
                    <span key={v.locale} style={{ color: statusColor[v.status] ?? "var(--text-secondary)", fontWeight: 600 }}>
                      {v.locale.toUpperCase()}: {statusLabel[v.status] ?? v.status}
                    </span>
                  ))}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
