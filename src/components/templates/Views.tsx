import Link from "next/link";
import type { ResolvedEntity } from "@/lib/content/queries";
import { entityPath, hubPath, TYPE_SEGMENT } from "@/lib/content/segments";
import { t } from "@/lib/i18n/ui";
import type { ContentType } from "@/lib/content/constants";

export function Container({ children, narrow = false }: { children: React.ReactNode; narrow?: boolean }) {
  return <div style={{ maxWidth: narrow ? "760px" : "1120px", margin: "0 auto", padding: "0 1.5rem", width: "100%" }}>{children}</div>;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--brand-primary)", background: "color-mix(in srgb, var(--brand-primary) 12%, transparent)", padding: "3px 9px", borderRadius: "999px" }}>
      {children}
    </span>
  );
}

export function EntityCard({ entity }: { entity: ResolvedEntity }) {
  return (
    <Link
      href={entityPath(entity.locale, entity.type, entity.slug)}
      style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "1.1rem", border: "1px solid var(--border)", borderRadius: "var(--card-radius)", background: "var(--card-bg)", textDecoration: "none", color: "inherit", boxShadow: "var(--card-shadow)" }}
    >
      <span style={{ alignSelf: "flex-start" }}><Chip>{entity.type.replace(/_/g, " ")}</Chip></span>
      <h3 style={{ fontSize: "1.05rem", fontWeight: 600, lineHeight: 1.25, margin: 0 }}>{entity.title}</h3>
      {entity.summary ? <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)" }}>{entity.summary}</p> : null}
    </Link>
  );
}

export function CardGrid({ entities }: { entities: ResolvedEntity[] }) {
  return (
    <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
      {entities.map((e) => <EntityCard key={`${e.type}:${e.contentId}`} entity={e} />)}
    </div>
  );
}

export function RelatedList({ locale, title, entities }: { locale: string; title?: string; entities: ResolvedEntity[] }) {
  if (!entities.length) return null;
  return (
    <section style={{ marginTop: "2.5rem" }}>
      <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>{title ?? t(locale, "related")}</h2>
      <CardGrid entities={entities} />
    </section>
  );
}

/** The main entity template. Type-agnostic base + structured sections + FAQ. */
export function EntityView({ entity, related }: { entity: ResolvedEntity; related?: React.ReactNode }) {
  const s = entity.source;
  return (
    <article>
      <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
        <span><Chip>{entity.type.replace(/_/g, " ")}</Chip></span>
        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "0.75rem 0 0", textWrap: "balance" }}>{entity.title}</h1>
        {entity.summary ? <p style={{ marginTop: "0.9rem", fontSize: "1.15rem", color: "var(--text-secondary)", maxWidth: "60ch" }}>{entity.summary}</p> : null}
        <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
          {s.difficulty ? <span>{s.difficulty}</span> : null}
          {s.datePublished ? <span>{new Date(s.datePublished).toLocaleDateString(entity.locale)}</span> : null}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: "68ch" }}>
        {(entity.sections ?? []).map((sec) => (
          <section key={sec.id}>
            {sec.heading ? <h2 style={{ fontSize: "1.35rem", fontWeight: 600, marginBottom: "0.6rem" }}>{sec.heading}</h2> : null}
            {sec.body ? <p style={{ margin: 0, lineHeight: 1.7 }}>{sec.body}</p> : null}
            {sec.items?.length ? (
              <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.2rem", lineHeight: 1.7 }}>
                {sec.items.map((it, i) => <li key={i}>{it}</li>)}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      {entity.faq?.length ? (
        <section style={{ marginTop: "2.5rem", maxWidth: "68ch" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 600, marginBottom: "1rem" }}>{t(entity.locale, "faq")}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {entity.faq.map((f) => (
              <details key={f.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "0.75rem 1rem", background: "var(--surface)" }}>
                <summary style={{ fontWeight: 600, cursor: "pointer" }}>{f.q}</summary>
                <p style={{ marginTop: "0.5rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {related}
    </article>
  );
}

export function HubView({ locale, type, entities }: { locale: string; type: ContentType; entities: ResolvedEntity[] }) {
  const seg = TYPE_SEGMENT[type];
  const label = { tutorials: t(locale, "nav_tutorials"), tools: t(locale, "nav_tools"), prompts: t(locale, "nav_prompts"), collections: t(locale, "nav_collections") }[seg] ?? seg;
  return (
    <div style={{ padding: "2.5rem 0" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "1.25rem" }}>{label}</h1>
      {entities.length ? <CardGrid entities={entities} /> : <p style={{ color: "var(--text-secondary)" }}>Nothing published in this language yet.</p>}
    </div>
  );
}

export function HomeView({ locale, featured }: { locale: string; featured: ResolvedEntity[] }) {
  return (
    <div>
      <section style={{ padding: "4rem 0 2rem" }}>
        <span style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--brand-primary)" }}>NALU</span>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.12, margin: "0.75rem 0 0", maxWidth: "18ch", textWrap: "balance" }}>
          {t(locale, "home_intro")}
        </h1>
        <p style={{ marginTop: "1rem", color: "var(--text-secondary)", maxWidth: "56ch", fontSize: "1.1rem" }}>
          Brand identity is pending; this is the reusable platform running on the pilot dataset.
        </p>
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link href={hubPath(locale, "tutorials")} style={{ padding: "var(--button-padding-y) var(--button-padding-x)", borderRadius: "var(--button-radius)", background: "var(--brand-primary)", color: "var(--brand-on)", textDecoration: "none", fontWeight: 500 }}>{t(locale, "nav_tutorials")}</Link>
          <Link href={hubPath(locale, "tools")} style={{ padding: "var(--button-padding-y) var(--button-padding-x)", borderRadius: "var(--button-radius)", border: "1px solid var(--border-strong)", color: "var(--text-primary)", textDecoration: "none", fontWeight: 500 }}>{t(locale, "nav_tools")}</Link>
        </div>
      </section>
      {featured.length ? (
        <section style={{ paddingBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>{t(locale, "related")}</h2>
          <CardGrid entities={featured} />
        </section>
      ) : null}
    </div>
  );
}
