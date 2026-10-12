import { formatDateNumeric } from '@nf/i18n';
import { useEntitlement } from '@nf/purchases';
import { Button, CaretLeftIcon, IconButton, Screen, SettingsRow, SettingsSection, space, Text, useToast } from '@nf/ui';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import {
  backupNow,
  BackupTooNewError,
  exportZip,
  isICloudAvailable,
  readBackupMeta,
  restoreBackup,
  useBackupState,
  type BackupMeta,
} from '../../src/backup';
import { useToday } from '../../src/today';

/** Settings › Backup (PLAN 라우트 `settings/backup`): iCloud backup/restore (Premium) and a free zip export. */
export default function BackupSettings() {
  const { t } = useTranslation();
  const toast = useToast();
  const premium = useEntitlement('mood_premium');
  const today = useToday();
  const lastBackupAt = useBackupState((s) => s.lastBackupAt);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [meta, setMeta] = useState<BackupMeta | null>(null);
  const [busy, setBusy] = useState<'backup' | 'restore' | 'export' | null>(null);

  useEffect(() => {
    if (!premium) return;
    void isICloudAvailable().then(async (ok) => {
      setAvailable(ok);
      if (ok) setMeta(await readBackupMeta().catch(() => null));
    });
  }, [premium, lastBackupAt]);

  async function onBackup() {
    setBusy('backup');
    try {
      await backupNow();
      toast(t('backup.done'), 'success');
    } catch {
      // A safety net, not a feature: a failure is only a toast (PLAN 예외 › iCloud 백업 불가).
      toast(t('error.generic'), 'error');
    } finally {
      setBusy(null);
    }
  }

  function onRestore() {
    Alert.alert(t('backup.restore'), t('backup.restoreConfirm'), [
      { text: t('action.cancel'), style: 'cancel' },
      {
        text: t('backup.restore'),
        style: 'destructive',
        onPress: () => {
          setBusy('restore');
          restoreBackup().catch((error: unknown) => {
            setBusy(null);
            toast(t(error instanceof BackupTooNewError ? 'error.updateRequired' : 'error.generic'), 'error');
          });
        },
      },
    ]);
  }

  async function onExport() {
    setBusy('export');
    try {
      const uri = await exportZip(today);
      await Sharing.shareAsync(uri, { mimeType: 'application/zip', UTI: 'public.zip-archive' });
    } catch {
      toast(t('error.generic'), 'error');
    } finally {
      setBusy(null);
    }
  }

  const backedUpAt = meta?.createdAt ?? lastBackupAt;

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton
          testID="backup.back"
          accessibilityLabel={t('action.back')}
          onPress={() => router.back()}
          renderIcon={(c) => <CaretLeftIcon size={24} color={c} />}
        />
        <Text variant="title">{t('settings.backup')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="bodySm" color="inkMuted" testID="backup.localOnly">
          {t('settings.localOnlyNotice')}
        </Text>

        <SettingsSection title={t('backup.title')} testID="backup.icloud">
          {!premium ? (
            <SettingsRow
              testID="backup.premium"
              label={t('paywall.title')}
              hint={t('backup.premiumHint')}
              onPress={() => router.push({ pathname: '/a9-paywall', params: { source: 'backup' } })}
            />
          ) : available === false ? (
            <SettingsRow testID="backup.signIn" label={t('backup.title')} hint={t('backup.signInHint')} />
          ) : (
            <View style={styles.block}>
              <Text variant="bodySm" color="inkMuted" testID="backup.last">
                {backedUpAt
                  ? t('backup.lastBackup', { date: formatDateNumeric(new Date(backedUpAt)) })
                  : t('backup.never')}
              </Text>
              <Button
                testID="backup.now"
                label={t('backup.backupNow')}
                loading={busy === 'backup'}
                disabled={available !== true || busy !== null}
                onPress={() => void onBackup()}
              />
              {meta && (
                <Button
                  testID="backup.restore"
                  variant="secondary"
                  label={t('backup.restore')}
                  loading={busy === 'restore'}
                  disabled={busy !== null}
                  onPress={onRestore}
                />
              )}
            </View>
          )}
        </SettingsSection>

        <SettingsSection title={t('export.title')}>
          <View style={styles.block}>
            <Text variant="bodySm" color="inkMuted">
              {t('export.hint')}
            </Text>
            <Button
              testID="backup.export"
              variant="secondary"
              label={t('settings.export')}
              loading={busy === 'export'}
              disabled={busy !== null}
              onPress={() => void onExport()}
            />
          </View>
        </SettingsSection>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space[2], paddingVertical: space[2] },
  content: { gap: space[6], paddingTop: space[4], paddingBottom: space[8] },
  block: { gap: space[3], padding: space[4] },
});
