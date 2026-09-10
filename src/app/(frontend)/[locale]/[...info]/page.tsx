import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/templates/Views";
import { t } from "@/lib/i18n/ui";

/**
 * Info/company/legal pages (Phase 5 §16 footer). A single catch-all so footer/nav
 * links never 404. Specific product routes (tools, prompts, teach-ai, …) match
 * first; this only handles the known info slugs below. Content is honest and
 * minimal — no fabricated legal/privacy text (§25); real pages can replace these.
 */
const KINDS = ["about", "methodology", "contact", "affiliate-disclosure", "privacy", "terms", "resources"] as const;
type Kind = (typeof KINDS)[number];

function content(kind: Kind, locale: string): { title: string; body: string[] } {
  switch (kind) {
    case "about":
      return { title: "About NALU", body: ["NALU helps people get real work done with AI.", "We start in Malaysia, in English and Bahasa Melayu, focusing on practical jobs: the prompt, the method, the workflow, and the right tool — so you can take action."] };
    case "methodology":
      return { title: "Methodology", body: ["We separate two things on purpose. Editorial fit (quality, job fit, ease of use, value, reliability, limitations) decides what we call the best tool. Commercial opportunity (affiliate availability, payout) only influences what we choose to investigate — never the recommendation itself.", "Tool data carries a last-verified date. Where something is not verified, we mark it. We do not fabricate testing, prices, or results."] };
    case "contact":
      return { title: "Contact", body: ["A public contact channel is being set up. Until then, reach us through the site owner."] };
    case "affiliate-disclosure":
      return { title: "Affiliate disclosure", body: [t(locale, "affiliate_disclosure"), "When you use a link marked as affiliate, we may earn a commission at no extra cost to you. It never changes which tool we recommend or how we rank options."] };
    case "privacy":
      return { title: "Privacy", body: ["Our full privacy policy is being finalized. We do not sell personal data. This page will be updated with the complete policy before launch."] };
    case "terms":
      return { title: "Terms", body: ["Our full terms of use are being finalized. This page will be updated with the complete terms before launch."] };
    case "resources":
      return { title: t(locale, "resource_title"), body: [t(locale, "resource_sub"), "The starter kit is being finalized. It will be a practical, no-fluff checklist you can use immediately."] };
  }
}

type P = { params: Promise<{ locale: string; info: string[] }> };

function resolve(info: string[]): Kind | null {
  if (info.length !== 1) return null;
  return (KINDS as readonly string[]).includes(info[0]) ? (info[0] as Kind) : null;
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, info } = await params;
  const kind = resolve(info);
  if (!kind) return {};
  const { title } = content(kind, locale);
  return { title, robots: kind === "privacy" || kind === "terms" ? { index: false, follow: true } : undefined };
}

export default async function InfoPage({ params }: P) {
  const { locale, info } = await params;
  const kind = resolve(info);
  if (!kind) notFound();
  const { title, body } = content(kind, locale);
  return (
    <Container narrow>
      <article style={{ padding: "2.5rem 0", maxWidth: "68ch" }}>
        <h1 style={{ fontSize: "clamp(1.7rem,4vw,2.4rem)", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 1rem" }}>{title}</h1>
        {body.map((p, i) => <p key={i} style={{ lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: "1rem" }}>{p}</p>)}
      </article>
    </Container>
  );
}
