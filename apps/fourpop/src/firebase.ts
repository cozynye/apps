/* eslint-disable @typescript-eslint/no-require-imports -- native modules load only in Firebase builds */
import type { AnalyticsTransport } from '@nf/analytics';
import Constants from 'expo-constants';

/** True when this build includes Firebase (GoogleService-Info.plist present at prebuild, P18). */
export const firebaseEnabled = Constants.expoConfig?.extra?.firebase === true;

type AnalyticsModule = typeof import('@react-native-firebase/analytics');
type CrashlyticsModule = typeof import('@react-native-firebase/crashlytics');

function modules(): { analytics: AnalyticsModule; crashlytics: CrashlyticsModule } | null {
  if (!firebaseEnabled) return null;
  return {
    analytics: require('@react-native-firebase/analytics'),
    crashlytics: require('@react-native-firebase/crashlytics'),
  };
}

/**
 * Firebase transport for @nf/analytics (same contract as Nuni's apps/nuni/src/firebase.ts). Analytics
 * follows the consent toggle; Crashlytics stays on (legitimate interest per the privacy policy).
 * Returns undefined when Firebase is not in this build, which keeps the dev-log transport.
 */
export function firebaseTransport(): AnalyticsTransport | undefined {
  const m = modules();
  if (!m) return undefined;
  const analytics = m.analytics.getAnalytics();
  const crashlytics = m.crashlytics.getCrashlytics();
  return {
    logEvent: (name, params) => {
      if (__DEV__) console.log(`[analytics] ${name}`, params);
      void m.analytics.logEvent(analytics, name, params);
    },
    setCollectionEnabled: (enabled) => void m.analytics.setAnalyticsCollectionEnabled(analytics, enabled),
    recordError: (error, context) => {
      if (context) m.crashlytics.log(crashlytics, context);
      m.crashlytics.recordError(crashlytics, error);
    },
  };
}

/** Anonymous installation ID for Settings › Privacy › Copy ID (privacy policy §6). */
export async function anonymousInstallId(): Promise<string | null> {
  const m = modules();
  if (!m) return null;
  return m.analytics.getAppInstanceId(m.analytics.getAnalytics());
}
