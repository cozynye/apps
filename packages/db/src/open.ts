import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

export interface Database<TSchema extends Record<string, unknown>> {
  sqlite: SQLiteDatabase;
  db: ExpoSQLiteDatabase<TSchema>;
}

/** Opens (or creates) an app database with the connection pragmas from the plan. */
export function openDatabase<TSchema extends Record<string, unknown>>(
  fileName: string,
  schema: TSchema,
): Database<TSchema> {
  const sqlite = openDatabaseSync(fileName);
  sqlite.execSync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  return { sqlite, db: drizzle(sqlite, { schema }) };
}
