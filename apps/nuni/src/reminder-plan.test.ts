import { reminderTriggers } from './reminder-plan';

const nine = { hour: 21, minute: 0 };
const keys = (dates: Date[]) => dates.map((d) => `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}`);

describe('reminderTriggers', () => {
  it('schedules today and the next six days at the chosen time', () => {
    const result = reminderTriggers(new Date(2026, 9, 20, 10, 0), nine, new Set());
    expect(keys(result)).toEqual(['10/20 21:0', '10/21 21:0', '10/22 21:0', '10/23 21:0', '10/24 21:0', '10/25 21:0', '10/26 21:0']);
  });
  it('skips today once logged or once the time has passed', () => {
    expect(keys(reminderTriggers(new Date(2026, 9, 20, 10, 0), nine, new Set(['2026-10-20'])))[0]).toBe('10/21 21:0');
    expect(keys(reminderTriggers(new Date(2026, 9, 20, 21, 0), nine, new Set()))[0]).toBe('10/21 21:0');
  });
  it('skips logged future days and crosses month ends', () => {
    const result = reminderTriggers(new Date(2026, 9, 30, 22, 0), { hour: 8, minute: 30 }, new Set(['2026-11-01']));
    expect(keys(result)).toEqual(['10/31 8:30', '11/2 8:30', '11/3 8:30', '11/4 8:30', '11/5 8:30']);
  });
});
