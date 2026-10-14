import { LANGUAGE_AUTONYMS, SUPPORTED_LANGUAGES } from '@nf/i18n';
import { restorePurchases, showManageSubscriptions, useEntitlement } from '@nf/purchases';
import {
  CaretLeftIcon,
  IconButton,
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
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionSheetIOS, ActivityIndicator, Linking, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { PREMIUM } from '../src/catalog';
import { useBoothSettings } from '../src/settings';

const SUPPORT_EMAIL = 'nunicozy@gmail.com';

/** B12 settings (PLAN 화면 목록), opened from the B3 header gear. */
export default function SettingsScreen() {
  const { t } = useTranslation();
  const { colors, accent } = useTheme();
  const toast = useToast();
  const premium = useEntitlement(PREMIUM);
  const settings = useSettings();
  const booth = useBoothSettings();
  const [restoring, setRestoring] = useState(false);
  const switchColors = { trackColor: { true: accent.deep, false: colors.surface2 }, ios_backgroundColor: colors.surface2 };

  function pickLanguage() {
    const options = [t('settings.languageSystem'), ...SUPPORTED_LANGUAGES.map((l) => LANGUAGE_AUTONYMS[l]), t('action.cancel')];
    ActionSheetIOS.showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1, title: t('settings.language') },
      (index) => {
        if (index === 0) settings.setLanguage(null);
        else if (index <= SUPPORTED_LANGUAGES.length) settings.setLanguage(SUPPORTED_LANGUAGES[index - 1]!);
      },
    );
  }

  async function restore() {
    setRestoring(true);
    const outcome = await restorePurchases();
    setRestoring(false);
    if (outcome === 'restored') toast(t('settings.restoreSuccess'), 'success');
    else if (outcome === 'none') toast(t('settings.restoreNone'));
    else toast(t('error.generic'), 'error');
  }

  function setQuality(hd: boolean) {
    // HD is Premium (PLAN 기능 범위 › 저장 화질); free users go to the paywall instead.
    if (hd && !premium) return router.push({ pathname: '/b11-paywall', params: { source: 'hd' } });
    booth.set({ hd });
  }

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton
          testID="b12.back"
          accessibilityLabel={t('action.back')}
          onPress={() => router.back()}
          renderIcon={(c) => <CaretLeftIcon size={24} color={c} />}
        />
        <Text variant="title" testID="b12.title">
          {t('settings.title')}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsSection>
          <SettingsRow
            testID="b12.language"
            label={t('settings.language')}
            value={settings.language ? LANGUAGE_AUTONYMS[settings.language] : t('settings.languageSystem')}
            onPress={pickLanguage}
          />
          <View style={styles.stackedRow}>
            <Text variant="body">{t('settings.appearance')}</Text>
            <Segment<Appearance>
              testID="b12.appearance"
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

        <SettingsSection>
          <View style={styles.stackedRow}>
            <Text variant="body">{t('settings.saveQuality')}</Text>
            <Segment<'standard' | 'hd'>
              testID="b12.quality"
              value={premium && booth.hd ? 'hd' : 'standard'}
              onChange={(v) => setQuality(v === 'hd')}
              options={[
                { value: 'standard', label: t('result.standard', { size: '600×1800' }) },
                { value: 'hd', label: t('result.hdUpsell'), locked: !premium },
              ]}
            />
          </View>
          <SettingsRow
            testID="b12.shutter"
            label={t('settings.shutterSound')}
            accessory={
              <Switch
                testID="b12.shutterSwitch"
                accessibilityLabel={t('settings.shutterSound')}
                value={booth.shutterSound}
                onValueChange={(shutterSound) => booth.set({ shutterSound })}
                {...switchColors}
              />
            }
          />
          <SettingsRow
            testID="b12.mirror"
            label={t('settings.mirrorSelfie')}
            accessory={
              <Switch
                testID="b12.mirrorSwitch"
                accessibilityLabel={t('settings.mirrorSelfie')}
                value={booth.mirrorSelfie}
                onValueChange={(mirrorSelfie) => booth.set({ mirrorSelfie })}
                {...switchColors}
              />
            }
          />
        </SettingsSection>

        <SettingsSection title={t('settings.subscription')}>
          {!premium && (
            <SettingsRow
              testID="b12.premium"
              label={t('paywall.title')}
              onPress={() => router.push({ pathname: '/b11-paywall', params: { source: 'settings' } })}
            />
          )}
          <SettingsRow testID="b12.manageSubscription" label={t('settings.manageSubscription')} onPress={() => void showManageSubscriptions()} />
          <SettingsRow
            testID="b12.restore"
            label={t('settings.restorePurchases')}
            accessory={restoring ? <ActivityIndicator color={colors.inkMuted} /> : undefined}
            onPress={restoring ? undefined : () => void restore()}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.privacy_section')}>
          <SettingsRow
            testID="b12.analytics"
            label={t('settings.analytics')}
            hint={t('settings.analyticsHint')}
            accessory={
              <Switch
                testID="b12.analyticsSwitch"
                accessibilityLabel={t('settings.analytics')}
                value={settings.analyticsEnabled}
                onValueChange={settings.setAnalyticsEnabled}
                {...switchColors}
              />
            }
          />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow testID="b12.contact" label={t('settings.contact')} hint={SUPPORT_EMAIL} onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
          <SettingsRow testID="b12.terms" label={t('settings.terms')} onPress={() => router.push('/b13-legal/terms')} />
          <SettingsRow testID="b12.privacy" label={t('settings.privacy')} onPress={() => router.push('/b13-legal/privacy')} />
          <SettingsRow testID="b12.licenses" label={t('settings.licenses')} onPress={() => router.push('/b13-legal/licenses')} />
        </SettingsSection>

        <Text variant="caption" color="inkMuted" align="center" testID="b12.version">
          {t('settings.version', { version: nativeApplicationVersion ?? '' })}
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space[2], paddingVertical: space[2] },
  content: { gap: space[6], paddingTop: space[4], paddingBottom: space[8] },
  stackedRow: { gap: space[3], padding: space[4] },
});
