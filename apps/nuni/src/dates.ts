import { fromLocalDateString, toLocalDateString, WEEK_STARTS_ON } from '@nf/i18n';

/** Adds whole days to a 'YYYY-MM-DD' local date (calendar arithmetic, DST-safe). */
export function addDays(date: string, days: number): string {
  const d = fromLocalDateString(date);
  return toLocalDateString(new Date(d.getFullYear(), d.getMonth(), d.getDate() + days));
}

/** First day of the month containing `date`, as a local Date. */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(month: Date, months: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + months, 1);
}

/**
 * Calendar grid for a month: weeks of 7 cells starting on Monday (PLAN 다국어: 월요일 시작).
 * Cells outside the month are null.
 */
export function monthGrid(month: Date): (string | null)[][] {
  const first = startOfMonth(month);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() - WEEK_STARTS_ON + 7) % 7;
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toLocalDateString(new Date(first.getFullYear(), first.getMonth(), day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
