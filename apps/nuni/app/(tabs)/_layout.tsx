import { CalendarBlankIcon, ChartBarIcon, GearSixIcon, TabBar, useTheme, type TabBarItem } from '@nf/ui';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useNotificationResponses } from '../../src/notification-responses';

/** Three tabs: A3 home, A6 stats, A10 settings. */
export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  // Mounted only after onboarding, with navigation ready, so a launch from a reminder can open A4.
  useNotificationResponses();
  const items: TabBarItem[] = [
    { name: 'a3-home', label: t('tabs.home'), Icon: CalendarBlankIcon, testID: 'tabs.home' },
    { name: 'a6-stats', label: t('tabs.stats'), Icon: ChartBarIcon, testID: 'tabs.stats' },
    { name: 'a10-settings', label: t('tabs.settings'), Icon: GearSixIcon, testID: 'tabs.settings' },
  ];
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // No tab cross-fade: QA saw the Settings scene stay blank after modals closed (iOS 26.2,
        // intermittent) with the fade on. Instant switch until that is understood (DECISIONS).
        animation: 'none',
        sceneStyle: { backgroundColor: colors.surface1 },
      }}
      tabBar={({ state, navigation }) => (
        <TabBar
          items={items}
          activeName={state.routes[state.index]?.name ?? 'a3-home'}
          onSelect={(name) => navigation.navigate(name)}
        />
      )}
    >
      <Tabs.Screen name="a3-home" />
      <Tabs.Screen name="a6-stats" />
      <Tabs.Screen name="a10-settings" />
    </Tabs>
  );
}
