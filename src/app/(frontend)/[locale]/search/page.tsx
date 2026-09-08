import { Container, CardGrid } from "@/components/templates/Views";
import { search } from "@/lib/content/queries";
import { t } from "@/lib/i18n/ui";

type P = { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ params }: P) {
  const { locale } = await params;
  return { title: t(locale, "search_title"), robots: { index: false, follow: true } };
}

export default async function SearchPage({ params, searchParams }: P) {
  const { locale } = await params;
  const { q = "" } = await searchParams;
  const results = q ? await search(locale, q) : [];
  return (
    <Container>
      <div style={{ padding: "2.5rem 0" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1.25rem" }}>{t(locale, "search_title")}</h1>
        <form action={`/${locale}/search`} method="get" style={{ marginBottom: "1.75rem" }}>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={t(locale, "search_placeholder")}
            aria-label={t(locale, "search_title")}
            style={{ width: "100%", maxWidth: "480px", padding: "0.7rem 1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-primary)", fontSize: "1rem" }}
          />
        </form>
        {q && results.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>{t(locale, "search_empty")}</p>
        ) : (
          <CardGrid entities={results} />
        )}
      </div>
    </Container>
  );
}
