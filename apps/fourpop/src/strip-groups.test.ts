import type { Strip } from '@nf/db/fourpop';

import { groupStripsByDate } from './strip-groups';

const strip = (id: string, createdAt: number): Strip => ({
  id,
  createdAt,
  layout: 'strip4',
  frameId: 'base-classic',
  packId: 'base',
  filter: 'original',
  hd: false,
  fileName: `${id}.jpg`,
  thumbName: `${id}-thumb.jpg`,
  width: 600,
  height: 1800,
});

// Dates via a fixed mapping so the test does not depend on the machine time zone.
const toDate = (ms: number) => `2026-10-${String(Math.floor(ms / 100)).padStart(2, '0')}`;

test('groups newest-first rows by day, keeping order inside a day', () => {
  const rows = [strip('c', 1402), strip('b', 1401), strip('a', 1300)];
  expect(groupStripsByDate(rows, toDate)).toEqual([
    { date: '2026-10-14', strips: [rows[0], rows[1]] },
    { date: '2026-10-13', strips: [rows[2]] },
  ]);
});

test('empty input gives no groups', () => {
  expect(groupStripsByDate([], toDate)).toEqual([]);
});
