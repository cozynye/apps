import { recordError } from '@nf/analytics';
import { entries } from '@nf/db/nuni';
import { i18next, toLocalDateString } from '@nf/i18n';
import { hasEntitlement, useEntitlementStore } from '@nf/purchases';
import { and, gte, lte } from 'drizzle-orm';
import { addDatabaseChangeListener } from 'expo-sqlite';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { WidgetBridge } from '../modules/widget-bridge';
import { addDays } from './dates';
import { db } from './db';
import { useLockSettings } from './lock';
import { dayMoods } from './stats';

/**
 * widget.json (PLAN 규칙 › 홈 위젯): today's mood, the last 7 days, locked (medium needs Premium),
 * hidden (app lock on → no moods on the home screen), plus the widget's strings in the app language.
 */
export async function buildWidgetPayload(now = new Date()) {
  const today = toLocalDateString(now);
  const from = addDays(today, -6);
  const rows = await db
    .select({ id: entries.id, date: entries.date, mood: entries.mood, createdAt: entries.createdAt })
    .from(entries)
    .where(and(gte(entries.date, from), lte(entries.date, today)));
  const moods = dayMoods(rows.map((r) => ({ ...r, mood: r.mood as 1 | 2 | 3 | 4 | 5 })));
  const todayMood = moods.get(today);
  return {
    today: todayMood ? { mood: todayMood, date: today } : null,
    last7: Array.from({ length: 7 }, (_, i) => {
      const date = addDays(from, i);
      return { date, mood: moods.get(date) ?? null };
    }),
    locale: i18next.language,
    locked: !hasEntitlement('mood_premium'),
    hidden: useLockSettings.getState().enabled,
    strings: {
      tapToLog: i18next.t('widget.tapToLog'),
      locked: i18next.t('widget.locked'),
      hidden: i18next.t('widget.hidden'),
      weekTitle: i18next.t('widget.weekTitle'),
    },
    updatedAt: Date.now(),
  };
}

let pending: Promise<void> = Promise.resolve();

export function refreshWidget(): Promise<void> {
  pending = pending
    .then(async () => WidgetBridge.write(JSON.stringify(await buildWidgetPayload())))
    .catch((error: Error) => recordError(error, 'refreshWidget'));
  return pending;
}

/** Rewrites widget.json on entry changes, language, lock toggle, Premium changes and foreground. */
export function useWidgetSync() {
  useEffect(() => {
    void refreshWidget();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const debounced = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void refreshWidget(), 300);
    };
    const subs = [
      addDatabaseChangeListener((e) => e.tableName === 'entries' && debounced()),
      AppState.addEventListener('change', (s) => s === 'active' && debounced()),
    ];
    const unsubscribers = [useLockSettings.subscribe(debounced), useEntitlementStore.subscribe(debounced)];
    i18next.on('languageChanged', debounced);
    return () => {
      clearTimeout(timer);
      subs.forEach((s) => s.remove());
      unsubscribers.forEach((u) => u());
      i18next.off('languageChanged', debounced);
    };
  }, []);
}
