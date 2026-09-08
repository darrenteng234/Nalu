# PHASE 2.5 — SCALE GATE

**Question (answered exactly):** *Is the NALU system safe and reliable enough to ingest and translate the full PUBLIC / FREE Techpresso corpus?*

## VERDICT: **NOT READY**

This is a **successful** Phase 2.5 outcome: the blockers are identified with evidence, not hidden. Two capabilities that most determine success at scale — **real body extraction** and **real automated-translation quality** — are unbuilt/unproven. Scaling now would either publish thin, body-less pages or ship unverified machine translation across tens of thousands of pages: exactly the manual-QC nightmare this phase exists to prevent.

No percentage score is used. The decision rests on the evidence below.

---

## PROVEN (demonstrated with evidence)

- **Real public extraction of metadata + structure**, scope-enforced. Evidence: 9/9 title/description/canonical/JSON-LD/headings/images/relationships; `/dashboard` refused; 0 parse anomalies.
- **Programmatic scope boundary.** Evidence: gated path refused before fetch; no gated field stored.
- **Source provenance.** Evidence: `source-snapshots` with url/hash/timestamp/scope/coverage per record.
- **Structuring → English master → publish → render** on real content. Evidence: 8 real EN pages HTTP 200 through reusable templates (no per-page code); added reviews/compare/blog routes.
- **SEO from structured identity.** Evidence: self-canonical; hreflang published-only (EN-only page → en + x-default, correct); per-type + FAQ + BreadcrumbList JSON-LD; sitemap excludes drafts.
- **Failure isolation + idempotency + retryability.** Evidence: 1 item isolated (Source→error, retryable), 8 succeeded; re-run → no duplicates.
- **Automated QA with teeth.** Evidence: 11 checks P0=0/P1=0; caught 3 real defects this phase and drove systemic fixes.
- **Change-detection / versioning / slug-history 308 / independent per-locale publish.** Evidence: proven Phase 2 (mechanism unchanged), field-hash → targeted retranslate.

## NOT PROVEN (untested or blocked)

- **Real body content** extraction→render (0/9; RSC-streamed → needs headless extractor).
- **Real automated translation** EN→MS/TH/VI (no provider/key wired).
- **Localization quality detection** (MS-vs-Indonesian, Thai spacing, VN diacritics, back-translation) — specified, unimplemented.
- **Scale behaviour** at 10k+ (query latency, Payload admin, sitemap sharding) — not measured.
- **a11y / performance** (axe/Lighthouse) — not run.
- **Source-removal / deletion** flow — not implemented; policy undecided.
- **Malformed/edge real markup** at body level — not stress-tested.

## BLOCKERS (must be resolved before scale)

| # | Blocker | Owner |
|---|---|---|
| B1 | **Headless body extractor** — real article bodies are not in raw HTML; without it, real pages are thin/body-less | engineering |
| B2 | **Live translation provider + key** (Claude via `Translator` interface) — real translation cannot run | **decision: provider + API key (D-C)** |
| B3 | **Full §03 translation-QA gates** incl. MS/ID contamination, Thai/VN script checks, back-translation, placeholder/code integrity — must exist AND be proven against seeded bad translations before trusting machine output at volume | engineering |
| B4 | **Deletion/removal policy** — undefined; source-gone handling must be decided (recommend: mark removed → noindex + drop from sitemap → archive+301 after grace window) | **decision (D-Del)** |

## CONDITIONS (required before scale; known fixes)

- C1 **Batch the N+1 source lookups** (single `in`-query).
- C2 **ISR + on-publish revalidation** (replace `force-dynamic`).
- C3 **Sitemap sharding** (`generateSitemaps` per locale, 50k/file).
- C4 **Committed SQL migrations** (replace dev `push`; resolve Phase-1 F-A).
- C5 **Generated `payload-types.ts`** (drop `any` shims; catch real-field bugs).
- C6 **Rendered a11y/perf QA** (axe + Lighthouse) + multilingual visual snapshots (Thai/VN).
- C7 **Slug namespacing** in migration to avoid cross-set collisions.
- C8 **Thin-content publish gate** — do not publish a page whose body did not extract.
- C9 **CMS-at-scale check** (admin pagination/perf at 10k rows).

## DEFERRED (safe to wait)

- Entity-aware language switcher (hreflang/canonical correct without it).
- Category/role hub detail pages (nice-to-have; not blocking correctness).
- Non-AI future content types (architecture already generic).

## EVIDENCE INDEX

- Extraction coverage + scope refusal: `PHASE_2_5_REAL_CONTENT_PILOT.md` §2; extractor `src/lib/extract/extractor.ts`.
- Ingest + provenance + isolation: `src/app/pilot/ingest-real/route.ts`; `source-snapshots` collection.
- QA (11 checks, P0=0/P1=0): `src/lib/qa/index.ts`; run `/pilot/qa`.
- Real pages 200 + SEO head (canonical/hreflang/breadcrumb/FAQ): pilot report §6–§7.
- Adversarial findings + blind spots: `PHASE_2_5_ADVERSARIAL_REVIEW.md`.
- Gap classifications: `PHASE_2_5_GAP_MATRIX.md`.

---

## Recommended path to READY (order)

1. **Decisions:** B2 (translation provider + key) and B4 (deletion policy).
2. **Build B1** headless body extractor + **C8** thin-content gate; re-run extraction pilot → body coverage.
3. **Build B3** translation-QA gates; **wire B2**; run a **real** EN→MS/TH/VI pilot on the same sample; seed known-bad translations to prove detection.
4. **Clear conditions** C1–C7, C9.
5. **Re-run** this real-content pilot + adversarial review on a **larger** sample; re-issue the Scale Gate.
6. Only then: **READY / READY WITH CONDITIONS** and bulk ingestion.

**STOP.** No full-corpus ingestion, no bulk translation, no thousands of pages, no scheduled production sync, no brand finalization. Await explicit authorization after the blockers/conditions are cleared and the gate is re-run.
