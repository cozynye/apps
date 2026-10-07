import type { ConfigContext, ExpoConfig } from 'expo/config';

import en from '../../packages/i18n/permissions/nuni/en.json';

const PERMISSIONS = '../../packages/i18n/permissions/nuni';

/** app.json + permission strings (base en in Info.plist, vi/th/en via InfoPlist.strings). */
export default ({ config }: ConfigContext): ExpoConfig => ({
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
});
