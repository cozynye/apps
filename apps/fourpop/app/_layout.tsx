import { configureAnalytics, recordError, setAnalyticsEnabled, setAnalyticsLocale } from '@nf/analytics';
import { i18next } from '@nf/i18n';
import { configurePurchases } from '@nf/purchases';
import { AppProviders, radius, useSettings, useTheme } from '@nf/ui';
import { nativeApplicationVersion } from 'expo-application';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { loadCatalog } from '../src/catalog';
import { cleanTemp } from '../src/compose';
import { initDatabase, useDbStatus } from '../src/db';
import { clearSessionFiles } from '../src/session';

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
  // The catalog reads installed_packs, so it loads after migrations.
  .then(() => void loadCatalog().catch((error: Error) => recordError(error, 'loadCatalog')))
  .catch((error: Error) => {
    recordError(error, 'initDatabase');
    useDbStatus.setState({ status: 'readonly' });
  })
  .finally(() => void SplashScreen.hideAsync());
// Leftovers from an interrupted session.
cleanTemp();
clearSessionFiles();

/** B4: bottom sheet on iPhone, centered form sheet on iPad. */
const FRAME_SHEET = {
  presentation: 'formSheet' as const,
  sheetGrabberVisible: true,
  sheetAllowedDetents: [0.92],
  sheetCornerRadius: radius.lg,
};

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
      <Stack.Screen name="b4-frames" options={FRAME_SHEET} />
      <Stack.Screen name="booth" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
      <Stack.Screen name="b11-paywall" options={{ presentation: 'modal' }} />
      <Stack.Screen name="b12-settings" />
      <Stack.Screen name="b13-legal/[doc]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
