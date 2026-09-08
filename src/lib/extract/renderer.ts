/* eslint-disable @typescript-eslint/no-explicit-any -- playwright is an optional lazy import */
/**
 * Rendering layer for the extractor. The parser (extractor.ts) is renderer-agnostic;
 * this decides HOW the public HTML/DOM is obtained. Production uses a headless
 * browser (Playwright) to obtain the fully-RENDERED DOM (RSC-streamed bodies are
 * only present after render). Scope enforcement lives above this (extractor.ts):
 * a renderer is only ever asked for public URLs.
 */
export interface RenderResult { html: string; status: number; renderedText?: string }
export interface Renderer { name: string; render(url: string): Promise<RenderResult> }

/** Raw fetch — fast, gets <head>/JSON-LD/headings but NOT RSC-streamed bodies. */
export const RawRenderer: Renderer = {
  name: "raw-fetch",
  async render(url) {
    const res = await fetch(url, { headers: { "user-agent": "NALU-pilot-extractor/0.1 (+public-content-only)" } });
    return { html: await res.text(), status: res.status };
  },
};

/**
 * Production headless renderer (Playwright). Lazy-imports playwright so the app
 * builds without it; throws an actionable error if the dependency/Chromium isn't
 * installed. Returns both the rendered HTML and the visible main text (for body
 * extraction). NEVER navigates to gated paths — caller enforces scope first.
 */
export const PlaywrightRenderer: Renderer = {
  name: "playwright-chromium",
  async render(url) {
    let chromium: any;
    try {
      const spec = "playwright"; // indirect specifier: optional dep, resolved at runtime only
      ({ chromium } = await import(/* webpackIgnore: true */ spec));
    } catch {
      throw new Error(
        "PlaywrightRenderer requires `playwright` + Chromium: `npm i -D playwright && npx playwright install chromium`. " +
          "Not installed in this environment; use CapturedRenderer for the pilot or install in CI.",
      );
    }
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ userAgent: "NALU-extractor/1.0 (+public-content-only)" });
      const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(500);
      const html = await page.content();
      const renderedText = await page.evaluate(() => (document.querySelector("main") ?? document.body)?.innerText ?? "");
      return { html, status: resp?.status() ?? 0, renderedText };
    } finally {
      await browser.close();
    }
  },
};

/**
 * Pilot renderer: replays rendered DOM/text captured out-of-band by the
 * environment's headless browser (keyed by URL). Lets us PROVE the extraction
 * contract + completeness gate on REAL rendered content when Chromium isn't
 * installable in-sandbox. Production path is PlaywrightRenderer.
 */
export function CapturedRenderer(captures: Record<string, { html?: string; renderedText: string; status?: number }>): Renderer {
  return {
    name: "captured",
    async render(url) {
      const c = captures[url];
      if (!c) throw new Error(`no capture for ${url}`);
      return { html: c.html ?? "", status: c.status ?? 200, renderedText: c.renderedText };
    },
  };
}
