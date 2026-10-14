import type { ConfigContext, ExpoConfig } from 'expo/config';

import tokens from '../../design/tokens.json';
import en from '../../packages/i18n/permissions/fourpop/en.json';

const PERMISSIONS = '../../packages/i18n/permissions/fourpop';
// The config loader cannot import workspace .ts files, so read the token JSON directly.
const surface1 = tokens.color.tokens.find((t) => t.name === 'surface-1')!.value;

/** B1 splash: logo only on surface-1 (design/assets/splash/README.md). */
const splash = {
  image: './assets/splash/logo-light.png',
  imageWidth: 160,
  resizeMode: 'contain',
  backgroundColor: surface1.light,
  dark: { image: './assets/splash/logo-dark.png', backgroundColor: surface1.dark },
};

/** app.json + permission strings (base en in Info.plist, vi/th/en via InfoPlist.strings) + splash + camera. */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  ios: {
    ...config.ios,
    infoPlist: {
      ...config.ios?.infoPlist,
      ...en,
      // B8 share row shows a messenger only when it is installed (canOpenURL needs these listed).
      LSApplicationQueriesSchemes: ['zalo', 'fb-messenger', 'line', 'instagram'],
    },
  },
  locales: {
    en: `${PERMISSIONS}/en.json`,
    vi: `${PERMISSIONS}/vi.json`,
    th: `${PERMISSIONS}/th.json`,
  },
  plugins: [
    ...(config.plugins ?? []),
    ['expo-splash-screen', splash],
    // No video, so no microphone prompt (DECISIONS 2026-10-08); same camera text as Info.plist.
    ['expo-camera', { cameraPermission: en.NSCameraUsageDescription, microphonePermission: false, recordAudioAndroid: false }],
  ],
});
