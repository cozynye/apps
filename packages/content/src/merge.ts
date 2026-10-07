import type { Manifest, Pack } from './schema';

/** Numeric dotted-version compare: -1 if a < b, 0 if equal, 1 if a > b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

/**
 * Picks the CDN manifest to use: a remote one replaces the cached one only when its `version` is
 * higher (versions only go up). Invalid/unknown-schema remotes arrive here as null and are ignored.
 */
export function pickRemoteManifest(cached: Manifest | null, remote: Manifest | null): Manifest | null {
  if (!remote) return cached;
  if (!cached) return remote;
  return remote.version > cached.version ? remote : cached;
}

export interface CatalogInput {
  bundled: Manifest;
  /** Result of pickRemoteManifest (null = bundled only). */
  remote: Manifest | null;
  /** Packs recorded in installed_packs (usable even after leaving the manifest). */
  installed: Pack[];
  appVersion: string;
}

export interface Catalog {
  /** Every pack the app can use, bundled first. */
  packs: Pack[];
  /** Some pack (or the CDN manifest itself) needs a newer app; show `shop.updateApp`. */
  updateRequired: boolean;
}

/**
 * Builds the usable catalog (PLAN 앱 B › 콘텐츠 매니페스트):
 * bundled packs always; CDN packs unless the app is below the root or pack `minAppVersion`;
 * installed packs that are no longer in any manifest are kept from their stored JSON.
 */
export function buildCatalog({ bundled, remote, installed, appVersion }: CatalogInput): Catalog {
  const byId = new Map<string, Pack>();
  let updateRequired = false;

  for (const pack of bundled.packs) byId.set(pack.id, pack);

  if (remote) {
    if (compareVersions(appVersion, remote.minAppVersion) < 0) {
      updateRequired = true;
    } else {
      for (const pack of remote.packs) {
        if (byId.get(pack.id)?.bundled) continue; // bundled content is never replaced remotely
        if (compareVersions(appVersion, pack.minAppVersion) < 0) {
          updateRequired = true;
          continue;
        }
        byId.set(pack.id, pack);
      }
    }
  }

  for (const pack of installed) {
    if (!byId.has(pack.id)) byId.set(pack.id, pack);
  }

  return { packs: [...byId.values()], updateRequired };
}

/** Within its availableFrom..availableUntil window on `today` ('YYYY-MM-DD'). */
export function isAvailableOn(pack: Pack, today: string): boolean {
  if (pack.availableFrom && today < pack.availableFrom.slice(0, 10)) return false;
  if (pack.availableUntil && today > pack.availableUntil.slice(0, 10)) return false;
  return true;
}

/** Packs listed in the shop: in their window, or already installed. */
export function shopPacks(catalog: Catalog, today: string, installedIds: ReadonlySet<string>): Pack[] {
  return catalog.packs.filter((p) => installedIds.has(p.id) || isAvailableOn(p, today));
}

/** Home season banner: the latest season pack (by availableFrom) inside its window, or null. */
export function seasonBannerPack(catalog: Catalog, today: string): Pack | null {
  const candidates = catalog.packs.filter((p) => p.category === 'season' && isAvailableOn(p, today));
  candidates.sort((a, b) => (b.availableFrom ?? '').localeCompare(a.availableFrom ?? ''));
  return candidates[0] ?? null;
}
