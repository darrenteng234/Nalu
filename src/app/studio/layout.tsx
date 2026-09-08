import "../globals.css";
import Link from "next/link";

/** Standalone root layout for the founder Studio (outside the (frontend) group). */
export const metadata = { title: "NALU Studio", robots: { index: false, follow: false } };

const S = {
  bar: { borderBottom: "1px solid var(--border)", background: "var(--surface)", padding: "0.75rem 1.25rem", display: "flex", gap: "1rem", alignItems: "center" } as React.CSSProperties,
  brand: { fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)", textDecoration: "none" } as React.CSSProperties,
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: "var(--background)", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
        <div style={S.bar}>
          <Link href="/studio" style={S.brand}>NALU Studio</Link>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Write · Review · Publish</span>
          <Link href="/studio/new" style={{ marginLeft: "auto", padding: "0.4rem 0.9rem", borderRadius: 999, background: "var(--brand-primary)", color: "var(--brand-on,#fff)", textDecoration: "none", fontWeight: 600, fontSize: "0.85rem" }}>+ New article</Link>
        </div>
        <main style={{ maxWidth: 860, margin: "0 auto", padding: "1.5rem 1.25rem" }}>{children}</main>
      </body>
    </html>
  );
}
