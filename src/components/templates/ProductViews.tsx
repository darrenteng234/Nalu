import Link from "next/link";
import type { ResolvedEntity } from "@/lib/content/queries";
import { t } from "@/lib/i18n/ui";
import { CopyButton } from "@/components/site/CopyButton";

/**
 * Job-first product templates (Phase 5 §8/§9/§11). All read the existing
 * Source+Variant fields — sections[]/summary/faq plus optional structured hints in
 * source.neutralData — and degrade gracefully when a field is absent. Editorial
 * tone (§21): clean type, strong hierarchy, whitespace; no AI decoration.
 *
 * Authoring conventions (all optional):
 *  - prompt_page.neutralData: { whatThisDoes, bestFor, worksWith[], beforeYouStart,
 *      promptText, whyThisWorks, makeItYours:{label,href} }
 *  - teach_ai / workflow: sections[] are the steps; a section item beginning
 *      "PROMPT:" renders as a copyable prompt. workflow.neutralData.flow[] draws
 *      the visual step sequence.
 */
type ND = Record<string, unknown>;
const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === "string") as string[] : []);

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", margin: "1.75rem 0 0.5rem" }}>{children}</h2>
);
const Lead = ({ entity }: { entity: ResolvedEntity }) => (
  <header style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.25rem" }}>
    <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--brand-primary)" }}>{entity.type.replace(/_/g, " ")}</span>
    <h1 style={{ fontSize: "clamp(1.7rem,4vw,2.4rem)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "0.5rem 0 0", textWrap: "balance" }}>{entity.title}</h1>
    {entity.summary ? <p style={{ marginTop: "0.75rem", fontSize: "1.1rem", color: "var(--text-secondary)", maxWidth: "62ch", lineHeight: 1.6 }}>{entity.summary}</p> : null}
  </header>
);

/** §8 Prompt page */
export function PromptView({ entity }: { entity: ResolvedEntity }) {
  const nd = (entity.source.neutralData ?? {}) as ND;
  const promptText = str(nd.promptText) ?? entity.sections?.find((s) => /prompt/i.test(s.heading ?? ""))?.body ?? entity.sections?.[0]?.body ?? "";
  const worksWith = arr(nd.worksWith);
  const mine = nd.makeItYours as { label?: string; href?: string } | undefined;
  return (
    <article>
      <Lead entity={entity} />
      {str(nd.whatThisDoes) ? (<><H>{t(entity.locale, "what_this_does")}</H><p style={{ lineHeight: 1.7, margin: 0 }}>{str(nd.whatThisDoes)}</p></>) : null}
      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        {str(nd.bestFor) ? (<div><H>{t(entity.locale, "best_for")}</H><p style={{ margin: 0 }}>{str(nd.bestFor)}</p></div>) : null}
        {worksWith.length ? (<div><H>{t(entity.locale, "works_with")}</H><p style={{ margin: 0 }}>{worksWith.join(" · ")}</p></div>) : null}
      </div>
      {str(nd.beforeYouStart) ? (<><H>{t(entity.locale, "before_you_start")}</H><p style={{ lineHeight: 1.7, margin: 0 }}>{str(nd.beforeYouStart)}</p></>) : null}

      {promptText ? (
        <section style={{ marginTop: "1.75rem" }}>
          <H>{t(entity.locale, "the_prompt")}</H>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.1rem 1.2rem", fontSize: "0.95rem", lineHeight: 1.6, fontFamily: "var(--font-mono, ui-monospace, monospace)", margin: "0 0 1rem" }}>{promptText}</pre>
          <CopyButton text={promptText} label={t(entity.locale, "copy_prompt")} copiedLabel={t(entity.locale, "copied")} />
        </section>
      ) : null}

      {str(nd.whyThisWorks) ? (<><H>{t(entity.locale, "why_this_works")}</H><p style={{ lineHeight: 1.7, margin: 0, maxWidth: "64ch" }}>{str(nd.whyThisWorks)}</p></>) : null}
      {mine?.href ? (
        <section style={{ marginTop: "1.75rem", padding: "1rem 1.2rem", border: "1px dashed var(--border)", borderRadius: 12 }}>
          <H>{t(entity.locale, "make_it_yours")}</H>
          <Link href={mine.href} style={{ color: "var(--brand-primary)", fontWeight: 600, textDecoration: "none" }}>{mine.label || t(entity.locale, "nav_teach_ai")} →</Link>
        </section>
      ) : null}
    </article>
  );
}

/** Split a step body into prose + an optional copyable PROMPT: block. */
function stepPrompt(items?: string[]): { prompt?: string; rest: string[] } {
  const rest: string[] = []; let prompt: string | undefined;
  for (const it of items ?? []) { const m = it.match(/^PROMPT:\s*([\s\S]+)/i); if (m) prompt = m[1].trim(); else rest.push(it); }
  return { prompt, rest };
}

/** §9 Teach AI — a reusable multi-step method (not one prompt). */
export function TeachAIView({ entity }: { entity: ResolvedEntity }) {
  const steps = entity.sections ?? [];
  return (
    <article>
      <Lead entity={entity} />
      <ol style={{ listStyle: "none", counterReset: "step", padding: 0, margin: "1.5rem 0 0", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {steps.map((s, i) => {
          const { prompt, rest } = stepPrompt(s.items);
          return (
            <li key={s.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "1rem 1.2rem", background: "var(--surface)" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem" }}>
                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, color: "var(--brand-primary)" }}>{i + 1}</span>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>{s.heading}</h3>
              </div>
              {s.body ? <p style={{ margin: "0.5rem 0 0", lineHeight: 1.7 }}>{s.body}</p> : null}
              {rest.length ? <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.2rem", lineHeight: 1.7 }}>{rest.map((it, j) => <li key={j}>{it}</li>)}</ul> : null}
              {prompt ? (
                <div style={{ marginTop: "0.75rem" }}>
                  <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "var(--background)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.8rem 1rem", fontSize: "0.9rem", lineHeight: 1.55, margin: "0 0 0.6rem" }}>{prompt}</pre>
                  <CopyButton text={prompt} label={t(entity.locale, "copy_prompt")} copiedLabel={t(entity.locale, "copied")} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </article>
  );
}

/** §11 Workflow / recipe — visual sequence + per-step detail. */
export function WorkflowView({ entity }: { entity: ResolvedEntity }) {
  const nd = (entity.source.neutralData ?? {}) as ND;
  const flow = arr(nd.flow).length ? arr(nd.flow) : (entity.sections ?? []).map((s) => (s.heading ?? "").toUpperCase()).filter(Boolean);
  const steps = entity.sections ?? [];
  return (
    <article>
      <Lead entity={entity} />
      {str(nd.outcome) ? (<><H>{t(entity.locale, "outcome")}</H><p style={{ lineHeight: 1.7, margin: 0 }}>{str(nd.outcome)}</p></>) : null}
      {flow.length ? (
        <><H>{t(entity.locale, "steps")}</H>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {flow.map((f, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.04em", background: "var(--surface-2, var(--surface))", border: "1px solid var(--border)", borderRadius: 999, padding: "0.3rem 0.7rem" }}>{f}</span>
              {i < flow.length - 1 ? <span aria-hidden style={{ color: "var(--text-secondary)" }}>→</span> : null}
            </span>
          ))}
        </div></>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.5rem" }}>
        {steps.map((s, i) => {
          const { prompt, rest } = stepPrompt(s.items);
          return (
            <section key={s.id} style={{ borderLeft: "3px solid var(--brand-primary)", paddingLeft: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600 }}>{i + 1}. {s.heading}</h3>
              {s.body ? <p style={{ margin: "0.4rem 0 0", lineHeight: 1.7 }}>{s.body}</p> : null}
              {rest.length ? <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.2rem", lineHeight: 1.7 }}>{rest.map((it, j) => <li key={j}>{it}</li>)}</ul> : null}
              {prompt ? (
                <div style={{ marginTop: "0.6rem" }}>
                  <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.8rem 1rem", fontSize: "0.9rem", lineHeight: 1.55, margin: "0 0 0.6rem" }}>{prompt}</pre>
                  <CopyButton text={prompt} label={t(entity.locale, "copy_prompt")} copiedLabel={t(entity.locale, "copied")} />
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </article>
  );
}
