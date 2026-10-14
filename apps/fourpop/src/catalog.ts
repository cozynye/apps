import { recordError } from '@nf/analytics';
import {
  bundledAssets,
  bundledManifest,
  buildCatalog,
  loadRemoteManifest,
  type Catalog,
  type FrameItem,
  type FramePack,
  type Pack,
  type StickerPack,
} from '@nf/content';
import { installedPacks } from '@nf/db/fourpop';
import { canUsePack, useEntitlementStore } from '@nf/purchases';
import { nativeApplicationVersion } from 'expo-application';
import type { ImageSourcePropType } from 'react-native';
import { create } from 'zustand';

import { db } from './db';

export const PREMIUM = 'booth_premium';
const CDN = process.env.EXPO_PUBLIC_CDN_BASE_URL;

interface CatalogState extends Catalog {
  offline: boolean;
}

/** Usable packs: bundled, then CDN (P19, when configured), then installed (PLAN 콘텐츠 매니페스트). */
export const useCatalog = create<CatalogState>(() => ({
  ...buildCatalog({ bundled: bundledManifest, remote: null, installed: [], appVersion: '0.0.0' }),
  offline: false,
}));

/** App start: CDN manifest once (ETag), installed packs from SQLite, then merge. */
export async function loadCatalog() {
  const loaded = await loadRemoteManifest(CDN, (error) => recordError(error, 'manifest'));
  const rows = await db.select().from(installedPacks);
  const installed = rows.flatMap((row) => {
    try {
      return [JSON.parse(row.manifestJson) as Pack];
    } catch {
      return [];
    }
  });
  const catalog = buildCatalog({
    bundled: bundledManifest,
    remote: loaded.remote,
    installed,
    appVersion: nativeApplicationVersion ?? '0.0.0',
  });
  useCatalog.setState({ ...catalog, offline: Boolean(CDN) && loaded.source === 'cache' });
}

export const framePacks = (packs: Pack[]) => packs.filter((p): p is FramePack => p.type === 'frame');
export const stickerPacks = (packs: Pack[]) => packs.filter((p): p is StickerPack => p.type === 'sticker');

export interface FrameRef {
  pack: FramePack;
  item: FrameItem;
}

export function findFrame(packs: Pack[], frameId: string): FrameRef | null {
  for (const pack of framePacks(packs)) {
    const item = pack.items.find((i) => i.id === frameId);
    if (item) return { pack, item };
  }
  return null;
}

/** Bundled images resolve to require() modules, CDN images to their immutable URL. */
export function imageSource(path: string): ImageSourcePropType {
  const bundled = bundledAssets[path];
  if (bundled !== undefined) return bundled;
  return { uri: `${(CDN ?? '').replace(/\/$/, '')}/${path}` };
}

/** Reactive pack access: free, Premium, or bought on its own. */
export function useCanUse(pack: Pick<Pack, 'free' | 'entitlementId'>): boolean {
  return useEntitlementStore((s) => canUsePack(s, pack, PREMIUM, Date.now()));
}
