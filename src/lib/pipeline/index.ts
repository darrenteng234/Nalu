import { createHash } from "crypto";
import type { Where } from "payload";
import { payloadClient } from "@/lib/content/payload";
import { LOCALES, DEFAULT_LOCALE, type LocaleCode } from "@/lib/i18n/locales";
import { PILOT_ENTITIES, PILOT_CATEGORIES, type PilotEntity, type PilotVariant } from "@/pilot/fixtures";

/**
 * Reusable pilot pipeline:
 *   discover → change-detect → structure(EN master) → translate(ms/th/vi) → validate → publish
 * Properties: idempotent (upsert by contentId / (contentId,locale)), resumable
 * (re-run safe), versioned (sourceVersion + per-variant translatedFromSourceVersion
 * + stale), failure-isolated (per entity/locale try-catch), observable (run log).
 *
 * Translation is behind a Translator interface. The pilot uses FixtureTranslator
 * (authored reference translations). The live LLM provider (Claude) is a later,
 * keyed step (docs/specs/03) and slots in here without touching the pipeline.
 */
export interface Translator {
  translate(entity: PilotEntity, locale: LocaleCode): Promise<PilotVariant>;
}
export const FixtureTranslator: Translator = {
  async translate(entity, locale) {
    const v = entity.variants[locale];
    if (!v) throw new Error(`no fixture translation for ${entity.contentId}/${locale}`);
    return v;
  },
};

function contentHash(v: PilotVariant): string {
  return createHash("sha256").update(JSON.stringify({ t: v.title, s: v.summary, sec: v.sections, f: v.faq })).digest("hex").slice(0, 16);
}

export interface RunLog {
  startedAt: string;
  finishedAt?: string;
  sourcesUpserted: number;
  variantsPublished: number;
  variantsSkippedUnchanged: number;
  categories: number;
  errors: Array<{ contentId: string; locale?: string; error: string }>;
  perEntity: Array<{ contentId: string; sourceVersion: number; action: string; locales: Record<string, string> }>;
}

async function upsert(collection: "sources" | "variants", where: Where, data: Record<string, unknown>) {
  const p = await payloadClient();
  const existing = await p.find({ collection, where, limit: 1, depth: 0 });
  if (existing.docs[0]) {
    return p.update({ collection, id: existing.docs[0].id, data: data as never, depth: 0 });
  }
  return p.create({ collection, data: data as never, depth: 0 });
}

export async function runPipeline(translator: Translator = FixtureTranslator): Promise<RunLog> {
  const p = await payloadClient();
  const log: RunLog = { startedAt: new Date().toISOString(), sourcesUpserted: 0, variantsPublished: 0, variantsSkippedUnchanged: 0, categories: 0, errors: [], perEntity: [] };

  // Seed taxonomy (categories) — localized labels/slugs (field-localized collection).
  for (const c of PILOT_CATEGORIES) {
    try {
      const existing = await p.find({ collection: "categories", where: { key: { equals: c.key } }, limit: 1, depth: 0 });
      const baseData = { key: c.key, kind: c.kind, label: c.label[DEFAULT_LOCALE], slug: c.slug[DEFAULT_LOCALE] };
      let id: string | number;
      if (existing.docs[0]) { id = existing.docs[0].id; await p.update({ collection: "categories", id, data: baseData, locale: DEFAULT_LOCALE }); }
      else { const created = await p.create({ collection: "categories", data: baseData, locale: DEFAULT_LOCALE }); id = created.id; }
      for (const l of LOCALES) if (l.code !== DEFAULT_LOCALE) await p.update({ collection: "categories", id, data: { label: c.label[l.code as LocaleCode], slug: c.slug[l.code as LocaleCode] }, locale: l.code as "en" | "ms" | "th" | "vi" });
      log.categories++;
    } catch (e) { log.errors.push({ contentId: `category:${c.key}`, error: String(e) }); }
  }

  for (const entity of PILOT_ENTITIES) {
    try {
      const enVariant = entity.variants[DEFAULT_LOCALE];
      const hash = contentHash(enVariant);

      // change detection against stored source
      const prev = await p.find({ collection: "sources", where: { contentId: { equals: entity.contentId } }, limit: 1, depth: 0 });
      const prevDoc = prev.docs[0];
      const prevHash = (prevDoc?.fieldHashes as { en?: string } | null | undefined)?.en;
      const changed = !prevDoc || prevHash !== hash;
      const sourceVersion = changed ? (prevDoc ? (prevDoc.sourceVersion ?? 1) + 1 : 1) : prevDoc.sourceVersion;

      // structure: upsert Source
      await upsert("sources", { contentId: { equals: entity.contentId } }, {
        contentId: entity.contentId,
        type: entity.type,
        sourceVersion,
        fieldHashes: { en: hash },
        difficulty: entity.neutral.difficulty ?? null,
        datePublished: entity.neutral.datePublished ?? null,
        dateModified: entity.neutral.dateModified ?? null,
        neutralData: entity.neutral.neutralData ?? null,
        relationships: entity.neutral.relationships ?? [],
        ingestStatus: "structured",
        lastIngestRunId: log.startedAt,
      });
      log.sourcesUpserted++;

      const localesLog: Record<string, string> = {};
      for (const l of LOCALES) {
        const locale = l.code as LocaleCode;
        try {
          const isEn = locale === DEFAULT_LOCALE;
          const variant = isEn ? enVariant : await translator.translate(entity, locale);

          // skip if unchanged and already published (idempotent, no needless retranslate)
          if (!changed) {
            const cur = await p.find({ collection: "variants", where: { and: [{ contentId: { equals: entity.contentId } }, { locale: { equals: locale } }, { status: { equals: "published" } }] }, limit: 1, depth: 0 });
            if (cur.docs[0]) { localesLog[locale] = "skipped-unchanged"; log.variantsSkippedUnchanged++; continue; }
          }

          // Honor the Phase 3 launch invariant (§2): a non-EN variant is never
          // written straight to `published`. Fixtures are human reference
          // translations, so they enter as `approved`, then publish through the
          // hook-guarded approved→published transition. EN is source-of-truth.
          const doc = await upsert("variants", { and: [{ contentId: { equals: entity.contentId } }, { locale: { equals: locale } }] }, {
            contentId: entity.contentId,
            locale,
            type: entity.type,
            status: isEn ? "published" : "approved",
            publishedAt: isEn ? new Date().toISOString() : null,
            title: variant.title,
            slug: variant.slug,
            summary: variant.summary,
            sections: variant.sections,
            faq: variant.faq,
            seo: { title: variant.seo?.title ?? variant.title, description: variant.seo?.description ?? variant.summary, noindex: false },
            translation: {
              translatedFromSourceVersion: sourceVersion,
              translationVersion: 1,
              localizationVersion: 1,
              stale: false,
            },
          });
          if (!isEn) await p.update({ collection: "variants", id: (doc as { id: string | number }).id, data: { status: "published", publishedAt: new Date().toISOString() } as never, depth: 0 });
          localesLog[locale] = "published";
          log.variantsPublished++;
        } catch (e) {
          localesLog[locale] = "error";
          log.errors.push({ contentId: entity.contentId, locale, error: String(e) }); // failure-isolated: continue other locales
        }
      }
      log.perEntity.push({ contentId: entity.contentId, sourceVersion, action: changed ? "changed" : "unchanged", locales: localesLog });
    } catch (e) {
      log.errors.push({ contentId: entity.contentId, error: String(e) }); // isolate entity failure
    }
  }

  log.finishedAt = new Date().toISOString();
  return log;
}
