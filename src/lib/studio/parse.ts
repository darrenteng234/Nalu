/**
 * Article parser (Phase 4 §3). Turns a founder's pasted article (markdown or
 * plain text) into the structured shape the existing template renders
 * (title/summary/sections[]/faq[]). HTML is stripped to text — the public
 * template renders these strings as React text nodes (auto-escaped), and
 * stripping here removes any pasted <script>/markup defensively (adversarial:
 * pasted HTML/XSS). No facts are invented; structure only.
 */
export interface ParsedSection { id: string; heading?: string; body?: string; items?: string[] }
export interface ParsedFaq { id: string; q: string; a: string }
export interface ParsedArticle { title?: string; summary?: string; sections: ParsedSection[]; faq: ParsedFaq[] }

/** Remove all HTML tags + collapse entities to text. Defensive against pasted markup. */
export function stripHtml(s: string): string {
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'");
}

const isHeading = (l: string) => /^#{1,6}\s+/.test(l);
const headingText = (l: string) => l.replace(/^#{1,6}\s+/, "").trim();
const isBullet = (l: string) => /^\s*([-*+]|\d+\.)\s+/.test(l);
const bulletText = (l: string) => l.replace(/^\s*([-*+]|\d+\.)\s+/, "").trim();

let _idc = 0;
const nextId = (p: string) => `${p}${_idc++}`;

export function parseArticle(raw: string): ParsedArticle {
  _idc = 0;
  const text = stripHtml(raw ?? "").replace(/\r\n/g, "\n").trim();
  const lines = text.split("\n");
  let title: string | undefined;

  // A leading H1 (# ...) becomes the title.
  let start = 0;
  while (start < lines.length && lines[start].trim() === "") start++;
  if (start < lines.length && /^#\s+/.test(lines[start])) { title = headingText(lines[start]); start++; }

  const sections: ParsedSection[] = [];
  const faq: ParsedFaq[] = [];
  let cur: ParsedSection = { id: nextId("s") };
  let para: string[] = [];
  let inFaq = false;

  const flushPara = () => {
    if (para.length) {
      const joined = para.join(" ").trim();
      if (joined) cur.body = cur.body ? `${cur.body}\n\n${joined}` : joined;
      para = [];
    }
  };
  const flushSection = () => {
    flushPara();
    if (cur.heading || cur.body || (cur.items && cur.items.length)) sections.push(cur);
    cur = { id: nextId("s") };
  };

  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (isHeading(line)) {
      const h = headingText(line);
      flushSection();
      if (/^faq|frequently asked/i.test(h)) { inFaq = true; cur = { id: nextId("s"), heading: h }; continue; }
      inFaq = false;
      cur.heading = h;
      continue;
    }
    if (inFaq) {
      // Q/A patterns: "Q: ..." / "A: ..." or "**Q**" style, or bold question then answer
      const qm = trimmed.match(/^(?:\*\*)?Q(?:uestion)?[:.)]\s*(.+?)(?:\*\*)?$/i);
      const am = trimmed.match(/^(?:\*\*)?A(?:nswer)?[:.)]\s*(.+?)(?:\*\*)?$/i);
      if (qm) { faq.push({ id: nextId("f"), q: qm[1].trim(), a: "" }); continue; }
      if (am && faq.length) { faq[faq.length - 1].a = am[1].trim(); continue; }
      if (trimmed && faq.length && !faq[faq.length - 1].a) { faq[faq.length - 1].a = trimmed; continue; }
      continue;
    }
    if (isBullet(line)) { flushPara(); (cur.items ??= []).push(bulletText(line)); continue; }
    if (trimmed === "") { flushPara(); continue; }
    para.push(trimmed);
  }
  flushSection();

  // Summary = first non-empty paragraph body of the first content section.
  let summary: string | undefined;
  for (const s of sections) { if (s.body) { summary = s.body.split("\n\n")[0]; break; } }

  return { title, summary, sections: sections.filter((s) => s.heading || s.body || s.items?.length), faq: faq.filter((f) => f.q) };
}
