import { track } from '@nf/analytics';
import { toLocalDateString } from '@nf/i18n';
import { entries } from '@nf/db/nuni';
import { router } from 'expo-router';

import { useAppState } from './app-state';
import { db } from './db';
import { computeStreak } from './streak';

const MILESTONES = [3, 7, 30] as const;

export async function currentStreak(): Promise<number> {
  const rows = await db.selectDistinct({ date: entries.date }).from(entries);
  return computeStreak(
    rows.map((r) => r.date),
    toLocalDateString(new Date()),
  ).current;
}

/**
 * After a new entry is saved (A4 or a notification quick action): `streak_milestone` at 3/7/30,
 * then at most one follow-up sheet — A12 after the very first entry, else the 3-day celebration
 * once. The paywall is never forced here (PLAN 사용자 플로우).
 */
export async function afterNewEntry(streakBefore: number) {
  const after = await currentStreak();
  const milestone = MILESTONES.find((m) => m === after);
  if (milestone && after > streakBefore) track('streak_milestone', { days: milestone });

  const state = useAppState.getState();
  if (!state.reminderPrompted) {
    useAppState.setState({ reminderPrompted: true });
    router.push('/a12-reminder');
  } else if (after >= 3 && streakBefore < 3 && !state.streakCelebrated) {
    useAppState.setState({ streakCelebrated: true });
    router.push({ pathname: '/streak-celebrate', params: { count: after } });
  }
}
