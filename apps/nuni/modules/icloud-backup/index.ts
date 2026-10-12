import { requireNativeModule } from 'expo-modules-core';

interface ICloudBackupNative {
  isAvailable(): Promise<boolean>;
  readMeta(): Promise<string | null>;
  backup(dbPath: string, photosPath: string, metaJson: string): Promise<void>;
  restore(dbPath: string, photosPath: string): Promise<void>;
}

/** Local Expo module (Swift) for the iCloud Drive backup (PLAN 기술 스택 › 백업). */
export const ICloudBackup = requireNativeModule<ICloudBackupNative>('ICloudBackup');
