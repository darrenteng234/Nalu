/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs are untyped until payload-types.ts is generated (Phase-1 finding F-A) */
import { payloadClient } from "@/lib/content/payload";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/i18n/locales";

/**
 * Automated QA over the pilot (docs/specs/04 subset that is runnable now).
 * System-level: no page-by-page manual QC. Returns machine-readable results.
 */
export interface QaResult { id: string; severity: "P0" | "P1" | "P2"; pass: boolean; detail: string; offenders?: string[] }
export interface QaReport { ranAt: string; results: QaResult[]; summary: { p0: number; p1: number; fail: number; pass: number } }

export async function runQa(): Promise<QaReport> {
  const p = await payloadClient();
  const results: QaResult[] = [];
  const add = (r: QaResult) => results.push(r);

  const sources = (await p.find({ collection: "sources", limit: 1000, depth: 0 })).docs;
  const variants = (await p.find({ collection: "variants", limit: 5000, depth: 0 })).docs;
  const published = variants.filter((v: any) => v.status === "published");
  const byContent = new Map<string, any[]>();
  for (const v of published) { const a = byContent.get(v.contentId) ?? []; a.push(v); byContent.set(v.contentId, a); }
  const sourceIds = new Set(sources.map((s: any) => s.contentId));

  // A. completeness — every non-errored source has a published EN master.
  // Sources whose ingest failed (ingestStatus='error') are isolated + retryable,
  // tracked separately below — not counted as "missing master".
  {
    const active = sources.filter((s: any) => s.ingestStatus !== "error");
    const missing = active.filter((s: any) => !(byContent.get(s.contentId) ?? []).some((v) => v.locale === DEFAULT_LOCALE)).map((s: any) => s.contentId);
    add({ id: "completeness.en_master", severity: "P0", pass: missing.length === 0, detail: `${active.length} active sources; ${missing.length} missing published EN master`, offenders: missing });
    const errored = sources.filter((s: any) => s.ingestStatus === "error").map((s: any) => s.contentId);
    add({ id: "ingest.errored", severity: "P2", pass: true, detail: `${errored.length} sources isolated with ingest errors (retryable)`, offenders: errored });
  }
  // B. required fields on published variants
  {
    const bad = published.filter((v: any) => !v.title || !v.slug || !v.seo?.title).map((v: any) => `${v.contentId}/${v.locale}`);
    add({ id: "fields.required", severity: "P1", pass: bad.length === 0, detail: `${bad.length} published variants missing title/slug/seo.title`, offenders: bad });
  }
  // C. slug + language collision — unique (locale,type,slug)
  {
    const seen = new Map<string, string>(); const dup: string[] = [];
    for (const v of published) { const k = `${v.locale}|${v.type}|${v.slug}`; if (seen.has(k)) dup.push(`${k} (${seen.get(k)} & ${v.contentId})`); else seen.set(k, v.contentId); }
    add({ id: "slug.collision", severity: "P0", pass: dup.length === 0, detail: `${dup.length} slug/locale collisions`, offenders: dup });
  }
  // D. hreflang integrity — cluster of a contentId has no duplicate locales, all published
  {
    const bad: string[] = [];
    for (const [cid, arr] of byContent) { const locs = arr.map((v) => v.locale); if (new Set(locs).size !== locs.length) bad.push(cid); }
    add({ id: "hreflang.cluster", severity: "P1", pass: bad.length === 0, detail: `${byContent.size} clusters; ${bad.length} with duplicate-locale entries`, offenders: bad });
  }
  // E. seo uniqueness within a locale (title + description)
  {
    const offenders: string[] = [];
    for (const l of LOCALES) {
      const inLoc = published.filter((v: any) => v.locale === l.code);
      const titles = new Map<string, number>(); const descs = new Map<string, number>();
      for (const v of inLoc) { titles.set(v.seo?.title ?? v.title, (titles.get(v.seo?.title ?? v.title) ?? 0) + 1); if (v.seo?.description) descs.set(v.seo.description, (descs.get(v.seo.description) ?? 0) + 1); }
      for (const [tn, c] of titles) if (c > 1) offenders.push(`${l.code} title×${c}: ${tn}`);
      for (const [dn, c] of descs) if (c > 1) offenders.push(`${l.code} desc×${c}: ${dn.slice(0, 40)}…`);
    }
    add({ id: "seo.uniqueness", severity: "P1", pass: offenders.length === 0, detail: `${offenders.length} duplicate title/description within a locale`, offenders });
  }
  // F. untranslated leakage — non-EN content identical to EN.
  // Protected proper nouns (single-token titles, e.g. tool/brand names) legitimately
  // stay identical (docs/specs/03 §M), so a matching *title* is leakage only when it
  // is a multi-word phrase; translatable body (summary) matching EN is always leakage.
  {
    const offenders: string[] = [];
    const isProtectedName = (s: string) => !!s && !/\s/.test(s.trim()); // single token → treat as protected proper noun
    for (const [cid, arr] of byContent) {
      const en = arr.find((v) => v.locale === DEFAULT_LOCALE); if (!en) continue;
      for (const v of arr) {
        if (v.locale === DEFAULT_LOCALE) continue;
        const titleLeak = v.title === en.title && !isProtectedName(v.title);
        const summaryLeak = !!v.summary && v.summary === en.summary;
        if (titleLeak || summaryLeak) offenders.push(`${cid}/${v.locale}`);
      }
    }
    add({ id: "lang.untranslated", severity: "P1", pass: offenders.length === 0, detail: `${offenders.length} non-EN variants with untranslated body (protected proper-noun titles exempt)`, offenders });
  }
  // G. relationship integrity. A target not (yet) in our sources is UNRESOLVED, not
  // broken: in partial ingestion many related pages aren't imported, and the renderer
  // omits unresolved links safely (decision 3). So unresolved → P2 informational.
  // A malformed edge (missing target id) is the real P1 error.
  {
    const malformed: string[] = []; const unresolved: string[] = [];
    for (const s of sources) for (const e of (s.relationships ?? [])) {
      if (e.rel === "category") continue;
      if (!e.targetContentId) { malformed.push(`${s.contentId} → ${e.rel}:(empty)`); continue; }
      if (!sourceIds.has(e.targetContentId)) unresolved.push(`${s.contentId} → ${e.rel}:${e.targetContentId}`);
    }
    add({ id: "relationships.malformed", severity: "P1", pass: malformed.length === 0, detail: `${malformed.length} malformed relationship edges`, offenders: malformed });
    add({ id: "relationships.unresolved", severity: "P2", pass: true, detail: `${unresolved.length} relationship targets not yet ingested (renderer omits; expected in partial pilot)`, offenders: unresolved.slice(0, 20) });
  }
  // H. version / stale — published variant translated from an older sourceVersion
  {
    const offenders: string[] = [];
    const srcVer = new Map(sources.map((s: any) => [s.contentId, s.sourceVersion ?? 1]));
    for (const v of published) { const sv = srcVer.get(v.contentId) ?? 1; const tv = v.translation?.translatedFromSourceVersion ?? sv; if (tv < sv) offenders.push(`${v.contentId}/${v.locale} (t${tv}<s${sv})`); }
    add({ id: "version.stale", severity: "P1", pass: offenders.length === 0, detail: `${offenders.length} stale published variants`, offenders });
  }
  // I. locale coverage (observability, not a hard fail) — how many locales per content
  {
    const under = [...byContent.entries()].filter(([, a]) => a.length < LOCALES.length).map(([cid, a]) => `${cid} (${a.length}/${LOCALES.length})`);
    add({ id: "coverage.locales", severity: "P2", pass: true, detail: `${under.length} content items not yet in all ${LOCALES.length} locales (allowed — independent publish)`, offenders: under });
  }

  const p0 = results.filter((r) => !r.pass && r.severity === "P0").length;
  const p1 = results.filter((r) => !r.pass && r.severity === "P1").length;
  const fail = results.filter((r) => !r.pass).length;
  const pass = results.filter((r) => r.pass).length;
  return { ranAt: new Date().toISOString(), results, summary: { p0, p1, fail, pass } };
}
