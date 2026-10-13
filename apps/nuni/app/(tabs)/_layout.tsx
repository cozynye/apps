import { useTheme } from '@nf/ui';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';

import { useNotificationResponses } from '../../src/notification-responses';

/**
 * Three tabs: A3 home, A6 stats, A10 settings. Native UITabBarController (iOS 26 Liquid Glass,
 * system accessibility); on iPad iOS places it at the top (Cozy 2026-10-13, DECISIONS).
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  const { accent } = useTheme();
  // Mounted only after onboarding, with navigation ready, so a launch from a reminder can open A4.
  useNotificationResponses();
  return (
    <NativeTabs tintColor={accent.deep}>
      <NativeTabs.Trigger name="a3-home" testID="tabs.home">
        <NativeTabs.Trigger.Icon sf="calendar" />
        <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="a6-stats" testID="tabs.stats">
        <NativeTabs.Trigger.Icon sf="chart.bar" />
        <NativeTabs.Trigger.Label>{t('tabs.stats')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="a10-settings" testID="tabs.settings">
        <NativeTabs.Trigger.Icon sf="gearshape" />
        <NativeTabs.Trigger.Label>{t('tabs.settings')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
