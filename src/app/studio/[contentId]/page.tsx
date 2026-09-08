/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import Link from "next/link";
import { payloadClient } from "@/lib/content/payload";
import { requireUser, checkArticle, attachTools, publishArticle, translateToMs, approvePublishMs } from "@/lib/studio/actions";
import type { Finding } from "@/lib/quality/analyze";

export const dynamic = "force-dynamic";

// ---- server action wrappers (redirect back to the editor) --------------------
async function doPublish(fd: FormData) { "use server"; const cid = String(fd.get("contentId")); await publishArticle(cid, String(fd.get("locale") || "en")); redirect(`/studio/${cid}`); }
async function doTranslate(fd: FormData) { "use server"; const cid = String(fd.get("contentId")); await translateToMs(cid); redirect(`/studio/${cid}`); }
async function doApproveMs(fd: FormData) { "use server"; const cid = String(fd.get("contentId")); await approvePublishMs(cid); redirect(`/studio/${cid}`); }
async function doAttach(fd: FormData) {
  "use server";
  const cid = String(fd.get("contentId")); const locale = String(fd.get("locale") || "en");
  const slugs = fd.getAll("tool").map(String);
  const tools = slugs.map((s) => ({ toolSlug: s, why: String(fd.get(`why_${s}`) || ""), cta: String(fd.get(`cta_${s}`) || "Try it") }));
  await attachTools(cid, locale, tools);
  redirect(`/studio/${cid}`);
}

const sev: Record<string, string> = { block: "var(--error)", warn: "var(--warning,#b45309)", info: "var(--text-secondary)" };
const card: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 10, padding: "1rem 1.15rem", background: "var(--surface)", marginBottom: "1rem" };
const h2: React.CSSProperties = { fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.6rem" };

export default async function Editor({ params }: { params: Promise<{ contentId: string }> }) {
  try { await requireUser(); } catch { redirect("/admin/login"); }
  const { contentId } = await params;
  const p = await payloadClient();

  const vr = await p.find({ collection: "variants", where: { contentId: { equals: contentId } }, limit: 5, depth: 0 });
  const variants = vr.docs as any[];
  const en = variants.find((v) => v.locale === "en");
  const ms = variants.find((v) => v.locale === "ms");
  const primary = en ?? variants[0];
  if (!primary) redirect("/studio");

  const report = await checkArticle(primary.contentId, primary.locale);
  const toolsRes = await p.find({ collection: "tools", where: { active: { equals: true } }, limit: 50, depth: 0 });
  const tools = toolsRes.docs as any[];
  const attached = new Set((primary.commerce?.recommendedTools ?? []).map((r: any) => r.toolSlug));

  const byCat = (report.findings as Finding[]).reduce((m, f) => { (m[f.category] ??= []).push(f); return m; }, {} as Record<string, Finding[]>);
  const pubUrl = `/${primary.locale}/articles/${primary.slug}`;

  return (
    <div>
      <Link href="/studio" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.85rem" }}>← All articles</Link>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.5rem 0 0.25rem" }}>{primary.title}</h1>
      <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1rem" }}>
        EN: <strong>{en?.status ?? "—"}</strong>{ms ? <> · MS: <strong>{ms.status}</strong></> : null}
      </div>

      {/* prepared technical details (plain language) */}
      <div style={card}>
        <div style={h2}>Prepared for you</div>
        <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)", display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.35rem 1rem" }}>
          <span>Web address</span><code>{pubUrl}</code>
          <span>Search title</span><span>{primary.seo?.title}</span>
          <span>Search description</span><span>{primary.seo?.description}</span>
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>Canonical, hreflang, Open Graph, breadcrumbs and structured data are handled automatically.</p>
      </div>

      {/* quality checks */}
      <div style={card}>
        <div style={h2}>Checks {report.publishable ? "· ✅ ready to publish" : `· ⛔ ${report.counts.block} must fix`}</div>
        {(["STRUCTURE", "CONTENT", "SEO", "AI_ANSWER", "COMMERCIAL"] as const).map((cat) => (
          byCat[cat]?.length ? (
            <div key={cat} style={{ marginBottom: "0.6rem" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-secondary)" }}>{cat.replace("_", " ")}</div>
              {byCat[cat].map((f, i) => (
                <div key={i} style={{ fontSize: "0.85rem", color: sev[f.severity], marginTop: "0.2rem" }}>
                  {f.severity === "block" ? "⛔" : f.severity === "warn" ? "⚠️" : "•"} {f.detail}
                </div>
              ))}
            </div>
          ) : null
        ))}
        <div style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>Commercial: <strong>{report.commercialState.replace(/_/g, " ").toLowerCase()}</strong></div>
      </div>

      {/* commercial recommendations */}
      <div style={card}>
        <div style={h2}>Commercial recommendation</div>
        {tools.length === 0 ? <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>No tools in the database yet.</p> : (
          <form action={doAttach}>
            <input type="hidden" name="contentId" value={primary.contentId} />
            <input type="hidden" name="locale" value={primary.locale} />
            {tools.map((tl) => (
              <div key={tl.slug} style={{ display: "grid", gridTemplateColumns: "auto 1fr 130px", gap: "0.5rem", alignItems: "center", padding: "0.4rem 0", borderTop: "1px solid var(--border)" }}>
                <label style={{ display: "flex", gap: "0.4rem", alignItems: "center", fontSize: "0.9rem" }}>
                  <input type="checkbox" name="tool" value={tl.slug} defaultChecked={attached.has(tl.slug)} /> {tl.name}
                </label>
                <input name={`why_${tl.slug}`} placeholder="Why recommend it" defaultValue={(primary.commerce?.recommendedTools ?? []).find((r: any) => r.toolSlug === tl.slug)?.why || ""} style={{ padding: "0.35rem 0.5rem", border: "1px solid var(--border)", borderRadius: 6, background: "var(--background)", color: "var(--text-primary)", fontSize: "0.82rem" }} />
                <select name={`cta_${tl.slug}`} defaultValue={(primary.commerce?.recommendedTools ?? []).find((r: any) => r.toolSlug === tl.slug)?.cta || "Try it"} style={{ padding: "0.35rem", border: "1px solid var(--border)", borderRadius: 6, background: "var(--background)", color: "var(--text-primary)", fontSize: "0.82rem" }}>
                  <option>Try it</option><option>See pricing</option><option>Start free</option><option>Compare options</option>
                </select>
              </div>
            ))}
            <button type="submit" style={{ marginTop: "0.75rem", padding: "0.45rem 1rem", borderRadius: 8, border: "1px solid var(--border-strong,var(--border))", background: "var(--background)", color: "var(--text-primary)", fontWeight: 600, cursor: "pointer" }}>Save recommendations</button>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.4rem" }}>Only recommend tools that genuinely fit. Affiliate links are disclosed on the page and tracked via /go.</p>
          </form>
        )}
      </div>

      {/* actions */}
      <div style={{ ...card, display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <Link href={`/studio/${primary.contentId}/preview?l=${primary.locale}`} style={{ padding: "0.55rem 1.1rem", borderRadius: 999, border: "1px solid var(--border-strong,var(--border))", color: "var(--text-primary)", textDecoration: "none", fontWeight: 600 }}>Preview</Link>
        {primary.status === "published"
          ? <Link href={pubUrl} style={{ padding: "0.55rem 1.1rem", borderRadius: 999, background: "var(--success)", color: "#fff", textDecoration: "none", fontWeight: 700 }}>View live page ↗</Link>
          : (
            <form action={doPublish}>
              <input type="hidden" name="contentId" value={primary.contentId} />
              <input type="hidden" name="locale" value={primary.locale} />
              <button type="submit" disabled={!report.publishable} style={{ padding: "0.55rem 1.4rem", borderRadius: 999, background: report.publishable ? "var(--brand-primary)" : "var(--border)", color: "var(--brand-on,#fff)", border: "none", fontWeight: 700, cursor: report.publishable ? "pointer" : "not-allowed" }}>Publish {primary.locale.toUpperCase()}</button>
            </form>
          )}

        {/* Malay-first: translate + review */}
        {primary.locale === "en" && !ms && (
          <form action={doTranslate}><input type="hidden" name="contentId" value={primary.contentId} /><button type="submit" style={{ padding: "0.55rem 1.1rem", borderRadius: 999, border: "1px solid var(--border-strong,var(--border))", background: "var(--background)", color: "var(--text-primary)", fontWeight: 600, cursor: "pointer" }}>Translate to Malay</button></form>
        )}
        {ms && ms.status !== "published" && (
          <form action={doApproveMs}><input type="hidden" name="contentId" value={primary.contentId} /><button type="submit" style={{ padding: "0.55rem 1.1rem", borderRadius: 999, background: "var(--brand-primary)", color: "var(--brand-on,#fff)", border: "none", fontWeight: 700, cursor: "pointer" }}>Approve & publish Malay</button></form>
        )}
      </div>
      {ms && <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Malay status: <strong>{ms.status}</strong>{ms.status !== "published" ? " — not public until you approve & publish it." : ` — live at /ms/articles/${ms.slug}`}</p>}
    </div>
  );
}
