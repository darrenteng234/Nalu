/**
 * Single source of truth for supported locales.
 *
 * Adding a future Asian language = add one entry here (+ its termbase/validators
 * later per docs/specs/03). No architecture change is required elsewhere.
 *
 * `en` is the canonical source/pivot (docs/specs/03). All targets are translated
 * INDEPENDENTLY from `en`; never relay-translate through another target.
 */

export const DEFAULT_LOCALE = "en" as const;

export interface LocaleDef {
  /** ISO 639-1 / BCP-47 code, used in URL path prefix: /{code}/... */
  code: string;
  /** English name (admin) */
  label: string;
  /** Endonym (native name, for the language switcher UI) */
  endonym: string;
  /** Text direction. All v1 locales are LTR; kept explicit for future scripts. */
  dir: "ltr" | "rtl";
  /**
   * Locale-specific font fallback stack token name (see globals.css).
   * The BRAND font is applied centrally later; these are only fallbacks that
   * guarantee correct script rendering (e.g. Thai, Vietnamese diacritics).
   */
  fontFallbackVar: string;
}

/** v1 locales. Order is display order. `en` is canonical/pivot. */
export const LOCALES: readonly LocaleDef[] = [
  { code: "en", label: "English",           endonym: "English",        dir: "ltr", fontFallbackVar: "--font-fallback-latin" },
  { code: "ms", label: "Malay (Malaysia)",  endonym: "Bahasa Melayu",  dir: "ltr", fontFallbackVar: "--font-fallback-latin" },
  { code: "th", label: "Thai",              endonym: "ภาษาไทย",         dir: "ltr", fontFallbackVar: "--font-fallback-thai" },
  { code: "vi", label: "Vietnamese",        endonym: "Tiếng Việt",     dir: "ltr", fontFallbackVar: "--font-fallback-latin" },
] as const;

export const LOCALE_CODES = LOCALES.map((l) => l.code);

export type LocaleCode = (typeof LOCALES)[number]["code"];

export function isLocale(code: string): code is LocaleCode {
  return LOCALE_CODES.includes(code);
}

export function getLocale(code: string): LocaleDef | undefined {
  return LOCALES.find((l) => l.code === code);
}

/** Payload `localization` config shape (used for taxonomy/nav field-localization). */
export const payloadLocalization = {
  locales: LOCALES.map((l) => ({ code: l.code, label: l.label })),
  defaultLocale: DEFAULT_LOCALE,
  // No fallback: a missing target locale must NOT silently fall back to English
  // for indexable content (docs/specs/02 §9, decision 3 = independent publish).
  fallback: false,
};
