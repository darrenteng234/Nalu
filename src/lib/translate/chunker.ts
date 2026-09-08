/**
 * Section-aware long-document chunking (docs/specs Phase 2.9 §3). Splits a long
 * body into ordered chunks that respect logical boundaries, never truncates, and
 * is verifiably lossless on reassembly. Protected tokens are handled downstream by
 * the translator's masking (per chunk). Records chunk count/boundaries for audit.
 */
export interface Chunk { index: number; text: string; startsSection: boolean }

const MAX_CHARS = 8000; // per-chunk ceiling (well within model context; keeps requests bounded)

/**
 * Split on blank-line boundaries (paragraph/section), greedily packing up to
 * MAX_CHARS while never splitting mid-paragraph unless a single paragraph itself
 * exceeds MAX_CHARS (then hard-split that paragraph on sentence/space boundaries).
 */
export function chunkDocument(body: string, maxChars = MAX_CHARS): Chunk[] {
  const paras = body.split(/\n{2,}/).map((p) => p).filter((p) => p.trim().length > 0);
  const chunks: Chunk[] = [];
  let buf = ""; let startsSection = true;
  const flush = (starts: boolean) => { if (buf.trim()) { chunks.push({ index: chunks.length, text: buf, startsSection }); buf = ""; startsSection = starts; } };
  for (const p of paras) {
    if (p.length > maxChars) {
      flush(false);
      // hard-split an oversized paragraph on sentence then whitespace boundaries
      let rest = p;
      while (rest.length > maxChars) {
        let cut = rest.lastIndexOf(". ", maxChars); if (cut < maxChars * 0.5) cut = rest.lastIndexOf(" ", maxChars); if (cut <= 0) cut = maxChars;
        chunks.push({ index: chunks.length, text: rest.slice(0, cut + 1), startsSection: false });
        rest = rest.slice(cut + 1);
      }
      buf = rest; continue;
    }
    if ((buf + "\n\n" + p).length > maxChars) flush(false);
    buf = buf ? buf + "\n\n" + p : p;
  }
  flush(false);
  return chunks;
}

/** Reassemble in original order. */
export function reassemble(chunks: Chunk[]): string {
  return [...chunks].sort((a, b) => a.index - b.index).map((c) => c.text).join("\n\n");
}

/** Verify no silent loss: reassembled text matches source (whitespace-normalized), no gaps/dupes. */
export function verifyNoLoss(source: string, chunks: Chunk[]): { ok: boolean; detail: string } {
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  const indices = chunks.map((c) => c.index).sort((a, b) => a - b);
  for (let i = 0; i < indices.length; i++) if (indices[i] !== i) return { ok: false, detail: `chunk index gap/dup at ${i}` };
  const reNorm = norm(reassemble(chunks));
  const srcNorm = norm(source);
  if (reNorm.length !== srcNorm.length) return { ok: false, detail: `length mismatch src=${srcNorm.length} reassembled=${reNorm.length}` };
  return reNorm === srcNorm ? { ok: true, detail: `${chunks.length} chunks, lossless` } : { ok: false, detail: "content mismatch after reassembly" };
}
