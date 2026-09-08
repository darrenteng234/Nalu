import Link from "next/link";
import { Container } from "@/components/templates/Views";

/** Locale-agnostic 404 (params are unavailable in not-found). Kept simple + neutral. */
export default function NotFound() {
  return (
    <Container narrow>
      <div style={{ padding: "5rem 0", textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Page not found</h1>
        <p style={{ marginTop: "0.75rem", color: "var(--text-secondary)" }}>
          This page may not be published in this language yet.
        </p>
        <p style={{ marginTop: "1.5rem" }}>
          <Link href="/en" style={{ color: "var(--brand-primary)" }}>NALU home</Link>
        </p>
      </div>
    </Container>
  );
}
