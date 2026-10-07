import { storage } from '@nf/ui';
import { create } from 'zustand';

import { isEntitled, type EntitlementMirror, type EntitlementSnapshot } from './entitlements';

const MIRROR_KEY = 'rc.entitlements.v1';

function readMirror(): EntitlementMirror {
  try {
    const raw = storage.getString(MIRROR_KEY);
    return raw ? (JSON.parse(raw) as EntitlementMirror) : {};
  } catch {
    return {};
  }
}

interface EntitlementState extends EntitlementSnapshot {
  /** Purchases is configured (an API key exists). */
  enabled: boolean;
  setFromCustomerInfo: (mirror: EntitlementMirror) => void;
  setEnabled: (enabled: boolean) => void;
}

/** Entitlements in memory (Zustand), mirrored to MMKV for offline launches. */
export const useEntitlementStore = create<EntitlementState>()((set) => ({
  mirror: readMirror(),
  live: false,
  enabled: false,
  setFromCustomerInfo: (mirror) => {
    storage.set(MIRROR_KEY, JSON.stringify(mirror));
    set({ mirror, live: true });
  },
  setEnabled: (enabled) => set({ enabled }),
}));

/** Reactive entitlement check for UI locks. */
export function useEntitlement(entitlementId: string): boolean {
  return useEntitlementStore((s) => isEntitled(s, entitlementId, Date.now()));
}

/** Non-reactive check (event handlers, services). */
export function hasEntitlement(entitlementId: string): boolean {
  return isEntitled(useEntitlementStore.getState(), entitlementId, Date.now());
}
