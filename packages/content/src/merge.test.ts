import bundledJson from './generated/manifest.json';
import {
  buildCatalog,
  compareVersions,
  isAvailableOn,
  pickRemoteManifest,
  seasonBannerPack,
  shopPacks,
} from './merge';
import { parseManifest, type Manifest, type Pack } from './schema';

const bundled = parseManifest(bundledJson)!;
const BUNDLED_IDS = bundled.packs.map((p) => p.id);
/** Bundled packs visible on `today`: basics always, season packs only inside their window. */
const bundledOn = (today: string) => bundled.packs.filter((p) => isAvailableOn(p, today)).map((p) => p.id);

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
  it('matches the schema: base, pop, y2k and the five free season packs', () => {
    expect(bundled).not.toBeNull();
    const counts = Object.fromEntries(bundled.packs.map((p) => [p.id, p.items.length]));
    expect(counts).toEqual({
      base: 10,
      'stickers-base': 22,
      pop: 10,
      'stickers-pop': 20,
      y2k: 10,
      'stickers-y2k': 18,
      'halloween-2026': 6,
      'stickers-halloween-2026': 8,
      'xmas-2026': 6,
      'stickers-xmas-2026': 8,
      'tet-2027': 6,
      'stickers-tet-2027': 8,
      'valentine-2027': 6,
      'stickers-valentine-2027': 8,
      'songkran-2027': 6,
      'stickers-songkran-2027': 8,
    });
    for (const p of bundled.packs.filter((x) => x.category === 'season')) {
      expect(p.bundled && p.free && p.availableFrom && p.availableUntil).toBeTruthy();
    }
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
    expect(c.packs.map((p) => p.id)).toEqual(BUNDLED_IDS);
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
    expect(c.packs.map((p) => p.id)).toEqual([...BUNDLED_IDS, 'tet']);
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
    expect(c.packs.map((p) => p.id)).toEqual(BUNDLED_IDS);
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
    expect(ids).toEqual([...bundledOn('2027-02-05'), 'tet', 'valentine', 'xmas']);
    expect(shopPacks(catalog, '2027-03-01', new Set()).map((p) => p.id)).toEqual(bundledOn('2027-03-01'));
  });

  it('shows the latest season pack in its window, or none', () => {
    // Bundled Valentine 2027 opens on the same day as the remote one and comes first in catalogue order.
    expect(seasonBannerPack(catalog, '2027-02-05')?.id).toBe('valentine-2027');
    expect(seasonBannerPack(catalog, '2027-01-15')?.id).toBe('tet'); // bundled Tết opens 2027-01-16
    expect(seasonBannerPack(catalog, '2027-03-01')).toBeNull();
    expect(seasonBannerPack(catalog, '2026-10-20')?.id).toBe('halloween-2026');
  });
});
