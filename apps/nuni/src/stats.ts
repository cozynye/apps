import { fromLocalDateString, toLocalDateString, WEEK_STARTS_ON } from '@nf/i18n';
import type { Mood } from '@nf/ui';

import { addDays, startOfMonth } from './dates';

export type Period = 'week' | 'month' | 'year';

/** Inclusive 'YYYY-MM-DD' range of the period containing `today` (weeks start on Monday). */
export function periodRange(period: Period, today: string): { from: string; to: string } {
  const d = fromLocalDateString(today);
  if (period === 'week') {
    const from = addDays(today, -((d.getDay() - WEEK_STARTS_ON + 7) % 7));
    return { from, to: addDays(from, 6) };
  }
  if (period === 'month') {
    const first = startOfMonth(d);
    return {
      from: toLocalDateString(first),
      to: toLocalDateString(new Date(first.getFullYear(), first.getMonth() + 1, 0)),
    };
  }
  return { from: `${d.getFullYear()}-01-01`, to: `${d.getFullYear()}-12-31` };
}

export interface StatEntry {
  id: string;
  date: string;
  mood: Mood;
  createdAt: number;
}

/** Mood counts over days: each day counts once, with its representative (latest) entry. */
export function moodDistribution(entries: readonly StatEntry[]): { counts: Record<Mood, number>; days: number } {
  const moods = dayMoods(entries);
  const counts: Record<Mood, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const mood of moods.values()) counts[mood] += 1;
  return { counts, days: moods.size };
}

export interface Lift {
  tagId: string;
  /** Average mood of entries with this tag. */
  average: number;
  count: number;
}

/** A tag needs this many entries before it is ranked, so one good day does not top the list. */
export const MIN_TAG_ENTRIES = 2;

/**
 * "What lifts your mood": tags ranked by the average mood of the entries they appear on
 * (all entries, not only the representative ones). Ties go to the more frequent tag.
 */
export function moodLifts(
  entries: readonly StatEntry[],
  entryTags: readonly { entryId: string; tagId: string }[],
  limit = 4,
): Lift[] {
  const moodById = new Map(entries.map((e) => [e.id, e.mood]));
  const totals = new Map<string, { sum: number; count: number }>();
  for (const { entryId, tagId } of entryTags) {
    const mood = moodById.get(entryId);
    if (mood === undefined) continue;
    const t = totals.get(tagId) ?? { sum: 0, count: 0 };
    t.sum += mood;
    t.count += 1;
    totals.set(tagId, t);
  }
  return [...totals]
    .filter(([, t]) => t.count >= MIN_TAG_ENTRIES)
    .map(([tagId, t]) => ({ tagId, average: t.sum / t.count, count: t.count }))
    .sort((a, b) => b.average - a.average || b.count - a.count)
    .slice(0, limit);
}

/** Representative (latest) mood per date. */
export function dayMoods(entries: readonly StatEntry[]): Map<string, Mood> {
  const latest = new Map<string, StatEntry>();
  for (const e of entries) {
    const current = latest.get(e.date);
    if (!current || e.createdAt > current.createdAt) latest.set(e.date, e);
  }
  return new Map([...latest].map(([date, e]) => [date, e.mood]));
}

/** Year card: per month (0–11) the logged days and the most frequent day mood (ties → higher). */
export function monthSummaries(entries: readonly StatEntry[]): { days: number; mood: Mood | null }[] {
  const months = Array.from({ length: 12 }, () => ({ days: 0, counts: [0, 0, 0, 0, 0, 0] }));
  for (const [date, mood] of dayMoods(entries)) {
    const m = months[Number(date.slice(5, 7)) - 1]!;
    m.days += 1;
    m.counts[mood]! += 1;
  }
  return months.map(({ days, counts }) => {
    let mood: Mood | null = null;
    for (let k = 1; k <= 5; k++) if (counts[k]! > 0 && (mood === null || counts[k]! >= counts[mood]!)) mood = k as Mood;
    return { days, mood };
  });
}
