import type { Language } from '@nf/i18n';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStateStorage } from './storage';

export type Appearance = 'system' | 'light' | 'dark';

/** Settings shared by both apps. App-specific settings live in each app. */
export interface SharedSettings {
  appearance: Appearance;
  /** null = follow the system language. */
  language: Language | null;
  /** Anonymous usage statistics (onboarding toggle, default ON). */
  analyticsEnabled: boolean;
  setAppearance: (appearance: Appearance) => void;
  setLanguage: (language: Language | null) => void;
  setAnalyticsEnabled: (enabled: boolean) => void;
}

export const useSettings = create<SharedSettings>()(
  persist(
    (set) => ({
      appearance: 'system',
      language: null,
      analyticsEnabled: true,
      setAppearance: (appearance) => set({ appearance }),
      setLanguage: (language) => set({ language }),
      setAnalyticsEnabled: (analyticsEnabled) => set({ analyticsEnabled }),
    }),
    { name: 'settings.v1', storage: createJSONStorage(() => mmkvStateStorage), version: 1 },
  ),
);
