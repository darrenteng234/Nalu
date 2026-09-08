import "../globals.css";

/** Standalone root layout for the internal Ops dashboard (outside the (frontend) group). */
export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
