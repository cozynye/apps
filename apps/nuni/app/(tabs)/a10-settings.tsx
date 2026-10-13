import { LANGUAGE_AUTONYMS, SUPPORTED_LANGUAGES } from '@nf/i18n';
import { restorePurchases, showManageSubscriptions, useEntitlement } from '@nf/purchases';
import {
  Screen,
  Segment,
  SettingsRow,
  SettingsSection,
  space,
  Text,
  useSettings,
  useTheme,
  useToast,
  type Appearance,
} from '@nf/ui';
import { nativeApplicationVersion } from 'expo-application';
import * as Clipboard from 'expo-clipboard';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { useAppState } from '../../src/app-state';
import { TimePicker } from '../../src/components/TimePicker';
import { deleteAllData } from '../../src/entries';
import { anonymousInstallId, firebaseEnabled } from '../../src/firebase';
import { requestReminderPermission, useReminderSettings } from '../../src/reminders';

const SUPPORT_EMAIL = 'nunicozy@gmail.com';

/** A10 settings (PLAN 화면 목록). */
export default function SettingsScreen() {
  const { t } = useTranslation();
  const { colors, accent } = useTheme();
  const toast = useToast();
  const premium = useEntitlement('mood_premium');
  const settings = useSettings();
  const reminder = useReminderSettings();
  const [notificationsAllowed, setNotificationsAllowed] = useNotificationPermission();
  const [restoring, setRestoring] = useState(false);

  const switchColors = {
    trackColor: { true: accent.deep, false: colors.surface2 },
    ios_backgroundColor: colors.surface2,
  };

  function pickLanguage() {
    const options = [
      t('settings.languageSystem'),
      ...SUPPORTED_LANGUAGES.map((l) => LANGUAGE_AUTONYMS[l]),
      t('action.cancel'),
    ];
    ActionSheetIOS.showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1, title: t('settings.language') },
      (index) => {
        if (index === 0) settings.setLanguage(null);
        else if (index <= SUPPORTED_LANGUAGES.length) settings.setLanguage(SUPPORTED_LANGUAGES[index - 1]!);
      },
    );
  }

  // `enabled` is the user's choice. If iOS permission is denied it stays on, so the row explains
  // why nothing arrives and offers Open Settings (PLAN 예외 › 알림 권한 거부); scheduling skips
  // until permission is granted.
  async function toggleReminder(on: boolean) {
    reminder.setEnabled(on);
    if (on) setNotificationsAllowed(await requestReminderPermission());
  }

  async function restore() {
    setRestoring(true);
    const outcome = await restorePurchases();
    setRestoring(false);
    if (outcome === 'restored') toast(t('settings.restoreSuccess'), 'success');
    else if (outcome === 'none') toast(t('settings.restoreNone'));
    else toast(t('error.generic'), 'error');
  }

  // Privacy policy §6: users send this ID to have their analytics/crash data deleted.
  async function copyInstallId() {
    const id = await anonymousInstallId().catch(() => null);
    if (!id) return toast(t('error.generic'), 'error');
    await Clipboard.setStringAsync(id);
    toast(t('settings.copied'), 'success');
  }

  function confirmDelete() {
    Alert.alert(t('settings.deleteData'), t('settings.deleteDataConfirm'), [
      { text: t('action.cancel'), style: 'cancel' },
      {
        text: t('action.delete'),
        style: 'destructive',
        onPress: () =>
          void deleteAllData()
            .then(() => useAppState.setState({ reminderPrompted: false, streakCelebrated: false }))
            .catch(() => toast(t('error.generic'), 'error')),
      },
    ]);
  }

  return (
    <Screen edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <Text variant="displayLg" testID="a10.title">
          {t('settings.title')}
        </Text>

        <SettingsSection>
          <SettingsRow
            testID="a10.language"
            label={t('settings.language')}
            value={settings.language ? LANGUAGE_AUTONYMS[settings.language] : t('settings.languageSystem')}
            onPress={pickLanguage}
          />
          {/* The three options need the full row width (vi labels run long). */}
          <View style={styles.stackedRow}>
            <Text variant="body">{t('settings.appearance')}</Text>
            <Segment<Appearance>
              testID="a10.appearance"
              value={settings.appearance}
              onChange={settings.setAppearance}
              options={[
                { value: 'system', label: t('settings.appearanceSystem') },
                { value: 'light', label: t('settings.appearanceLight') },
                { value: 'dark', label: t('settings.appearanceDark') },
              ]}
            />
          </View>
        </SettingsSection>

        <SettingsSection title={t('settings.notifications')}>
          <SettingsRow
            testID="a10.reminder"
            label={t('onboarding.enableReminder')}
            hint={reminder.enabled && notificationsAllowed === false ? t('permission.notificationsOff') : undefined}
            accessory={
              <Switch
                testID="a10.reminderSwitch"
                accessibilityLabel={t('onboarding.enableReminder')}
                value={reminder.enabled}
                onValueChange={(on) => void toggleReminder(on)}
                {...switchColors}
              />
            }
          />
          {reminder.enabled && notificationsAllowed === false && (
            <SettingsRow
              testID="a10.openSettings"
              label={t('action.openSettings')}
              onPress={() => void Linking.openSettings()}
            />
          )}
          {reminder.enabled && (
            <SettingsRow
              testID="a10.reminderTime"
              label={t('onboarding.reminderTime')}
              accessory={
                <TimePicker
                  testID="a10.reminderTimePicker"
                  variant="compact"
                  value={{ hour: reminder.hour, minute: reminder.minute }}
                  onChange={reminder.setTime}
                />
              }
            />
          )}
        </SettingsSection>

        <SettingsSection>
          <SettingsRow
            testID="a10.lock"
            label={t('settings.appLock')}
            hint={t('settings.appLockHint')}
            onPress={() => router.push('/settings/lock')}
          />
          <SettingsRow
            testID="a10.backup"
            label={t('settings.backup')}
            hint={t('settings.localOnlyNotice')}
            onPress={() => router.push('/settings/backup')}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.subscription')}>
          {!premium && (
            <SettingsRow
              testID="a10.premium"
              label={t('paywall.title')}
              onPress={() => router.push({ pathname: '/a9-paywall', params: { source: 'settings' } })}
            />
          )}
          <SettingsRow
            testID="a10.manageSubscription"
            label={t('settings.manageSubscription')}
            onPress={() => void showManageSubscriptions()}
          />
          <SettingsRow
            testID="a10.restore"
            label={t('settings.restorePurchases')}
            accessory={restoring ? <ActivityIndicator color={colors.inkMuted} /> : undefined}
            onPress={restoring ? undefined : () => void restore()}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.privacy_section')}>
          <SettingsRow
            testID="a10.analytics"
            label={t('settings.analytics')}
            hint={t('settings.analyticsHint')}
            accessory={
              <Switch
                testID="a10.analyticsSwitch"
                accessibilityLabel={t('settings.analytics')}
                value={settings.analyticsEnabled}
                onValueChange={settings.setAnalyticsEnabled}
                {...switchColors}
              />
            }
          />
          {firebaseEnabled && (
            <SettingsRow
              testID="a10.copyId"
              label={t('settings.copyId')}
              hint={t('settings.copyIdHint')}
              onPress={() => void copyInstallId()}
            />
          )}
        </SettingsSection>

        <SettingsSection>
          <SettingsRow
            testID="a10.contact"
            label={t('settings.contact')}
            value={SUPPORT_EMAIL}
            onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          />
          <SettingsRow testID="a10.rate" label={t('settings.rate')} onPress={() => void StoreReview.requestReview()} />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow testID="a10.terms" label={t('settings.terms')} onPress={() => router.push('/a13-legal/terms')} />
          <SettingsRow
            testID="a10.privacy"
            label={t('settings.privacy')}
            onPress={() => router.push('/a13-legal/privacy')}
          />
          <SettingsRow
            testID="a10.licenses"
            label={t('settings.licenses')}
            onPress={() => router.push('/a13-legal/licenses')}
          />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow testID="a10.delete" label={t('settings.deleteData')} destructive onPress={confirmDelete} />
        </SettingsSection>

        <Text variant="caption" color="inkMuted" align="center" testID="a10.version">
          {t('settings.version', { version: nativeApplicationVersion ?? '' })}
        </Text>
      </ScrollView>
    </Screen>
  );
}

/** Notification permission, re-read when the app returns from iOS Settings. null = not known yet. */
function useNotificationPermission() {
  const [granted, setGranted] = useState<boolean | null>(null);
  useEffect(() => {
    const read = () => void Notifications.getPermissionsAsync().then((p) => setGranted(p.granted));
    read();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && read());
    return () => sub.remove();
  }, []);
  return [granted, setGranted] as const;
}

const styles = StyleSheet.create({
  content: { gap: space[6], paddingTop: space[4], paddingBottom: space[8] },
  stackedRow: { gap: space[3], padding: space[4] },
});
