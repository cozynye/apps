import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

/** App-wide persistent key-value store (PLAN 상태 경계 › MMKV). */
export const storage = createMMKV();

/** Adapter for zustand `persist`. */
export const mmkvStateStorage: StateStorage = {
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => {
    storage.remove(name);
  },
};
