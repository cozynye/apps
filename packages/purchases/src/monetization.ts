/**
 * 1.0 ships free: no subscriptions, no packs for sale (Cozy 2026-10-15 — user acquisition first).
 * Purchase code stays and is switched on per build with EXPO_PUBLIC_MONETIZATION=on (v1.1, after the
 * business registration needed for the Paid Apps Agreement). When off, every entitlement is granted
 * and RevenueCat is never configured.
 */
export const MONETIZATION = process.env.EXPO_PUBLIC_MONETIZATION === 'on';
