import { configureAnalytics, setAnalyticsEnabled, setAnalyticsLocale } from '@nf/analytics';
import { i18next } from '@nf/i18n';
import { configurePurchases } from '@nf/purchases';
import { AppProviders, useSettings, useTheme } from '@nf/ui';
import { nativeApplicationVersion } from 'expo-application';
import { Stack } from 'expo-router';

configurePurchases(process.env.EXPO_PUBLIC_RC_IOS_KEY_NUNI);
configureAnalytics({
  appVersion: nativeApplicationVersion ?? '0.0.0',
  enabled: useSettings.getState().analyticsEnabled,
});
useSettings.subscribe((s) => setAnalyticsEnabled(s.analyticsEnabled));
i18next.on('languageChanged', setAnalyticsLocale);

export default function RootLayout() {
  return (
    <AppProviders app="nuni">
      <RootStack />
    </AppProviders>
  );
}

function RootStack() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface1 } }}>
      <Stack.Screen name="a9-paywall" options={{ presentation: 'modal' }} />
      <Stack.Screen name="a13-legal/[doc]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
