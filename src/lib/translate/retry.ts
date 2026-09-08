/**
 * In-app resilience for translation provider calls (Phase 3 §7, AC10).
 * Phase 2.8/2.9 proved 429 handling in pilot SCRIPTS; the launch path needs it
 * in the APP. Exponential backoff on transient errors (429 / 5xx / network),
 * bounded retries, and a concurrency limiter (≤2 per Phase 2.9 finding).
 */

export interface RetryOpts { retries?: number; baseMs?: number; capMs?: number; onRetry?: (attempt: number, waitMs: number, err: unknown) => void }

/** Is this error worth retrying? 429, 5xx, and network/parse blips — not 4xx auth/validation. */
export function isTransient(err: unknown): boolean {
  const m = String(err instanceof Error ? err.message : err);
  if (/\b(429|408|425|500|502|503|504)\b/.test(m)) return true;
  if (/rate|timeout|timed out|ECONNRESET|ETIMEDOUT|EAI_AGAIN|fetch failed|network/i.test(m)) return true;
  return false;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Run `fn`, retrying transient failures with exponential backoff + full jitter. */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOpts = {}): Promise<T> {
  const retries = opts.retries ?? 5;
  const base = opts.baseMs ?? 1000;
  const cap = opts.capMs ?? 16000;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === retries || !isTransient(err)) break;
      const backoff = Math.min(cap, base * 2 ** attempt);
      const jittered = Math.round(backoff / 2 + Math.random() * (backoff / 2));
      opts.onRetry?.(attempt + 1, jittered, err);
      await wait(jittered);
    }
  }
  throw lastErr;
}

/** Map with bounded concurrency (default 2). Preserves input order in the result. */
export async function mapLimit<A, B>(items: A[], limit: number, fn: (a: A, i: number) => Promise<B>): Promise<B[]> {
  const out: B[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}
