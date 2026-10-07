/**
 * Entitlement decisions (PLAN 결제 코드 규약). Code checks entitlements, never product ids.
 * Mirror format (MMKV `rc.entitlements.v1`): { [entitlementId]: expiresAt (unix ms) | null }.
 * null = non-consumable (permanent). Subscriptions stay usable offline until expiresAt + 3 days.
 */
export type EntitlementMirror = Record<string, number | null>;

export const OFFLINE_GRACE_MS = 3 * 24 * 60 * 60 * 1000;

export interface ActiveEntitlementLike {
  identifier: string;
  expirationDate: string | null;
}

/** Converts RevenueCat `customerInfo.entitlements.active` into the mirror format. */
export function mirrorFromActive(active: Record<string, ActiveEntitlementLike>): EntitlementMirror {
  const mirror: EntitlementMirror = {};
  for (const info of Object.values(active)) {
    const expires = info.expirationDate ? Date.parse(info.expirationDate) : null;
    mirror[info.identifier] = expires !== null && Number.isFinite(expires) ? expires : null;
  }
  return mirror;
}

export interface EntitlementSnapshot {
  mirror: EntitlementMirror;
  /** True once CustomerInfo arrived this session: RevenueCat's active list is authoritative. */
  live: boolean;
}

export function isEntitled(snapshot: EntitlementSnapshot, entitlementId: string, now: number): boolean {
  if (!(entitlementId in snapshot.mirror)) return false;
  if (snapshot.live) return true; // RevenueCat keeps billing-retry users active; trust it online
  const expiresAt = snapshot.mirror[entitlementId];
  return expiresAt === null || expiresAt === undefined || now <= expiresAt + OFFLINE_GRACE_MS;
}

/**
 * Pack access (Fourpop): free packs, any pack for subscribers, or a pack bought on its own.
 * Bought packs stay usable after the subscription ends.
 */
export function canUsePack(
  snapshot: EntitlementSnapshot,
  pack: { free: boolean; entitlementId: string | null },
  premiumEntitlementId: string,
  now: number,
): boolean {
  if (pack.free) return true;
  if (isEntitled(snapshot, premiumEntitlementId, now)) return true;
  return pack.entitlementId !== null && isEntitled(snapshot, pack.entitlementId, now);
}
