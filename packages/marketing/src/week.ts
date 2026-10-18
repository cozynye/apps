/** ISO-8601 week helpers (UTC) and Indochina Time (UTC+7, Vietnam and Thailand) posting slots. */
const DAY = 86_400_000;
const ICT_OFFSET_MS = 7 * 60 * 60_000;

/** Posting slots in local time: morning scroll, lunch break, after dinner (research baseline; tune from insights). */
export const SLOTS = { morning: '07:30', noon: '12:30', evening: '20:00' } as const;
export type Slot = keyof typeof SLOTS;

/** '2026-W43' for any instant in that ISO week (weeks start Monday). */
export function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; // Mon=1 … Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - day); // the Thursday decides the year
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / DAY + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function isWeekId(s: string): boolean {
  return /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/.test(s);
}

/** Monday 00:00 UTC of the given ISO week. */
export function weekMonday(week: string): Date {
  const m = /^(\d{4})-W(\d{2})$/.exec(week);
  if (!m) throw new Error(`bad week id: ${week}`);
  const year = Number(m[1]);
  const wk = Number(m[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4)); // always in week 1
  const jan4Day = jan4.getUTCDay() || 7;
  return new Date(jan4.getTime() - (jan4Day - 1) * DAY + (wk - 1) * 7 * DAY);
}

/** The seven 'YYYY-MM-DD' dates of the week, Monday first. */
export function weekDates(week: string): string[] {
  const mon = weekMonday(week);
  return Array.from({ length: 7 }, (_, i) => new Date(mon.getTime() + i * DAY).toISOString().slice(0, 10));
}

export function nextWeek(week: string): string {
  return isoWeek(new Date(weekMonday(week).getTime() + 7 * DAY));
}

/** 'YYYY-MM-DDTHH:mm' in ICT → ISO instant. '2026-10-26T20:00' → '2026-10-26T13:00:00.000Z'. */
export function ictToUtc(localIso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(localIso);
  if (!m) throw new Error(`bad local time: ${localIso}`);
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5])) - ICT_OFFSET_MS;
  return new Date(t).toISOString();
}

/** Date + named slot → ISO instant. */
export function slotUtc(dateYmd: string, slot: Slot): string {
  return ictToUtc(`${dateYmd}T${SLOTS[slot]}`);
}

/** ISO instant → 'YYYY-MM-DD HH:mm' in ICT, for humans. */
export function utcToIct(iso: string): string {
  const d = new Date(new Date(iso).getTime() + ICT_OFFSET_MS);
  return d.toISOString().slice(0, 16).replace('T', ' ');
}
