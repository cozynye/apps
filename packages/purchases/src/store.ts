import { storage } from '@nf/ui';
import { create } from 'zustand';

import { isEntitled, type EntitlementMirror, type EntitlementSnapshot } from './entitlements';
import { MONETIZATION } from './monetization';

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

/** Reactive entitlement check for UI locks (always true while monetization is off). */
export function useEntitlement(entitlementId: string): boolean {
  const entitled = useEntitlementStore((s) => isEntitled(s, entitlementId, Date.now()));
  return !MONETIZATION || entitled;
}

/** Non-reactive check (event handlers, services). */
export function hasEntitlement(entitlementId: string): boolean {
  return !MONETIZATION || isEntitled(useEntitlementStore.getState(), entitlementId, Date.now());
}
