export const SUPPORTED_LANGUAGES = ['vi', 'th', 'en'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const FALLBACK_LANGUAGE: Language = 'en';

/**
 * Each language is labeled in its own language (PLAN 다국어). These are proper names, identical in
 * every UI language, so they live here rather than in the translation files.
 */
export const LANGUAGE_AUTONYMS: Record<Language, string> = {
  vi: 'Tiếng Việt',
  th: 'ไทย',
  en: 'English',
};

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/**
 * Picks the UI language.
 * Order: forced (E2E env) → user setting → first supported device language → English.
 */
export function resolveLanguage(options: {
  forced?: string | null;
  preferred?: string | null;
  deviceLanguageCodes: readonly (string | null | undefined)[];
}): Language {
  if (isLanguage(options.forced)) return options.forced;
  if (isLanguage(options.preferred)) return options.preferred;
  for (const code of options.deviceLanguageCodes) {
    const base = code?.toLowerCase().split(/[-_]/)[0];
    if (isLanguage(base)) return base;
  }
  return FALLBACK_LANGUAGE;
}
