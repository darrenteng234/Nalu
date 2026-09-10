import { Container, CardGrid } from "@/components/templates/Views";
import { search, type ResolvedEntity } from "@/lib/content/queries";
import { t } from "@/lib/i18n/ui";

type P = { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ params }: P) {
  const { locale } = await params;
  return { title: t(locale, "search_title"), robots: { index: false, follow: true } };
}

/**
 * Intent-oriented search (Phase 5 §17). Instead of a flat "17 articles" dump,
 * results are grouped so the page reads as a decision engine:
 * Recommended (solutions) → Prompts → Teach AI → Workflows → Tools → More.
 */
export default async function SearchPage({ params, searchParams }: P) {
  const { locale } = await params;
  const { q = "" } = await searchParams;
  const results = q ? await search(locale, q, 60) : [];

  const pick = (types: ResolvedEntity["type"][]) => results.filter((r) => types.includes(r.type));
  const groups: Array<{ key: string; label: string; items: ResolvedEntity[] }> = [
    { key: "solution", label: "Recommended", items: pick(["solution"]) },
    { key: "prompt", label: t(locale, "nav_prompts"), items: pick(["prompt_page"]) },
    { key: "teach", label: t(locale, "nav_teach_ai"), items: pick(["teach_ai"]) },
    { key: "workflow", label: t(locale, "nav_workflows"), items: pick(["workflow"]) },
    { key: "tool", label: t(locale, "nav_tools"), items: pick(["tool", "compare_tools", "free_tool"]) },
  ];
  const covered = new Set(groups.flatMap((g) => g.items.map((i) => i.contentId)));
  const more = results.filter((r) => !covered.has(r.contentId));
  if (more.length) groups.push({ key: "more", label: t(locale, "nav_tutorials"), items: more });
  const nonEmpty = groups.filter((g) => g.items.length);

  return (
    <Container>
      <div style={{ padding: "2.5rem 0" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1.25rem" }}>{t(locale, "search_title")}</h1>
        <form action={`/${locale}/search`} method="get" role="search" style={{ marginBottom: "1.75rem" }}>
          <input
            type="search" name="q" defaultValue={q}
            placeholder={t(locale, "search_placeholder")} aria-label={t(locale, "search_title")}
            style={{ width: "100%", maxWidth: "560px", padding: "0.7rem 1rem", borderRadius: "var(--radius-sm,10px)", border: "1px solid var(--border-strong,var(--border))", background: "var(--surface)", color: "var(--text-primary)", fontSize: "1rem" }}
          />
        </form>
        {q && results.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>{t(locale, "search_empty")}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {nonEmpty.map((g) => (
              <section key={g.key}>
                <h2 style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: g.key === "solution" ? "var(--brand-primary)" : "var(--text-secondary)", marginBottom: "0.75rem" }}>{g.label}</h2>
                <CardGrid entities={g.items} />
              </section>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
