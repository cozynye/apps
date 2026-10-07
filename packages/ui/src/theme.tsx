import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme, type ViewStyle } from 'react-native';

import { colors, type Colors } from './generated/tokens';
import { useSettings } from './settings';

export type AppId = 'nuni' | 'fourpop';
export type Scheme = 'light' | 'dark';

/** The app's own accent family (DESIGN_SYSTEM ‘두 앱의 차이’). */
export interface Accent {
  primary: string;
  soft: string;
  deep: string;
  secondary: string;
}

export interface Theme {
  app: AppId;
  scheme: Scheme;
  colors: Colors;
  accent: Accent;
  /** `shadow-float`: only for elements that float (FAB, shutter). */
  shadowFloat: ViewStyle;
}

const AppContext = createContext<AppId>('nuni');

export function ThemeProvider({ app, children }: { app: AppId; children: ReactNode }) {
  return <AppContext.Provider value={app}>{children}</AppContext.Provider>;
}

export function resolveScheme(
  appearance: 'system' | Scheme,
  system: string | null | undefined,
): Scheme {
  if (appearance !== 'system') return appearance;
  return system === 'dark' ? 'dark' : 'light';
}

export function buildTheme(app: AppId, scheme: Scheme): Theme {
  const c: Colors = colors[scheme];
  const accent: Accent =
    app === 'nuni'
      ? { primary: c.nuniPrimary, soft: c.nuniSoft, deep: c.nuniDeep, secondary: c.nuniLavender }
      : { primary: c.fourpopPrimary, soft: c.fourpopSoft, deep: c.fourpopDeep, secondary: c.fourpopMint };
  // Manual mapping of the CSS shadow token (DESIGN_SYSTEM ‘소비 방법’).
  const shadowFloat: ViewStyle = {
    shadowColor: scheme === 'dark' ? '#000' : c.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: scheme === 'dark' ? 0.4 : 0.08,
    shadowRadius: 16,
    elevation: 4,
  };
  return { app, scheme, colors: c, accent, shadowFloat };
}

export function useTheme(): Theme {
  const app = useContext(AppContext);
  const appearance = useSettings((s) => s.appearance);
  const system = useColorScheme();
  const scheme = resolveScheme(appearance, system);
  return useMemo(() => buildTheme(app, scheme), [app, scheme]);
}
