/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Payload docs (F-A) */
import "../globals.css";
import { payloadClient } from "@/lib/content/payload";
import { LOCALE_CODES } from "@/lib/i18n/locales";

export const dynamic = "force-dynamic";
export const metadata = { title: "NALU Ops — Build Status" };

const S = {
  page: { background: "var(--background)", color: "var(--text-primary)", minHeight: "100vh", padding: "2rem 1.5rem", fontFamily: "var(--font-sans)" } as any,
  wrap: { maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" } as any,
  card: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.25rem 1.5rem" } as any,
  h2: { fontSize: "var(--fs-lg)", fontWeight: "var(--fw-semibold)", margin: "0 0 .75rem" } as any,
  bar: { height: 12, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden" } as any,
  fill: (pct: number) => ({ height: "100%", width: `${pct}%`, background: "var(--brand-primary)" }) as any,
  row: { display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", padding: ".35rem 0", borderBottom: "1px solid var(--border)", fontSize: "var(--fs-sm)" } as any,
  mono: { fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" } as any,
  pill: (bg: string, fg: string) => ({ background: bg, color: fg, borderRadius: 999, padding: "2px 10px", fontSize: ".72rem", fontWeight: 600 }) as any,
};
const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 1000) / 10);
const statusPill = (s: string) => {
  const m: Record<string, [string, string]> = { done: ["color-mix(in srgb,var(--success) 20%,transparent)", "var(--success)"], in_progress: ["color-mix(in srgb,var(--brand-primary) 16%,transparent)", "var(--brand-primary)"], blocked: ["color-mix(in srgb,var(--error) 18%,transparent)", "var(--error)"], todo: ["var(--surface-2)", "var(--text-secondary)"] };
  const [bg, fg] = m[s] ?? m.todo; return S.pill(bg, fg);
};

export default async function OpsDashboard() {
  let crit: any[] = [], tasks: any[] = [], variants: any[] = [], sources: any[] = [], acts: any[] = [];
  try {
    const p = await payloadClient();
    [crit, tasks, variants, sources, acts] = await Promise.all([
      p.find({ collection: "acceptance-criteria", limit: 500, depth: 0 }).then((r: any) => r.docs),
      p.find({ collection: "phase-tasks", limit: 500, depth: 0 }).then((r: any) => r.docs),
      p.find({ collection: "variants", limit: 5000, depth: 0 }).then((r: any) => r.docs),
      p.find({ collection: "sources", limit: 5000, depth: 0 }).then((r: any) => r.docs),
      p.find({ collection: "activity-log", limit: 500, depth: 0 }).then((r: any) => r.docs).catch(() => []),
    ]);
  } catch {
    return <main style={S.page}><div style={S.wrap}><h1>NALU Ops</h1><p style={{ color: "var(--text-secondary)" }}>Database unavailable. Start dev + run <code>/ops/seed</code>.</p></div></main>;
  }

  const passed = crit.filter((c) => c.result === "pass").length;
  const overall = pct(passed, crit.length);
  const phases = [...new Set(crit.map((c) => c.phase))].sort();
  const areas = [...new Set(crit.map((c) => c.area).filter(Boolean))].sort();

  const active = tasks.filter((t) => t.status !== "done");
  const prioRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const today = [...active].filter((t) => t.status !== "blocked").sort((a, b) => (prioRank[a.priority] ?? 1) - (prioRank[b.priority] ?? 1));
  const blockers = tasks.filter((t) => t.status === "blocked");
  const next = today.find((t) => t.status === "in_progress") ?? today[0];

  // translation status per contentId × locale (from variants)
  const byContent: Record<string, Record<string, string>> = {};
  for (const v of variants) { (byContent[v.contentId] ??= {})[v.locale] = v.status; }
  const localeCounts: Record<string, Record<string, number>> = {};
  for (const loc of LOCALE_CODES) localeCounts[loc] = {};
  for (const v of variants) { const l = localeCounts[v.locale] ??= {}; l[v.status] = (l[v.status] ?? 0) + 1; }

  const automated = acts.filter((a) => a.actor === "system" && a.outcome === "ok").length;
  const manual = acts.filter((a) => String(a.actor).startsWith("editor:")).length;

  return (
    <main style={S.page}><div style={S.wrap}>
      <div>
        <div style={{ fontSize: ".8rem", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--brand-primary)", fontWeight: 600 }}>NALU · Build Mode</div>
        <h1 style={{ fontSize: "var(--fs-2xl)", fontWeight: "var(--fw-bold)", margin: ".25rem 0 0" }}>Build Status</h1>
      </div>

      {/* overall + per-phase progress from acceptance criteria */}
      <div style={S.card}>
        <div style={S.h2}>Overall progress — {passed}/{crit.length} criteria ({overall}%)</div>
        <div style={S.bar}><div style={S.fill(overall)} /></div>
        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: ".5rem" }}>
          {phases.map((ph) => { const cs = crit.filter((c) => c.phase === ph); const pp = pct(cs.filter((c) => c.result === "pass").length, cs.length); return (
            <div key={ph}><div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-sm)" }}><span>Phase {ph}</span><span style={S.mono}>{cs.filter((c) => c.result === "pass").length}/{cs.length} · {pp}%</span></div><div style={S.bar}><div style={S.fill(pp)} /></div></div>
          ); })}
        </div>
        <div style={{ marginTop: "1rem", display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
          {areas.map((ar) => { const cs = crit.filter((c) => c.area === ar); return <span key={ar} style={S.pill("var(--surface-2)", "var(--text-secondary)")}>{ar} {pct(cs.filter((c) => c.result === "pass").length, cs.length)}%</span>; })}
        </div>
      </div>

      {/* TODAY */}
      <div style={S.card}>
        <div style={S.h2}>Today ({today.length})</div>
        {today.length === 0 ? <p style={S.mono}>Nothing active.</p> : today.map((t) => (
          <div key={t.id} style={S.row}><span>{t.priority === "high" ? "🔴" : t.priority === "medium" ? "🟡" : "⚪"} {t.title} <span style={S.mono}>· {t.phase}</span></span><span style={statusPill(t.status)}>{t.status}</span></div>
        ))}
      </div>

      {/* BLOCKERS + NEXT */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div style={S.card}><div style={S.h2}>Blockers ({blockers.length})</div>{blockers.length === 0 ? <p style={S.mono}>None.</p> : blockers.map((b) => <div key={b.id} style={S.row}><span>{b.title}</span><span style={S.mono}>{b.blockedBy ?? ""}</span></div>)}</div>
        <div style={S.card}><div style={S.h2}>Next</div>{next ? <p>→ <strong>{next.title}</strong> <span style={S.mono}>({next.phase})</span></p> : <p style={S.mono}>—</p>}</div>
      </div>

      {/* translation status (LIVE-mode seed) */}
      <div style={S.card}>
        <div style={S.h2}>Translation status — published variants per locale</div>
        {LOCALE_CODES.map((loc) => (
          <div key={loc} style={S.row}><span style={{ textTransform: "uppercase", fontWeight: 600 }}>{loc}</span><span style={S.mono}>{Object.entries(localeCounts[loc] ?? {}).map(([s, n]) => `${s}:${n}`).join("  ") || "none"}</span></div>
        ))}
        <p style={{ ...S.mono, marginTop: ".5rem" }}>{sources.length} sources · {Object.keys(byContent).length} content items. Malay-first: EN + MS publish independently of TH/VI.</p>
      </div>

      {/* automation metric */}
      <div style={S.card}>
        <div style={S.h2}>Manual work saved (from activity log)</div>
        <div style={{ display: "flex", gap: "2rem" }}>
          <div><div style={{ fontSize: "var(--fs-2xl)", fontWeight: "var(--fw-bold)", color: "var(--success)" }}>{automated}</div><div style={S.mono}>automated (system·ok)</div></div>
          <div><div style={{ fontSize: "var(--fs-2xl)", fontWeight: "var(--fw-bold)" }}>{manual}</div><div style={S.mono}>manual (editor)</div></div>
        </div>
        <p style={{ ...S.mono, marginTop: ".5rem" }}>Real job/review records only — no vanity numbers. Populates as pipeline + review actions run.</p>
      </div>
    </div></main>
  );
}
