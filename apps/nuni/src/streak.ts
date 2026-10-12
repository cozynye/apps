import { addDays } from './dates';

export interface Streak {
  current: number;
  best: number;
}

/**
 * Streak from the distinct entry dates (PLAN 구현 명세 › 연속 기록).
 * Today without an entry yet does not break the streak: counting starts from yesterday.
 */
export function computeStreak(dates: Iterable<string>, today: string): Streak {
  const set = new Set([...dates].filter((d) => d <= today));
  let current = 0;
  let day = set.has(today) ? today : addDays(today, -1);
  while (set.has(day)) {
    current += 1;
    day = addDays(day, -1);
  }
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of [...set].sort()) {
    run = previous !== null && addDays(previous, 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  return { current, best };
}
