import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import type { ConfigContext, ExpoConfig } from 'expo/config';
import { withDangerousMod, withPodfile, type ConfigPlugin } from 'expo/config-plugins';

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

/**
 * Firebase Analytics + Crashlytics (P18), mirrored from apps/nuni/app.config.ts. The plist is a secret:
 * local file (gitignored) or the EAS file secret GOOGLE_SERVICES_PLIST_FOURPOP. Without it the app
 * builds without Firebase and events stay in the dev log (CLAUDE.md: missing keys must not break dev builds).
 */
const googleServicesFile = process.env.GOOGLE_SERVICES_PLIST_FOURPOP ?? './GoogleService-Info.plist';
const firebaseEnabled = existsSync(join(__dirname, googleServicesFile)) || existsSync(googleServicesFile);
const firebasePlugins: NonNullable<ExpoConfig['plugins']> = firebaseEnabled
  ? [
      '@react-native-firebase/app',
      // No IDFA: PLAN 분석 이벤트 › 광고 신호 비활성.
      ['@react-native-firebase/analytics', { ios: { withoutAdIdSupport: true } }],
      '@react-native-firebase/crashlytics',
      // RN Firebase resolves the Firebase SDK with SPM, which needs dynamic frameworks.
      ['expo-build-properties', { ios: { useFrameworks: 'dynamic' } }],
    ]
  : [];

/** Crashlytics' dSYM script reads `ios/GoogleService-Info.plist`; Expo puts the plist in `ios/<App>/`. */
const withCrashlyticsPlistCopy: ConfigPlugin = (config) =>
  withDangerousMod(config, [
    'ios',
    (c) => {
      const source = existsSync(googleServicesFile) ? googleServicesFile : join(__dirname, googleServicesFile);
      copyFileSync(source, join(c.modRequest.platformProjectRoot, 'GoogleService-Info.plist'));
      return c;
    },
  ]);

/** Debug builds skip the Crashlytics dSYM upload (stalls simulator builds); Release still uploads. */
const SKIP_DEBUG_UPLOAD = 'Skipping Crashlytics dSYM upload for Debug';
const withCrashlyticsDebugSkip: ConfigPlugin = (config) =>
  withPodfile(config, (c) => {
    if (c.modResults.contents.includes(SKIP_DEBUG_UPLOAD)) return c;
    c.modResults.contents += `
post_integrate do |installer|
  installer.aggregate_targets.map(&:user_project).uniq.each do |project|
    project.native_targets.each do |target|
      target.shell_script_build_phases.each do |phase|
        next unless phase.name.to_s.include?('[RNFB] Crashlytics Configuration')
        next if phase.shell_script.include?('${SKIP_DEBUG_UPLOAD}')
        phase.shell_script = "if [ \\"\${CONFIGURATION}\\" = \\"Debug\\" ]; then echo \\"${SKIP_DEBUG_UPLOAD}\\"; exit 0; fi\\n" + phase.shell_script
      end
    end
    project.save
  end
end
`;
    return c;
  });

/** app.json + permission strings (base en in Info.plist, vi/th/en via InfoPlist.strings) + splash + camera. */
export default ({ config }: ConfigContext): ExpoConfig => {
  const result: ExpoConfig = {
    ...(config as ExpoConfig),
    ios: {
      ...config.ios,
      ...(firebaseEnabled ? { googleServicesFile } : {}),
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
      ...firebasePlugins,
    ],
    extra: { ...config.extra, firebase: firebaseEnabled },
  };
  return firebaseEnabled ? withCrashlyticsDebugSkip(withCrashlyticsPlistCopy(result)) : result;
};
