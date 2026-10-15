import bundledJson from './generated/manifest.json';
import {
  buildCatalog,
  compareVersions,
  pickRemoteManifest,
  seasonBannerPack,
  shopPacks,
} from './merge';
import { parseManifest, type Manifest, type Pack } from './schema';

const bundled = parseManifest(bundledJson)!;

function seasonPack(id: string, extra: Partial<Pack> = {}): Pack {
  return {
    id,
    type: 'frame',
    productId: `booth_pack_${id}`,
    entitlementId: `booth_pack_${id}`,
    free: false,
    bundled: false,
    category: 'season',
    minAppVersion: '1.0.0',
    title: { en: id, vi: id, th: id },
    thumbnail: `packs/${id}/1/thumb.png`,
    items: [],
    ...extra,
  } as Pack;
}

function remote(version: number, packs: Pack[], minAppVersion = '1.0.0'): Manifest {
  return { schemaVersion: 1, version, minAppVersion, packs };
}

describe('bundled manifest', () => {
  it('matches the schema: base 10+22, pop 10+20, y2k 10+18', () => {
    expect(bundled).not.toBeNull();
    const counts = Object.fromEntries(bundled.packs.map((p) => [p.id, p.items.length]));
    expect(counts).toEqual({ base: 10, 'stickers-base': 22, pop: 10, 'stickers-pop': 20, y2k: 10, 'stickers-y2k': 18 });
  });

  it('rejects an unknown schemaVersion', () => {
    expect(parseManifest({ ...bundledJson, schemaVersion: 2 })).toBeNull();
  });
});

describe('compareVersions', () => {
  it('compares numerically', () => {
    expect(compareVersions('1.10.0', '1.9.9')).toBe(1);
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
  });
});

describe('pickRemoteManifest', () => {
  it('keeps the cached manifest unless the remote version is higher', () => {
    const cached = remote(5, []);
    expect(pickRemoteManifest(cached, remote(4, []))).toBe(cached);
    expect(pickRemoteManifest(cached, remote(5, []))).toBe(cached);
    expect(pickRemoteManifest(cached, remote(6, []))?.version).toBe(6);
    expect(pickRemoteManifest(cached, null)).toBe(cached);
    expect(pickRemoteManifest(null, null)).toBeNull();
  });
});

describe('buildCatalog', () => {
  it('uses bundled packs only when there is no CDN manifest', () => {
    const c = buildCatalog({ bundled, remote: null, installed: [], appVersion: '1.0.0' });
    expect(c.packs.map((p) => p.id)).toEqual(['base', 'stickers-base', 'pop', 'stickers-pop', 'y2k', 'stickers-y2k']);
    expect(c.updateRequired).toBe(false);
  });

  it('adds CDN packs and never replaces bundled ones', () => {
    const fakeBase = seasonPack('base');
    const c = buildCatalog({
      bundled,
      remote: remote(2, [seasonPack('tet'), fakeBase]),
      installed: [],
      appVersion: '1.0.0',
    });
    expect(c.packs.map((p) => p.id)).toEqual(['base', 'stickers-base', 'pop', 'stickers-pop', 'y2k', 'stickers-y2k', 'tet']);
    expect(c.packs[0]?.bundled).toBe(true);
  });

  it('hides packs that need a newer app and flags updateRequired', () => {
    const c = buildCatalog({
      bundled,
      remote: remote(2, [seasonPack('tet'), seasonPack('songkran', { minAppVersion: '1.2.0' })]),
      installed: [],
      appVersion: '1.1.9',
    });
    expect(c.packs.map((p) => p.id)).not.toContain('songkran');
    expect(c.updateRequired).toBe(true);
  });

  it('ignores the whole CDN manifest below its root minAppVersion', () => {
    const c = buildCatalog({ bundled, remote: remote(2, [seasonPack('tet')], '2.0.0'), installed: [], appVersion: '1.0.0' });
    expect(c.packs.map((p) => p.id)).toEqual(['base', 'stickers-base', 'pop', 'stickers-pop', 'y2k', 'stickers-y2k']);
    expect(c.updateRequired).toBe(true);
  });

  it('keeps installed packs that left the manifest', () => {
    const c = buildCatalog({ bundled, remote: remote(3, []), installed: [seasonPack('tet')], appVersion: '1.0.0' });
    expect(c.packs.map((p) => p.id)).toContain('tet');
  });
});

describe('shop and season banner', () => {
  const catalog = buildCatalog({
    bundled,
    remote: remote(2, [
      seasonPack('tet', { availableFrom: '2027-01-10', availableUntil: '2027-02-20' }),
      seasonPack('valentine', { availableFrom: '2027-02-01', availableUntil: '2027-02-15' }),
      seasonPack('xmas', { availableFrom: '2026-12-01', availableUntil: '2026-12-31' }),
    ]),
    installed: [],
    appVersion: '1.0.0',
  });

  it('lists packs in their window plus installed ones', () => {
    const ids = shopPacks(catalog, '2027-02-05', new Set(['xmas'])).map((p) => p.id);
    expect(ids).toEqual(['base', 'stickers-base', 'pop', 'stickers-pop', 'y2k', 'stickers-y2k', 'tet', 'valentine', 'xmas']);
    expect(shopPacks(catalog, '2027-03-01', new Set()).map((p) => p.id)).toEqual(['base', 'stickers-base', 'pop', 'stickers-pop', 'y2k', 'stickers-y2k']);
  });

  it('shows the latest season pack in its window, or none', () => {
    expect(seasonBannerPack(catalog, '2027-02-05')?.id).toBe('valentine');
    expect(seasonBannerPack(catalog, '2027-01-15')?.id).toBe('tet');
    expect(seasonBannerPack(catalog, '2027-03-01')).toBeNull();
  });
});
