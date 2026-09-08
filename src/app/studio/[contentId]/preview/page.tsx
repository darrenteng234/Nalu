import { redirect } from "next/navigation";
import { requireUser } from "@/lib/studio/actions";
import { resolveForPreview, getToolsBySlugs } from "@/lib/content/queries";
import { Container, EntityView } from "@/components/templates/Views";

export const dynamic = "force-dynamic";
export const metadata = { title: "Preview — NALU Studio", robots: { index: false, follow: false } };

/** Founder preview using the REAL article template (any status). Never public. */
export default async function Preview({ params, searchParams }: { params: Promise<{ contentId: string }>; searchParams: Promise<{ l?: string }> }) {
  try { await requireUser(); } catch { redirect("/admin/login"); }
  const { contentId } = await params;
  const { l } = await searchParams;
  const locale = l || "en";
  const entity = await resolveForPreview(contentId, locale);
  if (!entity) redirect(`/studio/${contentId}`);

  const recs = entity!.commerce?.recommendedTools ?? [];
  const tools = recs.length ? await getToolsBySlugs(recs.map((r) => r.toolSlug)) : [];
  const bySlug = new Map(tools.map((t) => [t.slug, t]));
  const cta = recs.map((r) => ({ ...r, tool: bySlug.get(r.toolSlug) })).filter((r) => r.tool);

  return (
    <div style={{ background: "var(--background)" }}>
      <div style={{ background: "var(--warning,#b45309)", color: "#fff", textAlign: "center", padding: "0.4rem", fontSize: "0.8rem", fontWeight: 600 }}>
        PREVIEW · {locale.toUpperCase()} · {entity!.slug} · not public
      </div>
      <Container narrow>
        <div style={{ padding: "2rem 0" }}>
          <EntityView entity={entity!} />
          {cta.length ? (
            <section style={{ marginTop: "2.5rem", maxWidth: "68ch", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary)" }}>
                {cta.some((c) => c.tool!.disclosureRequired) ? "Recommended tools · contains affiliate links" : "Recommended tools"}
              </div>
              {cta.map((c) => (
                <div key={c.toolSlug} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "1rem", background: "var(--surface)" }}>
                  <strong>{c.tool!.name}</strong>
                  {c.why ? <p style={{ margin: "0.35rem 0 0.6rem", color: "var(--text-secondary)" }}>{c.why}</p> : null}
                  <span style={{ display: "inline-block", padding: "0.4rem 0.9rem", borderRadius: 999, background: "var(--brand-primary)", color: "var(--brand-on,#fff)", fontWeight: 600, fontSize: "0.85rem" }}>{c.cta || "Try it"} →</span>
                </div>
              ))}
            </section>
          ) : null}
        </div>
      </Container>
    </div>
  );
}
