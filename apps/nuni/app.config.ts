import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import type { ConfigContext, ExpoConfig } from 'expo/config';
import { withDangerousMod, withEntitlementsPlist, withPodfile, type ConfigPlugin } from 'expo/config-plugins';

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

/**
 * iCloud Drive backup (PLAN 기술 스택 › 백업): ubiquity container `iCloud.app.nuni.mood`, hidden from the
 * Files app. Device builds need the iCloud capability + this container on the App ID.
 */
const ICLOUD_CONTAINER = 'iCloud.app.nuni.mood';
const withICloudDocuments: ConfigPlugin = (config) =>
  withEntitlementsPlist(config, (c) => {
    c.modResults['com.apple.developer.icloud-container-identifiers'] = [ICLOUD_CONTAINER];
    c.modResults['com.apple.developer.ubiquity-container-identifiers'] = [ICLOUD_CONTAINER];
    c.modResults['com.apple.developer.icloud-services'] = ['CloudDocuments'];
    return c;
  });

/**
 * Firebase Analytics + Crashlytics (P18). The plist is a secret: local file (gitignored) or an EAS
 * file secret in GOOGLE_SERVICES_PLIST_NUNI. Without it the app builds without Firebase and events
 * stay in the dev log (CLAUDE.md: missing keys must not break dev builds).
 */
const googleServicesFile = process.env.GOOGLE_SERVICES_PLIST_NUNI ?? './GoogleService-Info.plist';
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

/**
 * RN Firebase's Crashlytics dSYM script (SPM path) reads `ios/GoogleService-Info.plist`, while Expo
 * places the plist in `ios/<App>/`. Copy it to the ios root as well so the build phase finds it.
 */
const withCrashlyticsPlistCopy: ConfigPlugin = (config) =>
  withDangerousMod(config, [
    'ios',
    (c) => {
      const source = existsSync(googleServicesFile) ? googleServicesFile : join(__dirname, googleServicesFile);
      copyFileSync(source, join(c.modRequest.platformProjectRoot, 'GoogleService-Info.plist'));
      return c;
    },
  ]);

/**
 * Debug builds skip the Crashlytics dSYM upload (it stalled simulator builds for 10+ minutes and
 * debug symbols are not needed); Release builds still upload. CocoaPods adds the RNFB script phase
 * during integration, so it is patched in `post_integrate`.
 */
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

/** app.json + permission strings (base en in Info.plist, vi/th/en via InfoPlist.strings) + splash. */
export default ({ config }: ConfigContext): ExpoConfig => {
  const result = withICloudDocuments(
    withoutPushEntitlement({
      ...(config as ExpoConfig),
      ios: {
        ...config.ios,
        ...(firebaseEnabled ? { googleServicesFile } : {}),
        infoPlist: {
          ...config.ios?.infoPlist,
          ...en,
          NSUbiquitousContainers: {
            [ICLOUD_CONTAINER]: {
              NSUbiquitousContainerIsDocumentScopePublic: false,
              NSUbiquitousContainerName: 'Nuni',
              NSUbiquitousContainerSupportedFolderLevels: 'None',
            },
          },
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
        // Same Face ID string as Info.plist so the plugin's default text never replaces it (DECISIONS 2026-10-08).
        ['expo-local-authentication', { faceIDPermission: en.NSFaceIDUsageDescription }],
        ...firebasePlugins,
      ],
      extra: { ...config.extra, firebase: firebaseEnabled },
    } as ExpoConfig),
  );
  return firebaseEnabled ? withCrashlyticsDebugSkip(withCrashlyticsPlistCopy(result)) : result;
};
