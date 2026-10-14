import { recordError } from '@nf/analytics';
import { runMigrations, type MigrationResult } from '@nf/db';
import { migrations, openFourpopDatabase } from '@nf/db/fourpop';
import { create } from 'zustand';

/** The one app-wide connection (opened at module load; migrations run before the UI renders). */
export const { sqlite, db } = openFourpopDatabase();

export type DbStatus = 'pending' | MigrationResult['status'];

export const useDbStatus = create<{ status: DbStatus }>(() => ({ status: 'pending' }));

/** Runs migrations; read-only on failure (PLAN 예외 › DB 마이그레이션). */
export async function initDatabase(): Promise<MigrationResult> {
  const result = await runMigrations(sqlite, db, migrations);
  if (result.status === 'readonly') recordError(result.error, 'migration');
  useDbStatus.setState({ status: result.status });
  return result;
}
