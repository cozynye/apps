import { recordError } from '@nf/analytics';
import {
  bundledAssets,
  bundledManifest,
  buildCatalog,
  fileName,
  loadRemoteManifest,
  packFiles,
  type Catalog,
  type FrameItem,
  type FramePack,
  type Manifest,
  type Pack,
  type StickerPack,
} from '@nf/content';
import { installedPacks } from '@nf/db/fourpop';
import { canUsePack, MONETIZATION, useEntitlementStore } from '@nf/purchases';
import { nativeApplicationVersion } from 'expo-application';
import { Directory, File, Paths } from 'expo-file-system';
import type { ImageSourcePropType } from 'react-native';
import { create } from 'zustand';

import { db } from './db';

export const PREMIUM = 'booth_premium';
const CDN = process.env.EXPO_PUBLIC_CDN_BASE_URL;

interface CatalogState extends Catalog {
  offline: boolean;
  /** Version of the manifest in effect (CDN or bundled); recorded in `installed_packs.version`. */
  manifestVersion: number;
  /** Packs downloaded to Documents/packs/<id>/ (bought, or fetched by a Premium subscriber). */
  installedIds: ReadonlySet<string>;
  /** Manifest file path → local file URI for installed pack files. */
  localFiles: Readonly<Record<string, string>>;
}

/** Usable packs: bundled, then CDN (P19, when configured), then installed (PLAN 콘텐츠 매니페스트). */
export const useCatalog = create<CatalogState>(() => ({
  ...buildCatalog({ bundled: bundledManifest, remote: null, installed: [], appVersion: '0.0.0' }),
  offline: false,
  manifestVersion: bundledManifest.version,
  installedIds: new Set(),
  localFiles: {},
}));

/** Installed pack files live flat under Documents/packs/<packId>/ (PLAN 상태 경계 › 파일). */
export const packsDir = new Directory(Paths.document, 'packs');
export const installedFile = (packId: string, path: string) => new File(packsDir, packId, fileName(path));

/** CDN manifest from this launch (null = bundled only); kept so installs can rebuild without a fetch. */
let remoteManifest: Manifest | null = null;

/** App start: CDN manifest once (ETag), installed packs from SQLite, then merge. */
export async function loadCatalog() {
  const loaded = await loadRemoteManifest(CDN, (error) => recordError(error, 'manifest'));
  remoteManifest = loaded.remote;
  await rebuildCatalog(Boolean(CDN) && loaded.source === 'cache');
}

/** After a pack install: re-read `installed_packs` and rebuild (no network). */
export async function refreshCatalog() {
  await rebuildCatalog(useCatalog.getState().offline);
}

async function rebuildCatalog(offline: boolean) {
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
    remote: remoteManifest,
    installed,
    appVersion: nativeApplicationVersion ?? '0.0.0',
  });
  const localFiles: Record<string, string> = {};
  for (const pack of installed) {
    for (const path of packFiles(pack)) {
      const file = installedFile(pack.id, path);
      if (file.exists) localFiles[path] = file.uri;
    }
  }
  useCatalog.setState({
    ...catalog,
    offline,
    manifestVersion: (remoteManifest ?? bundledManifest).version,
    installedIds: new Set(rows.map((row) => row.id)),
    localFiles,
  });
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

/** Immutable CDN URL of a manifest path (`packs/<id>/<version>/<file>`). */
export const cdnUrl = (path: string) => `${(CDN ?? '').replace(/\/$/, '')}/${path}`;

/** Bundled images resolve to require() modules, installed ones to local files, the rest to the CDN. */
export function imageSource(path: string): ImageSourcePropType {
  const bundled = bundledAssets[path];
  if (bundled !== undefined) return bundled;
  const local = useCatalog.getState().localFiles[path];
  if (local) return { uri: local };
  return { uri: cdnUrl(path) };
}

/** Reactive pack access: free, Premium, or bought on its own. */
export function useCanUse(pack: Pick<Pack, 'free' | 'entitlementId'>): boolean {
  const usable = useEntitlementStore((s) => canUsePack(s, pack, PREMIUM, Date.now()));
  return !MONETIZATION || usable;
}
