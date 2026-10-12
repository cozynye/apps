import { recordError } from '@nf/analytics';
import { bundleSchemaVersion } from '@nf/db';
import { entries, migrations, tags } from '@nf/db/nuni';
import { hasEntitlement } from '@nf/purchases';
import { mmkvStateStorage } from '@nf/ui';
import { nativeApplicationVersion } from 'expo-application';
import { Directory, File, Paths } from 'expo-file-system';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { zip } from 'react-native-zip-archive';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { ICloudBackup } from '../modules/icloud-backup';
import { db, sqlite } from './db';
import { photosDir } from './entries';

/** File URI → filesystem path for native APIs (handles %20 etc.). */
const toPath = (uri: string) => decodeURIComponent(uri.replace('file://', ''));

export interface BackupMeta {
  schemaVersion: number;
  appVersion: string;
  createdAt: number;
}

/** Last successful backup time (MMKV). */
export const useBackupState = create<{ lastBackupAt: number | null }>()(
  persist(() => ({ lastBackupAt: null as number | null }), {
    name: 'backup.v1',
    storage: createJSONStorage(() => mmkvStateStorage),
    version: 1,
  }),
);

/** Set after a restore: the old connection is closed, so the app must be relaunched. */
export const useRestartRequired = create<{ required: boolean }>(() => ({ required: false }));

export class BackupTooNewError extends Error {
  constructor() {
    super('backup schema is newer than this app');
  }
}

export function isICloudAvailable(): Promise<boolean> {
  return ICloudBackup.isAvailable().catch(() => false);
}

export async function readBackupMeta(): Promise<BackupMeta | null> {
  const json = await ICloudBackup.readMeta();
  return json ? (JSON.parse(json) as BackupMeta) : null;
}

/**
 * `VACUUM INTO` snapshot (no -wal/-shm) + photos/ + meta.json → ubiquity container Documents/
 * (PLAN 규칙 › iCloud 백업).
 */
export async function backupNow(): Promise<void> {
  const snapshot = new File(Paths.cache, 'backup.db');
  if (snapshot.exists) snapshot.delete();
  sqlite.execSync(`VACUUM INTO '${toPath(snapshot.uri).replace(/'/g, "''")}'`);
  const meta: BackupMeta = {
    schemaVersion: bundleSchemaVersion(migrations),
    appVersion: nativeApplicationVersion ?? '0.0.0',
    createdAt: Date.now(),
  };
  try {
    await ICloudBackup.backup(toPath(snapshot.uri), toPath(photosDir.uri), JSON.stringify(meta));
    useBackupState.setState({ lastBackupAt: meta.createdAt });
  } finally {
    snapshot.delete();
  }
}

/**
 * Replaces local data with the backup. Refuses a backup from a newer schema
 * (`error.updateRequired`). Closes the DB; the user must relaunch the app afterwards.
 */
export async function restoreBackup(): Promise<void> {
  const meta = await readBackupMeta();
  if (!meta) throw new Error('no backup');
  if (meta.schemaVersion > bundleSchemaVersion(migrations)) throw new BackupTooNewError();
  const dbPath = sqlite.databasePath;
  sqlite.closeSync();
  useRestartRequired.setState({ required: true });
  await ICloudBackup.restore(dbPath, toPath(photosDir.uri));
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * Backup is a safety net, not a chore: Premium users with iCloud get one automatically at most
 * once a day when the app comes to the foreground. Failures are only logged (PLAN 예외 › iCloud).
 */
export function useAutoBackup() {
  useEffect(() => {
    async function maybeBackup() {
      const last = useBackupState.getState().lastBackupAt;
      if (!hasEntitlement('mood_premium') || (last && Date.now() - last < DAY)) return;
      if (!(await isICloudAvailable())) return;
      await backupNow().catch((error: Error) => recordError(error, 'autoBackup'));
    }
    void maybeBackup();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && void maybeBackup());
    return () => sub.remove();
  }, []);
}

/** "Save a copy": export.json (entries + tags) + photos as a zip for the share sheet. Free. */
export async function exportZip(today: string): Promise<string> {
  const work = new Directory(Paths.cache, `nuni-export-${today}`);
  if (work.exists) work.delete();
  work.create({ intermediates: true });
  const [entryRows, tagRows] = await Promise.all([db.select().from(entries), db.select().from(tags)]);
  const links = await db.query.entryTags.findMany();
  const photoRows = await db.query.photos.findMany();
  new File(work, 'export.json').write(
    JSON.stringify(
      { exportedAt: new Date().toISOString(), entries: entryRows, tags: tagRows, entryTags: links, photos: photoRows },
      null,
      2,
    ),
  );
  if (photosDir.exists) await photosDir.copy(new Directory(work, 'photos'));
  const target = new File(Paths.cache, `nuni-export-${today}.zip`);
  if (target.exists) target.delete();
  await zip(toPath(work.uri), toPath(target.uri));
  work.delete();
  return target.uri;
}
