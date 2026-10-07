import { initI18n, resolveLanguage, type AppNamespace } from '@nf/i18n';
import { getLocales } from 'expo-localization';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from './components/Toast';
import { useSettings } from './settings';
import { ThemeProvider, useTheme } from './theme';

function currentLanguage(preferred: string | null) {
  return resolveLanguage({
    forced: process.env.EXPO_PUBLIC_FORCE_LOCALE,
    preferred,
    deviceLanguageCodes: getLocales().map((l) => l.languageCode),
  });
}

/**
 * Root providers shared by both apps: i18n (follows the language setting), theme, safe area,
 * toast, and a status bar that follows the active scheme.
 */
export function AppProviders({ app, children }: { app: AppNamespace; children: ReactNode }) {
  const preferred = useSettings((s) => s.language);
  const [i18n] = useState(() => initI18n(app, currentLanguage(preferred)));

  useEffect(() => {
    const next = currentLanguage(preferred);
    if (i18n.language !== next) void i18n.changeLanguage(next);
  }, [i18n, preferred]);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider app={app}>
        <SafeAreaProvider>
          <ToastProvider>
            <SchemeStatusBar />
            {children}
          </ToastProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

function SchemeStatusBar() {
  const { scheme } = useTheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}
