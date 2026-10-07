import i18next, { type i18n as I18n } from 'i18next';
import { initReactI18next } from 'react-i18next';

import commonEn from './locales/common/en.json';
import commonTh from './locales/common/th.json';
import commonVi from './locales/common/vi.json';
import fourpopEn from './locales/fourpop/en.json';
import fourpopTh from './locales/fourpop/th.json';
import fourpopVi from './locales/fourpop/vi.json';
import nuniEn from './locales/nuni/en.json';
import nuniTh from './locales/nuni/th.json';
import nuniVi from './locales/nuni/vi.json';
import { FALLBACK_LANGUAGE, type Language } from './languages';

export type AppNamespace = 'nuni' | 'fourpop';

const resources = {
  en: { common: commonEn, nuni: nuniEn, fourpop: fourpopEn },
  vi: { common: commonVi, nuni: nuniVi, fourpop: fourpopVi },
  th: { common: commonTh, nuni: nuniTh, fourpop: fourpopTh },
} as const;

/**
 * Initializes the shared i18next instance for one app.
 * Keys resolve in the app namespace first, then `common` (e.g. t('paywall.legal')).
 */
export function initI18n(app: AppNamespace, language: Language): I18n {
  if (i18next.isInitialized) {
    void i18next.changeLanguage(language);
    return i18next;
  }
  void i18next.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: FALLBACK_LANGUAGE,
    ns: ['common', app],
    defaultNS: app,
    fallbackNS: 'common',
    interpolation: { escapeValue: false }, // React escapes
    returnNull: false,
    initAsync: false,
    saveMissing: __DEV__,
    missingKeyHandler: (_lngs, ns, key) => {
      console.warn(`[i18n] missing key ${ns}:${key}`);
    },
  });
  return i18next;
}

export { i18next };
