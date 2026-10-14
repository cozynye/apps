import { mmkvStateStorage } from '@nf/ui';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const DEFAULT_FRAME = 'base-classic';

/** The frame chosen on B3/B4 (remembered between launches; PLAN 사용자 플로우 1: 기본 Classic). */
export const useFrameChoice = create<{ frameId: string; setFrame: (id: string) => void }>()(
  persist((set) => ({ frameId: DEFAULT_FRAME, setFrame: (frameId) => set({ frameId }) }), {
    name: 'booth.frame.v1',
    storage: createJSONStorage(() => mmkvStateStorage),
    version: 1,
  }),
);
