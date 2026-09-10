import Link from "next/link";
import { LOCALES } from "@/lib/i18n/locales";
import { LAUNCH_LOCALES } from "@/lib/launch/config";
import { t } from "@/lib/i18n/ui";
import { hubPath } from "@/lib/content/segments";

/**
 * Locale switcher: links to the same entity's sibling per locale, else locale home.
 * Shows only the ACTIVE launch locales (EN | BM, §16) — TH/VI stay in the
 * architecture (locales.ts) but are not surfaced in nav until they launch.
 */
export function LanguageSwitcher({ locale, cluster }: { locale: string; cluster?: Record<string, string> }) {
  const shown = LOCALES.filter((l) => (LAUNCH_LOCALES as string[]).includes(l.code));
  return (
    <nav aria-label="Language" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      {shown.map((l) => {
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
  // Phase 5 IA: the job-first product layers (clean, not overloaded — §16).
  const items = [
    { seg: "prompts", label: t(locale, "nav_prompts") },
    { seg: "teach-ai", label: t(locale, "nav_teach_ai") },
    { seg: "workflows", label: t(locale, "nav_workflows") },
    { seg: "tools", label: t(locale, "nav_tools") },
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
  const explore: Array<[string, string]> = [
    ["prompts", t(locale, "nav_prompts")], ["teach-ai", t(locale, "nav_teach_ai")],
    ["workflows", t(locale, "nav_workflows")], ["tools", t(locale, "nav_tools")], ["tutorials", t(locale, "f_guides")],
  ];
  const linkStyle = { color: "inherit", textDecoration: "none" } as const;
  return (
    <footer style={{ borderTop: "1px solid var(--border)", marginTop: "auto" }}>
      <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "2.5rem 1.5rem", color: "var(--text-secondary)", fontSize: "0.85rem", display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        <div style={{ minWidth: 160 }}>
          <div style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "1.05rem", letterSpacing: "-0.02em" }}>NALU</div>
          <p style={{ margin: "0.5rem 0 0", maxWidth: "22ch" }}>{t(locale, "home_intro")}</p>
        </div>
        <nav aria-label="Explore" style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <strong style={{ color: "var(--text-primary)" }}>{t(locale, "f_explore")}</strong>
          {explore.map(([seg, label]) => <Link key={seg} href={hubPath(locale, seg)} style={linkStyle}>{label}</Link>)}
        </nav>
        <nav aria-label="Company" style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <strong style={{ color: "var(--text-primary)" }}>NALU</strong>
          <Link href={`/${locale}/about`} style={linkStyle}>{t(locale, "f_about")}</Link>
          <Link href={`/${locale}/methodology`} style={linkStyle}>{t(locale, "f_methodology")}</Link>
          <Link href={`/${locale}/contact`} style={linkStyle}>{t(locale, "f_contact")}</Link>
        </nav>
        <nav aria-label="Legal" style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <strong style={{ color: "var(--text-primary)" }}>Legal</strong>
          <Link href={`/${locale}/affiliate-disclosure`} style={linkStyle}>{t(locale, "affiliate_disclosure").split(".")[0]}</Link>
          <Link href={`/${locale}/privacy`} style={linkStyle}>{t(locale, "f_privacy")}</Link>
          <Link href={`/${locale}/terms`} style={linkStyle}>{t(locale, "f_terms")}</Link>
        </nav>
        <div style={{ marginLeft: "auto" }}><LanguageSwitcher locale={locale} /></div>
      </div>
    </footer>
  );
}
