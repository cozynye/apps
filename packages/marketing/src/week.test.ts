import { ictToUtc, isWeekId, isoWeek, nextWeek, slotUtc, utcToIct, weekDates, weekMonday } from './week';

describe('ISO weeks', () => {
  test('isoWeek', () => {
    expect(isoWeek(new Date('2026-10-19T12:00:00Z'))).toBe('2026-W43'); // Monday
    expect(isoWeek(new Date('2026-10-25T23:59:00Z'))).toBe('2026-W43'); // Sunday
    expect(isoWeek(new Date('2026-10-26T00:00:00Z'))).toBe('2026-W44');
    expect(isoWeek(new Date('2027-01-01T00:00:00Z'))).toBe('2026-W53'); // 2026 has 53 weeks
    expect(isoWeek(new Date('2027-01-04T00:00:00Z'))).toBe('2027-W01');
  });
  test('weekMonday / weekDates', () => {
    expect(weekMonday('2026-W44').toISOString()).toBe('2026-10-26T00:00:00.000Z');
    const days = weekDates('2026-W44');
    expect(days[0]).toBe('2026-10-26');
    expect(days[6]).toBe('2026-11-01');
    expect(weekDates('2026-W01')[0]).toBe('2025-12-29');
  });
  test('nextWeek rolls over the year', () => {
    expect(nextWeek('2026-W43')).toBe('2026-W44');
    expect(nextWeek('2026-W53')).toBe('2027-W01');
  });
  test('isWeekId', () => {
    expect(isWeekId('2026-W44')).toBe(true);
    expect(isWeekId('2026-W54')).toBe(false);
    expect(isWeekId('2026-44')).toBe(false);
  });
});

describe('Indochina Time slots', () => {
  test('slots map to UTC-7h', () => {
    expect(slotUtc('2026-10-26', 'morning')).toBe('2026-10-26T00:30:00.000Z');
    expect(slotUtc('2026-10-26', 'noon')).toBe('2026-10-26T05:30:00.000Z');
    expect(slotUtc('2026-10-26', 'evening')).toBe('2026-10-26T13:00:00.000Z');
  });
  test('ictToUtc crosses midnight', () => {
    expect(ictToUtc('2026-10-26T03:00')).toBe('2026-10-25T20:00:00.000Z');
  });
  test('utcToIct round trip', () => {
    expect(utcToIct('2026-10-26T13:00:00.000Z')).toBe('2026-10-26 20:00');
  });
});
