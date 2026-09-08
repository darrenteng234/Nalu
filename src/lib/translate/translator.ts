/**
 * Translation abstraction (Phase 2.6 B2/§7-§9). English is the master; every
 * target translates DIRECTLY from English (never chained). The app depends on the
 * `Translator` interface, never a concrete provider. Credentials come from env.
 *
 * Field-aware: each field is classified TRANSLATE / LOCALIZE / PROTECT / SKIP, and
 * protected tokens (brand/product/model names, URLs, code, placeholders) are masked
 * before translation and restored after (docs/specs/03 §M/§N).
 */
import type { LocaleCode } from "@/lib/i18n/locales";

export type FieldPolicy = "translate" | "localize" | "protect" | "skip";
export interface Field { key: string; text: string; policy: FieldPolicy }
export interface TranslateRequest { contentId: string; sourceLocale: "en"; targetLocale: LocaleCode; fields: Field[] }
export interface TranslatedField { key: string; text: string; policy: FieldPolicy }
export interface TranslateResult {
  contentId: string; targetLocale: LocaleCode; fields: TranslatedField[];
  provider: string; model: string; timestamp: string;
}
export interface Translator {
  provider: string; model: string;
  translate(req: TranslateRequest): Promise<TranslateResult>;
  translateBatch(reqs: TranslateRequest[]): Promise<TranslateResult[]>;
  validate(): Promise<{ ok: boolean; detail: string }>;
}

/** Protected-token registry + masking (never translated). */
export const PROTECTED_NAMES = ["ChatGPT", "Claude", "Gemini", "Midjourney", "Perplexity", "Gumloop", "Notion", "OpenAI", "Anthropic", "NALU", "Techpresso"];
const TOKEN_RE = /(\{\{[^}]+\}\}|\[[A-Z0-9_]+\]|`[^`]+`|https?:\/\/\S+|<[^>]+>)/g;

export function maskProtected(text: string): { masked: string; restore: (s: string) => string } {
  const store: string[] = [];
  let masked = text.replace(TOKEN_RE, (m) => { store.push(m); return `§${store.length - 1}§`; });
  for (const name of PROTECTED_NAMES) {
    masked = masked.replace(new RegExp(`\\b${name}\\b`, "g"), (m) => { store.push(m); return `§${store.length - 1}§`; });
  }
  return { masked, restore: (s) => s.replace(/§(\d+)§/g, (_, i) => store[Number(i)] ?? "") };
}

/** Default field policies per field key. */
export function policyFor(key: string): FieldPolicy {
  if (["slug", "url", "code"].includes(key)) return "skip";
  if (["seoTitle", "cta"].includes(key)) return "localize";
  return "translate";
}

/**
 * Mock provider — deterministic, offline. Proves the pipeline PLUMBING (field-aware
 * flow, masking, batch, versioning) WITHOUT a real API. It prefixes a locale tag so
 * output differs from English (never used for real content).
 */
export const MockTranslator: Translator = {
  provider: "mock", model: "mock-1",
  async translate(req) {
    const tag = { ms: "[MS]", th: "[TH]", vi: "[VI]", en: "[EN]" }[req.targetLocale] ?? "[?]";
    const fields = req.fields.map((f) => {
      if (f.policy === "protect" || f.policy === "skip") return { key: f.key, text: f.text, policy: f.policy };
      const { masked, restore } = maskProtected(f.text);
      return { key: f.key, text: restore(`${tag} ${masked}`), policy: f.policy };
    });
    return { contentId: req.contentId, targetLocale: req.targetLocale, fields, provider: this.provider, model: this.model, timestamp: new Date().toISOString() };
  },
  async translateBatch(reqs) { return Promise.all(reqs.map((r) => this.translate(r))); },
  async validate() { return { ok: true, detail: "mock provider (offline)" }; },
};

/**
 * Production provider — Anthropic Claude. Reads ANTHROPIC_API_KEY from env; if
 * absent, `validate()` reports not-configured and `translate()` throws (never
 * silently degrades). Translates field-by-field, English pivot only, masking
 * protected tokens. (Coded for wiring; NOT RUN in this phase — no key present.)
 */
export function ClaudeTranslator(model = "claude-sonnet-5"): Translator {
  const key = process.env.ANTHROPIC_API_KEY;
  const localeName = { ms: "Malaysian Malay (Bahasa Melayu, NOT Indonesian)", th: "Thai", vi: "Vietnamese" } as Record<string, string>;
  return {
    provider: "anthropic", model,
    async validate() { return key ? { ok: true, detail: `anthropic ${model}` } : { ok: false, detail: "ANTHROPIC_API_KEY not set" }; },
    async translate(req) {
      if (!key) throw new Error("ANTHROPIC_API_KEY not set — cannot translate");
      const out: TranslatedField[] = [];
      for (const f of req.fields) {
        if (f.policy === "protect" || f.policy === "skip") { out.push({ ...f }); continue; }
        const { masked, restore } = maskProtected(f.text);
        const sys = `Translate from English into ${localeName[req.targetLocale] ?? req.targetLocale}. Natural, native phrasing — not word-for-word. Preserve §N§ placeholders exactly. Return only the translation.`;
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model, max_tokens: 2000, system: sys, messages: [{ role: "user", content: masked }] }),
        });
        if (!res.ok) throw new Error(`provider ${res.status}`);
        const data = await res.json();
        const text = restore(String(data?.content?.[0]?.text ?? "").trim());
        out.push({ key: f.key, text, policy: f.policy });
      }
      return { contentId: req.contentId, targetLocale: req.targetLocale, fields: out, provider: this.provider, model, timestamp: new Date().toISOString() };
    },
    async translateBatch(reqs) { const r: TranslateResult[] = []; for (const q of reqs) r.push(await this.translate(q)); return r; },
  };
}

/**
 * Production provider — Google Gemini (docs/specs/03 §5-§7, authoritative).
 * Reads GOOGLE_API_KEY / GEMINI_API_KEY from env; `validate()` reports
 * not-configured when absent; `translate()` throws rather than degrade. Uses
 * structured JSON output (§7/§39), field-by-field, English pivot only, masking
 * protected tokens (§10). Coded for the §71 pilot; NOT RUN until a key is set.
 */
export function GeminiTranslator(model = "gemini-3.1-flash-lite"): Translator {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  const localeName = { ms: "Malaysian Malay (Bahasa Melayu as used in Malaysia, NOT Indonesian)", th: "Thai", vi: "Vietnamese" } as Record<string, string>;
  return {
    provider: "google", model,
    async validate() { return key ? { ok: true, detail: `gemini ${model}` } : { ok: false, detail: "GOOGLE_API_KEY / GEMINI_API_KEY not set" }; },
    async translate(req) {
      if (!key) throw new Error("GOOGLE_API_KEY / GEMINI_API_KEY not set — cannot translate");
      const out: TranslatedField[] = [];
      for (const f of req.fields) {
        if (f.policy === "protect" || f.policy === "skip") { out.push({ ...f }); continue; }
        const { masked, restore } = maskProtected(f.text);
        const hasTokens = /§\d+§/.test(masked);
        const sys = `Translate from English into ${localeName[req.targetLocale] ?? req.targetLocale}. Natural, native phrasing — not word-for-word. Do not invent or omit meaning.${hasTokens ? " Preserve every §N§ placeholder exactly and do not add new ones." : ""} Never translate via another language. Return ONLY JSON {"text": "<translation>"}.`;
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: sys }] },
              contents: [{ role: "user", parts: [{ text: masked }] }],
              generationConfig: { responseMimeType: "application/json", responseSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
            }),
          },
        );
        if (!res.ok) throw new Error(`gemini ${res.status}`);
        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
        let text = "";
        try { text = String(JSON.parse(raw).text ?? "").trim(); } catch { throw new Error("gemini: non-JSON response"); }
        out.push({ key: f.key, text: restore(text), policy: f.policy });
      }
      return { contentId: req.contentId, targetLocale: req.targetLocale, fields: out, provider: this.provider, model, timestamp: new Date().toISOString() };
    },
    async translateBatch(reqs) { const r: TranslateResult[] = []; for (const q of reqs) r.push(await this.translate(q)); return r; },
  };
}

/**
 * Select provider from env, never silently for real content (§5, config-driven).
 * Priority: Gemini (authoritative provider) → Claude (alternate) → Mock (offline).
 */
export function getTranslator(): Translator {
  if (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) return GeminiTranslator();
  if (process.env.ANTHROPIC_API_KEY) return ClaudeTranslator();
  return MockTranslator;
}
