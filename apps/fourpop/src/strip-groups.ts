import type { Strip } from '@nf/db/fourpop';

export interface StripGroup {
  /** 'YYYY-MM-DD' in device-local time. */
  date: string;
  strips: Strip[];
}

/** Newest-first rows grouped by the local day they were made (PLAN B9 날짜별). Pure, unit-tested. */
export function groupStripsByDate(rows: Strip[], toDate: (createdAt: number) => string): StripGroup[] {
  const groups: StripGroup[] = [];
  for (const strip of rows) {
    const date = toDate(strip.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.date === date) last.strips.push(strip);
    else groups.push({ date, strips: [strip] });
  }
  return groups;
}
