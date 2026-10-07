import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import type { SQLiteDatabase } from 'expo-sqlite';

export interface MigrationBundle {
  journal: {
    version: string;
    dialect: string;
    entries: { idx: number; version: string; when: number; tag: string; breakpoints: boolean }[];
  };
  migrations: Record<string, string>;
}

export type MigrationResult =
  | { status: 'ok'; schemaVersion: number }
  /** Migration failed and was rolled back; the DB is left untouched and opened read-only. */
  | { status: 'readonly'; schemaVersion: number; error: Error };

/** Schema version = number of migrations the bundle defines (used in backup meta.json). */
export function bundleSchemaVersion(bundle: MigrationBundle): number {
  return bundle.journal.entries.length;
}

/** Number of migrations already applied to this database file. */
export function appliedSchemaVersion(sqlite: SQLiteDatabase): number {
  const table = sqlite.getFirstSync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = '__drizzle_migrations'",
  );
  if (!table) return 0;
  return sqlite.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM __drizzle_migrations')?.n ?? 0;
}

function directoryOf(path: string): string {
  return path.slice(0, path.lastIndexOf('/'));
}

/**
 * Forward-only migrations (PLAN 예외 상황 › DB 마이그레이션).
 * Before applying pending migrations to an existing DB, snapshots it with
 * `VACUUM INTO 'backup-<version>.db'` next to the DB file. Drizzle runs all pending migrations in
 * one transaction, so a failure rolls back; the app then continues read-only (`query_only`).
 */
export async function runMigrations(
  sqlite: SQLiteDatabase,
  db: ExpoSQLiteDatabase<Record<string, unknown>>,
  bundle: MigrationBundle,
): Promise<MigrationResult> {
  const target = bundleSchemaVersion(bundle);
  const applied = appliedSchemaVersion(sqlite);

  if (applied > 0 && applied < target) {
    const backup = `${directoryOf(sqlite.databasePath)}/backup-${applied}.db`;
    try {
      sqlite.execSync(`VACUUM INTO '${backup.replace(/'/g, "''")}'`);
    } catch (error) {
      // An earlier attempt already wrote this version's snapshot; keep it.
      if (!String(error).includes('exists')) throw error;
    }
  }

  try {
    await migrate(db, bundle);
    return { status: 'ok', schemaVersion: target };
  } catch (error) {
    sqlite.execSync('PRAGMA query_only = ON;');
    return {
      status: 'readonly',
      schemaVersion: appliedSchemaVersion(sqlite),
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
