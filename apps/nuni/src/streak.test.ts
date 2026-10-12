import { computeStreak } from './streak';

const S = ['2026-10-18', '2026-10-19', '2026-10-20'];

describe('computeStreak (PLAN examples)', () => {
  it('counts through today', () => {
    expect(computeStreak(S, '2026-10-20')).toEqual({ current: 3, best: 3 });
  });
  it('keeps the streak when today has no entry yet', () => {
    expect(computeStreak(S, '2026-10-21')).toEqual({ current: 3, best: 3 });
  });
  it('breaks after a missed day', () => {
    expect(computeStreak(S, '2026-10-22')).toEqual({ current: 0, best: 3 });
  });
  it('is zero without entries', () => {
    expect(computeStreak([], '2026-10-20')).toEqual({ current: 0, best: 0 });
  });
});

describe('computeStreak edge cases', () => {
  it('ignores future dates and duplicates', () => {
    expect(computeStreak(['2026-10-20', '2026-10-20', '2026-10-21'], '2026-10-20')).toEqual({ current: 1, best: 1 });
  });
  it('crosses month and year boundaries', () => {
    expect(computeStreak(['2025-12-30', '2025-12-31', '2026-01-01'], '2026-01-01').current).toBe(3);
    expect(computeStreak(['2026-02-28', '2026-03-01'], '2026-03-01').current).toBe(2);
  });
  it('reports the longest past run as best', () => {
    const dates = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-10', '2026-10-11'];
    expect(computeStreak(dates, '2026-10-11')).toEqual({ current: 2, best: 4 });
  });
});
