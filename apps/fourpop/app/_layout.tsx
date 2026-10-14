import { configureAnalytics, recordError, setAnalyticsEnabled, setAnalyticsLocale } from '@nf/analytics';
import { i18next } from '@nf/i18n';
import { configurePurchases } from '@nf/purchases';
import { AppProviders, useSettings, useTheme } from '@nf/ui';
import { nativeApplicationVersion } from 'expo-application';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { initDatabase, useDbStatus } from '../src/db';

configurePurchases(process.env.EXPO_PUBLIC_RC_IOS_KEY_FOURPOP);
configureAnalytics({
  appVersion: nativeApplicationVersion ?? '0.0.0',
  enabled: useSettings.getState().analyticsEnabled,
});
useSettings.subscribe((s) => setAnalyticsEnabled(s.analyticsEnabled));
i18next.on('languageChanged', setAnalyticsLocale);

// Keep the B1 splash until the database is migrated; screens query it on first render.
void SplashScreen.preventAutoHideAsync();
initDatabase()
  .catch((error: Error) => {
    recordError(error, 'initDatabase');
    useDbStatus.setState({ status: 'readonly' });
  })
  .finally(() => void SplashScreen.hideAsync());

export default function RootLayout() {
  return (
    <AppProviders app="fourpop">
      <RootStack />
    </AppProviders>
  );
}

function RootStack() {
  const dbReady = useDbStatus((s) => s.status !== 'pending');
  if (!dbReady) return null;
  return <ReadyStack />;
}

function ReadyStack() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface1 } }}>
      <Stack.Screen name="b2-onboarding" options={{ gestureEnabled: false, animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
    </Stack>
  );
}
