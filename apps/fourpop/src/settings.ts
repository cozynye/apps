import { mmkvStateStorage } from '@nf/ui';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Fourpop settings (PLAN 상태 경계 › settings: 저장 화질, 셔터음; B12 미러 셀피 기본값). */
interface BoothSettings {
  /** Save in HD by default (Premium only; free users always get standard). */
  hd: boolean;
  shutterSound: boolean;
  mirrorSelfie: boolean;
  set: (patch: Partial<Pick<BoothSettings, 'hd' | 'shutterSound' | 'mirrorSelfie'>>) => void;
}

export const useBoothSettings = create<BoothSettings>()(
  persist(
    (set) => ({ hd: true, shutterSound: true, mirrorSelfie: true, set: (patch) => set(patch) }),
    { name: 'booth.settings.v1', storage: createJSONStorage(() => mmkvStateStorage), version: 1 },
  ),
);
