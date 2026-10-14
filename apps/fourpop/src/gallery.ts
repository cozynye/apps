import { strips, type Strip } from '@nf/db/fourpop';
import { toLocalDateString } from '@nf/i18n';
import { desc } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import { db } from './db';
import { groupStripsByDate, type StripGroup } from './strip-groups';

export type { StripGroup } from './strip-groups';

/** Live gallery rows (re-runs when strips are added or deleted). */
export function useStrips(): Strip[] {
  const { data } = useLiveQuery(db.select().from(strips).orderBy(desc(strips.createdAt)));
  return data;
}

export function useStripGroups(): StripGroup[] {
  const rows = useStrips();
  return useMemo(() => groupStripsByDate(rows, (ms) => toLocalDateString(new Date(ms))), [rows]);
}
