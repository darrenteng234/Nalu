import Link from "next/link";
import { LOCALES } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/ui";
import { hubPath } from "@/lib/content/segments";

/** Locale switcher: links to the same entity's sibling per locale, else locale home. */
export function LanguageSwitcher({ locale, cluster }: { locale: string; cluster?: Record<string, string> }) {
  return (
    <nav aria-label="Language" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      {LOCALES.map((l) => {
        const href = cluster?.[l.code] ?? `/${l.code}`;
        const active = l.code === locale;
        return (
          <Link
            key={l.code}
            href={href}
            aria-current={active ? "true" : undefined}
            hrefLang={l.code}
            style={{
              fontSize: "0.8rem",
              fontWeight: active ? 700 : 500,
              color: active ? "var(--text-primary)" : "var(--text-secondary)",
              textDecoration: "none",
            }}
          >
            {l.code.toUpperCase()}
          </Link>
        );
      })}
    </nav>
  );
}

export function SiteHeader({ locale, cluster }: { locale: string; cluster?: Record<string, string> }) {
  const items = [
    { seg: "tutorials", label: t(locale, "nav_tutorials") },
    { seg: "tools", label: t(locale, "nav_tools") },
    { seg: "prompts", label: t(locale, "nav_prompts") },
    { seg: "collections", label: t(locale, "nav_collections") },
  ];
  return (
    <header
      style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "color-mix(in srgb, var(--background) 90%, transparent)",
        backdropFilter: "blur(8px)", borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", gap: "1.25rem", height: "60px" }}>
        <Link href={`/${locale}`} style={{ fontWeight: 800, letterSpacing: "-0.03em", fontSize: "1.1rem", color: "var(--text-primary)", textDecoration: "none" }}>
          {/* Wordmark placeholder — brand UNSET */}
          NALU
        </Link>
        <nav aria-label="Primary" style={{ display: "flex", gap: "1.1rem", flexWrap: "wrap" }} className="nalu-nav">
          {items.map((it) => (
            <Link key={it.seg} href={hubPath(locale, it.seg)} style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none" }}>
              {it.label}
            </Link>
          ))}
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href={`/${locale}/search`} style={{ fontSize: "0.9rem", color: "var(--text-secondary)", textDecoration: "none" }}>
            {t(locale, "nav_search")}
          </Link>
          <LanguageSwitcher locale={locale} cluster={cluster} />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ locale }: { locale: string }) {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", marginTop: "auto" }}>
      <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "2rem 1.5rem", color: "var(--text-secondary)", fontSize: "0.85rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>NALU</span>
        <span>· multilingual technology knowledge · brand identity pending</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: "0.75rem" }}>
          <Link href={hubPath(locale, "tools")} style={{ color: "inherit" }}>{t(locale, "nav_tools")}</Link>
          <Link href={hubPath(locale, "tutorials")} style={{ color: "inherit" }}>{t(locale, "nav_tutorials")}</Link>
          <Link href={hubPath(locale, "prompts")} style={{ color: "inherit" }}>{t(locale, "nav_prompts")}</Link>
        </span>
      </div>
    </footer>
  );
}
