import { canUsePack, isEntitled, mirrorFromActive, OFFLINE_GRACE_MS } from './entitlements';

const DAY = 24 * 60 * 60 * 1000;
const expires = Date.parse('2026-11-01T00:00:00Z');

describe('mirrorFromActive', () => {
  it('stores expiry for subscriptions and null for non-consumables', () => {
    expect(
      mirrorFromActive({
        mood_premium: { identifier: 'mood_premium', expirationDate: '2026-11-01T00:00:00Z' },
        booth_pack_tet_2027: { identifier: 'booth_pack_tet_2027', expirationDate: null },
      }),
    ).toEqual({ mood_premium: expires, booth_pack_tet_2027: null });
  });
});

describe('isEntitled', () => {
  const offline = { mirror: { mood_premium: expires, pack: null }, live: false };

  it('is false for unknown entitlements', () => {
    expect(isEntitled(offline, 'booth_premium', expires)).toBe(false);
  });

  it('keeps subscriptions offline until expiresAt + 3 days', () => {
    expect(isEntitled(offline, 'mood_premium', expires + OFFLINE_GRACE_MS)).toBe(true);
    expect(isEntitled(offline, 'mood_premium', expires + OFFLINE_GRACE_MS + 1)).toBe(false);
  });

  it('keeps non-consumables forever', () => {
    expect(isEntitled(offline, 'pack', expires + 1000 * DAY)).toBe(true);
  });

  it('trusts live CustomerInfo even past expiry (billing retry)', () => {
    expect(isEntitled({ ...offline, live: true }, 'mood_premium', expires + 10 * DAY)).toBe(true);
    expect(isEntitled({ mirror: {}, live: true }, 'mood_premium', expires)).toBe(false);
  });
});

describe('canUsePack', () => {
  const now = expires - DAY;
  const seasonPack = { free: false, entitlementId: 'booth_pack_tet_2027' };

  it('allows free packs to everyone', () => {
    expect(canUsePack({ mirror: {}, live: true }, { free: true, entitlementId: null }, 'booth_premium', now)).toBe(true);
  });

  it('allows any pack for subscribers', () => {
    expect(canUsePack({ mirror: { booth_premium: expires }, live: true }, seasonPack, 'booth_premium', now)).toBe(true);
  });

  it('keeps a bought pack after the subscription ends', () => {
    const snapshot = { mirror: { booth_pack_tet_2027: null }, live: true };
    expect(canUsePack(snapshot, seasonPack, 'booth_premium', now)).toBe(true);
    expect(canUsePack(snapshot, { free: false, entitlementId: 'booth_pack_other' }, 'booth_premium', now)).toBe(false);
  });
});
