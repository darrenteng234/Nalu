import { notFound } from "next/navigation";
import "../../globals.css";
import { LOCALES, isLocale, getLocale } from "@/lib/i18n/locales";
import { SiteHeader, SiteFooter } from "@/components/site/Chrome";
import { t } from "@/lib/i18n/ui";

export function generateStaticParams() {
  return LOCALES.map((l) => ({ locale: l.code }));
}

// Content is DB-backed → render on demand (build stays decoupled from the DB).
// At scale this becomes ISR with on-publish revalidation (see Phase 2 report).
export const dynamic = "force-dynamic";
// Slugs are dynamic (content is added by the pipeline) → render on demand;
// unknown locales are rejected in the layout via isLocale() → notFound().

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const def = getLocale(locale)!;
  return (
    <html lang={locale} dir={def.dir} className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={{ background: "var(--background)", color: "var(--text-primary)" }}>
        <a href="#main" style={{ position: "absolute", left: "-9999px" }}>{t(locale, "skip")}</a>
        <SiteHeader locale={locale} />
        <main id="main" style={{ flex: 1, display: "flex", flexDirection: "column" }}>{children}</main>
        <SiteFooter locale={locale} />
      </body>
    </html>
  );
}
