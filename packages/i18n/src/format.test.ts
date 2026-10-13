import {
  formatDateNumeric,
  formatMonth,
  formatMonthYear,
  formatWeekdayDayMonth,
  fromLocalDateString,
  toLocalDateString,
} from './format';
import { resolveLanguage } from './languages';

const oct20 = new Date(2026, 9, 20);

describe('formatDateNumeric', () => {
  it('uses dd/MM/yyyy with zero padding', () => {
    expect(formatDateNumeric(oct20)).toBe('20/10/2026');
    expect(formatDateNumeric(new Date(2027, 0, 5))).toBe('05/01/2027');
  });
});

describe('Intl formats', () => {
  it('formats month and year per language', () => {
    expect(formatMonthYear('en', oct20)).toBe('October 2026');
    expect(formatMonthYear('vi', oct20)).toMatch(/10.*2026/);
  });

  it('keeps the Gregorian year in Thai (no Buddhist era 2569)', () => {
    const th = formatMonthYear('th', oct20);
    expect(th).toContain('2026');
    expect(th).not.toContain('2569');
    expect(th).toContain('ตุลาคม');
  });

  it('formats the entry date line', () => {
    expect(formatWeekdayDayMonth('en', oct20)).toBe('Tue, Oct 20');
  });
});

describe('local date strings', () => {
  it('round-trips YYYY-MM-DD in local time', () => {
    expect(toLocalDateString(oct20)).toBe('2026-10-20');
    expect(fromLocalDateString('2026-10-20').getTime()).toBe(oct20.getTime());
  });

  it('rejects malformed input', () => {
    expect(() => fromLocalDateString('2026-1-2')).toThrow();
  });
});

describe('resolveLanguage', () => {
  it('prefers forced, then user setting, then device', () => {
    expect(resolveLanguage({ forced: 'th', preferred: 'vi', deviceLanguageCodes: ['en'] })).toBe('th');
    expect(resolveLanguage({ preferred: 'vi', deviceLanguageCodes: ['th'] })).toBe('vi');
    expect(resolveLanguage({ deviceLanguageCodes: ['ko', 'th-TH'] })).toBe('th');
  });

  it('falls back to English for unsupported or empty values', () => {
    expect(resolveLanguage({ forced: '', preferred: 'ko', deviceLanguageCodes: ['ja', null] })).toBe('en');
  });
});

describe('month headings', () => {
  it('start with a capital letter in Vietnamese', () => {
    expect(formatMonthYear('vi', oct20)).toMatch(/^Tháng 10/);
    expect(formatMonth('vi', oct20)).toMatch(/^Tháng 10/);
  });
});
