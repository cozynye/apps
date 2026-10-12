import { addDays, monthGrid } from './dates';

describe('addDays', () => {
  it('crosses month, year and leap day', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
});

describe('monthGrid', () => {
  it('starts weeks on Monday', () => {
    // October 2026 starts on a Thursday.
    const weeks = monthGrid(new Date(2026, 9, 20));
    expect(weeks[0]).toEqual([null, null, null, '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
    expect(weeks.at(-1)).toEqual(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', null]);
    expect(weeks).toHaveLength(5);
  });
  it('handles a month starting on Monday', () => {
    // June 2026 starts on a Monday.
    expect(monthGrid(new Date(2026, 5, 1))[0]?.[0]).toBe('2026-06-01');
  });
});
