import { toLocalDateString } from '@nf/i18n';
import { mmkvStateStorage } from '@nf/ui';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Nuni app flags kept in MMKV (PLAN 상태 경계: 온보딩 완료 플래그, 설치일). */
interface AppState {
  onboarded: boolean;
  /**
   * Local date of the first launch (first persisted when onboarding completes, which is the only
   * way into the app). A3 shows days before it as plain numbers.
   */
  installDate: string;
  /** A12 shows once, right after the first saved entry. */
  reminderPrompted: boolean;
  /** The 3-day streak sheet shows once (PLAN 사용자 플로우 4). */
  streakCelebrated: boolean;
  completeOnboarding: () => void;
}

export const useAppState = create<AppState>()(
  persist(
    (set) => ({
      onboarded: false,
      installDate: toLocalDateString(new Date()),
      reminderPrompted: false,
      streakCelebrated: false,
      completeOnboarding: () => set({ onboarded: true }),
    }),
    { name: 'app.v1', storage: createJSONStorage(() => mmkvStateStorage), version: 1 },
  ),
);
