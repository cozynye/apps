import { moodDistribution, moodLifts, monthSummaries, periodRange, type StatEntry } from './stats';

const e = (id: string, date: string, mood: 1 | 2 | 3 | 4 | 5, createdAt = 0): StatEntry => ({
  id,
  date,
  mood,
  createdAt,
});

describe('periodRange', () => {
  it('uses Monday-start weeks', () => {
    expect(periodRange('week', '2026-10-20')).toEqual({ from: '2026-10-19', to: '2026-10-25' });
    expect(periodRange('week', '2026-10-25')).toEqual({ from: '2026-10-19', to: '2026-10-25' });
    expect(periodRange('week', '2026-11-01')).toEqual({ from: '2026-10-26', to: '2026-11-01' });
  });
  it('covers whole months and years', () => {
    expect(periodRange('month', '2028-02-10')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
    expect(periodRange('year', '2026-10-20')).toEqual({ from: '2026-01-01', to: '2026-12-31' });
  });
});

describe('moodDistribution', () => {
  it('counts each day once with its latest entry', () => {
    const result = moodDistribution([
      e('a', '2026-10-01', 2, 1),
      e('b', '2026-10-01', 5, 2),
      e('c', '2026-10-02', 3, 1),
    ]);
    expect(result).toEqual({ counts: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 1 }, days: 2 });
  });
  it('is empty without entries', () => {
    expect(moodDistribution([]).days).toBe(0);
  });
});

describe('moodLifts', () => {
  const entries = [e('a', 'd1', 5), e('b', 'd2', 4), e('c', 'd3', 1), e('d', 'd4', 2), e('x', 'd5', 5)];
  const links = [
    { entryId: 'a', tagId: 'friends' },
    { entryId: 'b', tagId: 'friends' },
    { entryId: 'c', tagId: 'work' },
    { entryId: 'd', tagId: 'work' },
    { entryId: 'x', tagId: 'cafe' }, // only once: not ranked
    { entryId: 'gone', tagId: 'music' }, // entry outside the period
  ];
  it('ranks tags by average mood, needing two entries', () => {
    expect(moodLifts(entries, links)).toEqual([
      { tagId: 'friends', average: 4.5, count: 2 },
      { tagId: 'work', average: 1.5, count: 2 },
    ]);
  });
  it('limits the list', () => {
    expect(moodLifts(entries, links, 1)).toHaveLength(1);
  });
});

describe('monthSummaries', () => {
  it('counts days per month with the most frequent mood (ties go higher)', () => {
    const result = monthSummaries([
      e('a', '2026-01-03', 2),
      e('b', '2026-01-04', 4),
      e('c', '2026-01-05', 4),
      e('d', '2026-03-01', 1),
      e('f', '2026-03-02', 5),
    ]);
    expect(result[0]).toEqual({ days: 3, mood: 4 });
    expect(result[1]).toEqual({ days: 0, mood: null });
    expect(result[2]).toEqual({ days: 2, mood: 5 });
  });
});
