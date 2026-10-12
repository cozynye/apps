import { recordError, track } from '@nf/analytics';
import { i18next, toLocalDateString } from '@nf/i18n';
import { mmkvStateStorage } from '@nf/ui';
import { entries } from '@nf/db/nuni';
import { and, gte, lte } from 'drizzle-orm';
import * as Notifications from 'expo-notifications';
import { addDatabaseChangeListener } from 'expo-sqlite';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { db } from './db';
import { addDays } from './dates';
import { REMINDER_DAYS_AHEAD, reminderTriggers, type ReminderTime } from './reminder-plan';

/** Notification category with the Low / Okay / Good quick actions (mood 2 / 3 / 4). */
export const REMINDER_CATEGORY = 'daily-reminder';
export const QUICK_ACTION_PREFIX = 'mood-';

interface ReminderState extends ReminderTime {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  setTime: (time: ReminderTime) => void;
}

/** Reminder settings (PLAN 상태 경계: 알림 시간). Default 21:00, off until A12 or Settings turns it on. */
export const useReminderSettings = create<ReminderState>()(
  persist(
    (set) => ({
      enabled: false,
      hour: 21,
      minute: 0,
      setEnabled: (enabled) => set({ enabled }),
      setTime: ({ hour, minute }) => set({ hour, minute }),
    }),
    { name: 'reminder.v1', storage: createJSONStorage(() => mmkvStateStorage), version: 1 },
  ),
);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Asks for permission (A12 / Settings). Returns whether reminders can be delivered. */
export async function requestReminderPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) {
    track('permission_denied', { type: 'notifications' });
    return false;
  }
  const result = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true } });
  if (!result.granted) track('permission_denied', { type: 'notifications' });
  return result.granted;
}

/** Category titles follow the app language, so they are set again on language change. */
async function registerCategory() {
  const action = (mood: 2 | 3 | 4, key: string): Notifications.NotificationAction => ({
    identifier: `${QUICK_ACTION_PREFIX}${mood}`,
    buttonTitle: i18next.t(key),
    // Opening the app makes the save reliable even when it was terminated.
    options: { opensAppToForeground: true },
  });
  await Notifications.setNotificationCategoryAsync(REMINDER_CATEGORY, [
    action(2, 'notification.action1'),
    action(3, 'notification.action3'),
    action(4, 'notification.action4'),
  ]);
}

let pending: Promise<void> = Promise.resolve();

/**
 * Cancels every scheduled reminder and schedules one-shot reminders for the next unlogged days
 * (PLAN 규칙 › 리마인더). Calls are serialized so overlapping triggers cannot double-schedule.
 */
export function rescheduleReminders(): Promise<void> {
  pending = pending.then(doReschedule).catch((error: Error) => recordError(error, 'rescheduleReminders'));
  return pending;
}

async function doReschedule() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const { enabled, hour, minute } = useReminderSettings.getState();
  if (!enabled || !(await Notifications.getPermissionsAsync()).granted) return;

  const today = toLocalDateString(new Date());
  const rows = await db
    .selectDistinct({ date: entries.date })
    .from(entries)
    .where(and(gte(entries.date, today), lte(entries.date, addDays(today, REMINDER_DAYS_AHEAD))));
  const logged = new Set(rows.map((r) => r.date));

  for (const date of reminderTriggers(new Date(), { hour, minute }, logged)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: i18next.t('notification.reminderTitle'),
        body: i18next.t('notification.reminderBody'),
        categoryIdentifier: REMINDER_CATEGORY,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  }
}

/**
 * Keeps reminders in sync: entry saved/deleted, settings changed, language changed, app back in the
 * foreground (PLAN 리마인더 재예약 시점). Mounted once in the root layout.
 */
export function useReminderSync() {
  useEffect(() => {
    void registerCategory().then(rescheduleReminders);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const debounced = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void rescheduleReminders(), 500);
    };
    const subs = [
      addDatabaseChangeListener((e) => e.tableName === 'entries' && debounced()),
      AppState.addEventListener('change', (state) => state === 'active' && debounced()),
    ];
    const unsubscribeSettings = useReminderSettings.subscribe(debounced);
    const onLanguage = () => void registerCategory().then(rescheduleReminders);
    i18next.on('languageChanged', onLanguage);
    return () => {
      clearTimeout(timer);
      subs.forEach((s) => s.remove());
      unsubscribeSettings();
      i18next.off('languageChanged', onLanguage);
    };
  }, []);
}
