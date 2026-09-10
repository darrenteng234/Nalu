"use client";
import { useState } from "react";

/**
 * Prompt copy control (Phase 5 §8/§20). Mobile-first: large tap target, clear
 * copied state, resilient clipboard with a textarea fallback for browsers/webviews
 * without navigator.clipboard (common on mobile). Labels are passed in (localized).
 */
export function CopyButton({ text, label, copiedLabel }: { text: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); ok = true; }
    } catch { /* fall through to legacy path */ }
    if (!ok) {
      try {
        const ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.focus(); ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch { ok = false; }
    }
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      style={{
        display: "inline-flex", alignItems: "center", gap: "0.5rem",
        padding: "0.7rem 1.2rem", minHeight: 44, borderRadius: 999,
        background: copied ? "var(--success)" : "var(--brand-primary)",
        color: "var(--brand-on, #fff)", border: "none", fontWeight: 700, fontSize: "0.95rem",
        cursor: "pointer", width: "100%", justifyContent: "center", maxWidth: 320,
      }}
    >
      {copied ? `✓ ${copiedLabel}` : label}
    </button>
  );
}
