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
  const label = ({
    tutorials: t(locale, "nav_tutorials"), tools: t(locale, "nav_tools"), prompts: t(locale, "nav_prompts"),
    collections: t(locale, "nav_collections"), solutions: t(locale, "nav_solutions"),
    "teach-ai": t(locale, "nav_teach_ai"), workflows: t(locale, "nav_workflows"),
  } as Record<string, string>)[seg] ?? seg;
  return (
    <div style={{ padding: "2.5rem 0" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "1.25rem" }}>{label}</h1>
      {entities.length ? <CardGrid entities={entities} /> : <p style={{ color: "var(--text-secondary)" }}>Nothing published in this language yet.</p>}
    </div>
  );
}

function SectionHead({ title, sub, cta }: { title: string; sub?: string; cta?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
      <div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>{title}</h2>
        {sub ? <p style={{ margin: "0.35rem 0 0", color: "var(--text-secondary)" }}>{sub}</p> : null}
      </div>
      {cta}
    </div>
  );
}
function Pill({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} style={{ padding: "0.5rem 0.9rem", borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", textDecoration: "none", fontSize: "0.9rem" }}>{children}</Link>;
}
function CtaLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} style={{ color: "var(--brand-primary)", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>{children} →</Link>;
}

/**
 * Homepage (Phase 5 §16). Job-first intent finder, NOT a directory or a ChatGPT
 * clone. The hero is a plain GET form to /search (an intent finder), followed by
 * the product layers. Editorial style, neutral tokens (§21).
 */
export function HomeView({ locale, prompts = [], workflows = [], tools = [] }: {
  locale: string; prompts?: ResolvedEntity[]; workflows?: ResolvedEntity[]; tools?: ResolvedEntity[];
}) {
  const q = (s: string) => `/${locale}/search?q=${encodeURIComponent(s)}`;
  const examples = [t(locale, "ex_email"), t(locale, "ex_present"), t(locale, "ex_research"), t(locale, "ex_analyze")];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem", paddingBottom: "3rem" }}>
      {/* HERO — intent finder */}
      <section style={{ padding: "3.5rem 0 0.5rem" }}>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, margin: 0, maxWidth: "16ch", textWrap: "balance" }}>{t(locale, "hero_title")}</h1>
        <p style={{ marginTop: "0.9rem", color: "var(--text-secondary)", fontSize: "1.15rem" }}>{t(locale, "hero_sub")}</p>
        <form action={`/${locale}/search`} method="get" role="search" style={{ marginTop: "1.1rem", display: "flex", gap: "0.5rem", maxWidth: 620, flexWrap: "wrap" }}>
          <input name="q" placeholder={t(locale, "hero_placeholder")} aria-label={t(locale, "hero_sub")} style={{ flex: "1 1 320px", minHeight: 48, padding: "0 1rem", borderRadius: 12, border: "1px solid var(--border-strong, var(--border))", background: "var(--background)", color: "var(--text-primary)", fontSize: "1rem" }} />
          <button type="submit" style={{ minHeight: 48, padding: "0 1.3rem", borderRadius: 12, background: "var(--brand-primary)", color: "var(--brand-on,#fff)", border: "none", fontWeight: 700, cursor: "pointer" }}>{t(locale, "hero_go")}</button>
        </form>
        <div style={{ marginTop: "0.9rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {examples.map((e) => <Pill key={e} href={q(e)}>{e}</Pill>)}
        </div>
      </section>

      {/* PROMPTS */}
      <section>
        <SectionHead title={t(locale, "sec_prompts_title")} sub={t(locale, "sec_prompts_sub")} cta={<CtaLink href={hubPath(locale, "prompts")}>{t(locale, "sec_prompts_cta")}</CtaLink>} />
        {prompts.length ? <CardGrid entities={prompts} /> : (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {[t(locale, "ex_email"), t(locale, "ex_present"), t(locale, "ex_research")].map((e) => <Pill key={e} href={q(e)}>{e}</Pill>)}
          </div>
        )}
      </section>

      {/* TEACH AI — signature concept */}
      <section>
        <SectionHead title={t(locale, "sec_teach_title")} sub={t(locale, "sec_teach_sub")} cta={<CtaLink href={hubPath(locale, "teach-ai")}>{t(locale, "sec_teach_cta")}</CtaLink>} />
        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          {[["email style", "Teach AI your email style"], ["brand voice", "Teach AI your brand voice"], ["proposal style", "Teach AI your proposal style"], ["how you communicate", "Teach AI how you communicate"]].map(([k, label]) => (
            <Link key={k} href={q(`teach ai ${k}`)} style={{ border: "1px solid var(--border)", borderRadius: "var(--card-radius,12px)", padding: "1rem 1.1rem", textDecoration: "none", color: "inherit", background: "var(--card-bg,var(--surface))", fontWeight: 600 }}>{label} →</Link>
          ))}
        </div>
      </section>

      {/* WORKFLOWS */}
      {workflows.length ? (
        <section>
          <SectionHead title={t(locale, "sec_workflows_title")} sub={t(locale, "sec_workflows_sub")} cta={<CtaLink href={hubPath(locale, "workflows")}>{t(locale, "sec_workflows_cta")}</CtaLink>} />
          <CardGrid entities={workflows} />
        </section>
      ) : null}

      {/* TOOLS — small curated set */}
      {tools.length ? (
        <section>
          <SectionHead title={t(locale, "sec_tools_title")} sub={t(locale, "sec_tools_sub")} cta={<CtaLink href={hubPath(locale, "tools")}>{t(locale, "sec_tools_cta")}</CtaLink>} />
          <CardGrid entities={tools} />
        </section>
      ) : null}

      {/* FREE RESOURCE — utility → resource → email (§23) */}
      <section style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "1.5rem 1.6rem", background: "var(--surface)" }}>
        <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700 }}>{t(locale, "resource_title")}</h2>
        <p style={{ margin: "0.4rem 0 1rem", color: "var(--text-secondary)" }}>{t(locale, "resource_sub")}</p>
        <Link href={`/${locale}/resources`} style={{ display: "inline-block", padding: "0.65rem 1.3rem", borderRadius: 999, background: "var(--brand-primary)", color: "var(--brand-on,#fff)", textDecoration: "none", fontWeight: 700 }}>{t(locale, "resource_cta")}</Link>
      </section>
    </div>
  );
}
