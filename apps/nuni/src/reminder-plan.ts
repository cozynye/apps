import { toLocalDateString } from '@nf/i18n';

export interface ReminderTime {
  hour: number;
  minute: number;
}

/** Days scheduled ahead, so reminders keep coming even if the app is not opened (PLAN 리마인더). */
export const REMINDER_DAYS_AHEAD = 7;

/**
 * One-shot reminder times for the next days without an entry, at the chosen time, skipping times
 * already past. Rebuilt from scratch on every change (no repeating notification).
 */
export function reminderTriggers(now: Date, time: ReminderTime, loggedDates: ReadonlySet<string>): Date[] {
  const triggers: Date[] = [];
  for (let i = 0; i < REMINDER_DAYS_AHEAD; i++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, time.hour, time.minute);
    if (at <= now || loggedDates.has(toLocalDateString(at))) continue;
    triggers.push(at);
  }
  return triggers;
}
