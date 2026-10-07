import type { Language } from './languages';

/**
 * Intl locale per UI language. Thai pins the Gregorian calendar (no Buddhist era, PLAN 다국어).
 * vi/th/en weeks all start on Monday.
 */
const INTL_LOCALE: Record<Language, string> = {
  vi: 'vi-VN',
  th: 'th-TH-u-ca-gregory-nu-latn',
  en: 'en-US',
};

export const WEEK_STARTS_ON = 1; // Monday

export function intlLocale(language: Language): string {
  return INTL_LOCALE[language];
}

const pad = (n: number) => String(n).padStart(2, '0');

/** dd/MM/yyyy, Gregorian year, for every language. */
export function formatDateNumeric(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function format(language: Language, date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[language], { calendar: 'gregory', ...options }).format(
    date,
  );
}

/** Calendar header, e.g. "October 2026". */
export function formatMonthYear(language: Language, date: Date): string {
  return format(language, date, { month: 'long', year: 'numeric' });
}

/** Month name only, e.g. "October". */
export function formatMonth(language: Language, date: Date): string {
  return format(language, date, { month: 'long' });
}

/** Entry sheet date line, e.g. "Tue, Oct 20". */
export function formatWeekdayDayMonth(language: Language, date: Date): string {
  return format(language, date, { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Local calendar date as 'YYYY-MM-DD' (device time zone). */
export function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parses 'YYYY-MM-DD' as a local date at 00:00. */
export function fromLocalDateString(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error(`Invalid local date: ${value}`);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}
