import { recordError } from '@nf/analytics';
import { runMigrations, type MigrationResult } from '@nf/db';
import { migrations, openNuniDatabase, tags } from '@nf/db/nuni';
import { create } from 'zustand';

/** The one app-wide connection (opened at module load; migrations run before the UI renders). */
export const { sqlite, db } = openNuniDatabase();

/**
 * Default activity tags (PLAN 규칙 › 기본 태그 20종). Stable ids so seeding is idempotent;
 * icons are Phosphor Regular names.
 */
export const DEFAULT_TAGS = [
  ['sleep', 'Moon'],
  ['exercise', 'Barbell'],
  ['study', 'PencilSimple'],
  ['work', 'Briefcase'],
  ['friends', 'Users'],
  ['family', 'House'],
  ['partner', 'Heart'],
  ['food', 'ForkKnife'],
  ['cafe', 'Coffee'],
  ['shopping', 'ShoppingBag'],
  ['travel', 'Airplane'],
  ['games', 'GameController'],
  ['movies', 'FilmSlate'],
  ['music', 'MusicNotes'],
  ['reading', 'BookOpen'],
  ['weather', 'CloudSun'],
  ['photos', 'Camera'],
  ['chores', 'Broom'],
  ['health', 'FirstAidKit'],
  ['pray', 'HandsPraying'],
] as const;

export type DbStatus = 'pending' | MigrationResult['status'];

export const useDbStatus = create<{ status: DbStatus }>(() => ({ status: 'pending' }));

/** Runs migrations and seeds default tags. Read-only on failure (PLAN 예외 › DB 마이그레이션). */
export async function initDatabase(): Promise<MigrationResult> {
  const result = await runMigrations(sqlite, db, migrations);
  if (result.status === 'ok') {
    await db
      .insert(tags)
      .values(DEFAULT_TAGS.map(([key, icon], i) => ({ id: key, nameKey: `tags.${key}`, icon, sortOrder: i })))
      .onConflictDoNothing();
  }
  if (result.status === 'readonly') recordError(result.error, 'migration');
  useDbStatus.setState({ status: result.status });
  return result;
}
