import type { ConfigContext, ExpoConfig } from 'expo/config';
import { withEntitlementsPlist, type ConfigPlugin } from 'expo/config-plugins';

import en from '../../packages/i18n/permissions/nuni/en.json';
import tokens from '../../design/tokens.json';

const PERMISSIONS = '../../packages/i18n/permissions/nuni';
// The config loader cannot import workspace .ts files, so read the token JSON directly.
const surface1 = tokens.color.tokens.find((t) => t.name === 'surface-1')!.value;

/** A1 splash: logo only on surface-1 (design/assets/splash/README.md). */
const splash = {
  image: './assets/splash/logo-light.png',
  imageWidth: 160,
  resizeMode: 'contain',
  backgroundColor: surface1.light,
  dark: { image: './assets/splash/logo-dark.png', backgroundColor: surface1.dark },
};

/**
 * Reminders are local notifications only (PLAN 리마인더). expo-notifications' auto plugin adds the
 * push entitlement, which would require the Push capability for nothing; drop it.
 */
const withoutPushEntitlement: ConfigPlugin = (config) =>
  withEntitlementsPlist(config, (c) => {
    delete c.modResults['aps-environment'];
    return c;
  });

/** app.json + permission strings (base en in Info.plist, vi/th/en via InfoPlist.strings) + splash. */
export default ({ config }: ConfigContext): ExpoConfig =>
  withoutPushEntitlement({
    ...(config as ExpoConfig),
    ios: {
      ...config.ios,
      infoPlist: { ...config.ios?.infoPlist, ...en },
    },
    locales: {
      en: `${PERMISSIONS}/en.json`,
      vi: `${PERMISSIONS}/vi.json`,
      th: `${PERMISSIONS}/th.json`,
    },
    plugins: [
      ...(config.plugins ?? []),
      ['expo-splash-screen', splash],
      // Same Face ID string as Info.plist so the plugin's default text never replaces it (DECISIONS 2026-10-08).
      ['expo-local-authentication', { faceIDPermission: en.NSFaceIDUsageDescription }],
    ],
  } as ExpoConfig);
