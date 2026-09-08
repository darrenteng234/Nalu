/**
 * Launch locale configuration (Phase 3 Step 4). Malay-first: the ACTIVE launch
 * set is EN + MS. The full architecture (locales.ts) still knows TH/VI, so they
 * slot in later by adding them here — no redesign. This is config, not hard-code.
 */
import type { LocaleCode } from "@/lib/i18n/locales";

/** Active launch locales. EN = source of truth; MS = first secondary. */
export const LAUNCH_LOCALES: LocaleCode[] = ["en", "ms"];

/** Secondary (translated) launch locales — excludes the EN source. */
export const LAUNCH_TARGET_LOCALES = LAUNCH_LOCALES.filter((l) => l !== "en");

export function isLaunchLocale(code: string): boolean {
  return (LAUNCH_LOCALES as string[]).includes(code);
}
