import type { Mood } from '@nf/ui';
import { and, asc, count, desc, eq, gte, lte } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import { entries, entryTags, photos, tags, type Tag } from '@nf/db/nuni';

import { db } from './db';

/** Calendar mood per date in [from, to]: the entry with the latest created_at (PLAN 캘린더 대표 기록). */
export function useCalendarMoods(from: string, to: string): Map<string, Mood> {
  const { data } = useLiveQuery(
    db
      .select({ date: entries.date, mood: entries.mood })
      .from(entries)
      .where(and(gte(entries.date, from), lte(entries.date, to)))
      .orderBy(entries.createdAt),
    [from, to],
  );
  return useMemo(() => new Map(data.map((row) => [row.date, row.mood as Mood])), [data]);
}

/** Distinct dates that have at least one entry (streak input). */
export function useEntryDates(): string[] {
  const { data } = useLiveQuery(db.selectDistinct({ date: entries.date }).from(entries));
  return useMemo(() => data.map((row) => row.date), [data]);
}

export interface DaySummary {
  id: string;
  mood: Mood;
  tagCount: number;
}

/** The representative (latest) entry of a day with its tag count, or null. */
export function useLatestEntry(date: string): DaySummary | null {
  const { data } = useLiveQuery(
    db
      .select({ id: entries.id, mood: entries.mood, tagCount: count(entryTags.tagId) })
      .from(entries)
      .leftJoin(entryTags, eq(entryTags.entryId, entries.id))
      .where(eq(entries.date, date))
      .groupBy(entries.id)
      .orderBy(desc(entries.createdAt))
      .limit(1),
    [date],
  );
  const row = data[0];
  return row ? { id: row.id, mood: row.mood as Mood, tagCount: row.tagCount } : null;
}

/** Active tags: the 20 defaults first, then custom tags, in sort order. */
export function useTags(): Tag[] {
  const { data } = useLiveQuery(db.select().from(tags).where(eq(tags.archived, false)).orderBy(asc(tags.sortOrder)));
  return data;
}

export interface DayEntry {
  id: string;
  mood: Mood;
  note: string | null;
  createdAt: number;
  /** i18n key (default tag) or custom name, in tag sort order. */
  tags: { nameKey: string | null; customName: string | null }[];
  photoCount: number;
}

/** All entries of a day, newest first (A5). */
export function useDayEntries(date: string): DayEntry[] {
  const { data: rows } = useLiveQuery(
    db.select().from(entries).where(eq(entries.date, date)).orderBy(desc(entries.createdAt)),
    [date],
  );
  const { data: tagRows } = useLiveQuery(
    db
      .select({ entryId: entryTags.entryId, nameKey: tags.nameKey, customName: tags.customName })
      .from(entryTags)
      .innerJoin(tags, eq(tags.id, entryTags.tagId))
      .innerJoin(entries, eq(entries.id, entryTags.entryId))
      .where(eq(entries.date, date))
      .orderBy(asc(tags.sortOrder)),
    [date],
  );
  const { data: photoRows } = useLiveQuery(
    db
      .select({ entryId: photos.entryId, n: count() })
      .from(photos)
      .innerJoin(entries, eq(entries.id, photos.entryId))
      .where(eq(entries.date, date))
      .groupBy(photos.entryId),
    [date],
  );
  return useMemo(
    () =>
      rows.map((row) => ({
        id: row.id,
        mood: row.mood as Mood,
        note: row.note,
        createdAt: row.createdAt,
        tags: tagRows.filter((t) => t.entryId === row.id),
        photoCount: photoRows.find((p) => p.entryId === row.id)?.n ?? 0,
      })),
    [rows, tagRows, photoRows],
  );
}

export interface PeriodData {
  entries: { id: string; date: string; mood: Mood; createdAt: number }[];
  entryTags: { entryId: string; tagId: string }[];
}

/** Entries in [from, to] with their tag links (A6 distribution and lifts). */
export function usePeriodData(from: string, to: string): PeriodData {
  const range = and(gte(entries.date, from), lte(entries.date, to));
  const { data: rows } = useLiveQuery(
    db.select({ id: entries.id, date: entries.date, mood: entries.mood, createdAt: entries.createdAt }).from(entries).where(range),
    [from, to],
  );
  const { data: links } = useLiveQuery(
    db
      .select({ entryId: entryTags.entryId, tagId: entryTags.tagId })
      .from(entryTags)
      .innerJoin(entries, eq(entries.id, entryTags.entryId))
      .where(range),
    [from, to],
  );
  return useMemo(
    () => ({ entries: rows.map((r) => ({ ...r, mood: r.mood as Mood })), entryTags: links }),
    [rows, links],
  );
}
