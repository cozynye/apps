import { configureAnalytics, recordError, setAnalyticsEnabled, setAnalyticsLocale } from '@nf/analytics';
import { i18next } from '@nf/i18n';
import { configurePurchases } from '@nf/purchases';
import { AppProviders, radius, useSettings, useTheme } from '@nf/ui';
import { nativeApplicationVersion } from 'expo-application';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { initDatabase, useDbStatus } from '../src/db';
import { cleanOrphanPhotos } from '../src/entries';
import { useReminderSync } from '../src/reminders';

configurePurchases(process.env.EXPO_PUBLIC_RC_IOS_KEY_NUNI);
configureAnalytics({
  appVersion: nativeApplicationVersion ?? '0.0.0',
  enabled: useSettings.getState().analyticsEnabled,
});
useSettings.subscribe((s) => setAnalyticsEnabled(s.analyticsEnabled));
i18next.on('languageChanged', setAnalyticsLocale);

// Keep the A1 splash until the database is migrated; screens query it on first render.
void SplashScreen.preventAutoHideAsync();
initDatabase()
  .then((result) => {
    if (result.status === 'ok') cleanOrphanPhotos().catch((e: Error) => recordError(e, 'cleanOrphanPhotos'));
  })
  .catch((error: Error) => {
    recordError(error, 'initDatabase');
    useDbStatus.setState({ status: 'readonly' });
  })
  .finally(() => void SplashScreen.hideAsync());

/**
 * A4/A5: bottom sheet on iPhone. On iPad a native form sheet is a centered modal (~540pt), which
 * stands in for the plan's 520pt center modal.
 */
const ENTRY_SHEET = {
  presentation: 'formSheet' as const,
  sheetGrabberVisible: true,
  sheetAllowedDetents: [0.92],
  sheetCornerRadius: radius.lg,
};

/** A12 and the streak sheet: short sheets sized to their content. */
const FIT_SHEET = {
  presentation: 'formSheet' as const,
  sheetGrabberVisible: true,
  sheetAllowedDetents: 'fitToContents' as const,
  sheetCornerRadius: radius.lg,
};

export default function RootLayout() {
  return (
    <AppProviders app="nuni">
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
  useReminderSync();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface1 } }}>
      <Stack.Screen name="a2-onboarding" options={{ gestureEnabled: false, animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="a4-entry" options={ENTRY_SHEET} />
      <Stack.Screen name="a5-entry/[date]" options={ENTRY_SHEET} />
      <Stack.Screen name="a12-reminder" options={FIT_SHEET} />
      <Stack.Screen name="streak-celebrate" options={FIT_SHEET} />
      <Stack.Screen name="a9-paywall" options={{ presentation: 'modal' }} />
      <Stack.Screen name="a13-legal/[doc]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
