/**
 * Adds/refreshes the generated bundled packs (Pop, Y2K) in design/assets/manifest.json from the
 * generator definitions. Run after regenerating the PNGs, then `pnpm design:sync`.
 *
 *   pnpm tsx scripts/content-gen/manifest.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { DESIGN_ASSETS } from './common';
import { CAPTION_SLOT, POP_FRAMES, SLOTS } from './frames';
import { POP_STICKERS } from './stickers';
import { Y2K_FRAMES } from './y2k-frames';
import { Y2K_STICKERS } from './y2k-stickers';
import { SEASON_PACKS } from './season';
import { STUDIO_FRAMES } from './studio-frames';

type Pack = { id: string; [k: string]: unknown };
type Manifest = { schemaVersion: number; version: number; minAppVersion: string; packs: Pack[] };
type Localized = { en: string; vi: string; th: string };
type FrameDef = { id: string; title: Localized };
type StickerDef = { id: string };

const common = { productId: null, entitlementId: null, free: true, bundled: true, category: 'basic', minAppVersion: '1.0.0' };

const framePack = (id: string, title: Localized, frames: FrameDef[], extra: Record<string, unknown> = {}, folder = id): Pack => ({
  id,
  type: 'frame',
  ...common,
  ...extra,
  title,
  items: frames.map((f) => ({
    id: `${id}-${f.id}`,
    title: f.title,
    layout: 'strip4',
    image: `frames/${folder}/${f.id}.png`,
    thumbnail: `frames/${folder}/${f.id}-thumb.png`,
    slots: SLOTS,
    canvas: { w: 1200, h: 3600 },
    captionSlot: CAPTION_SLOT,
    category: extra.category ?? 'basic',
  })),
});

const stickerPack = (id: string, folder: string, title: Localized, stickers: StickerDef[], extra: Record<string, unknown> = {}): Pack => ({
  id,
  type: 'sticker',
  ...common,
  ...extra,
  title,
  items: stickers.map((s) => ({ id: `${folder}-${s.id}`, image: `stickers/${folder}/${s.id}.png`, size: 512, canvas: { w: 512, h: 512 } })),
});

/** Generated packs in catalogue order (after the hand-made base packs). */
const GENERATED: Pack[] = [
  framePack('pop', { en: 'Pop', vi: 'Pop', th: 'Pop' }, POP_FRAMES),
  stickerPack('stickers-pop', 'pop', { en: 'Pop', vi: 'Pop', th: 'Pop' }, POP_STICKERS),
  framePack('y2k', { en: 'Y2K', vi: 'Y2K', th: 'Y2K' }, Y2K_FRAMES),
  stickerPack('stickers-y2k', 'y2k', { en: 'Y2K', vi: 'Y2K', th: 'Y2K' }, Y2K_STICKERS),
  // Booth-brand minimal looks (2026-10-16): solid mats, small wordmark, date-stamp area clear.
  framePack('studio', { en: 'Studio', vi: 'Studio', th: 'สตูดิโอ' }, STUDIO_FRAMES),
  // Free bundled season packs (Cozy 2026-10-16); shown only inside their window (B4 Season tab, B7 tray, shop, banner).
  ...SEASON_PACKS.flatMap((p) => {
    const season = { category: 'season', availableFrom: p.availableFrom, availableUntil: p.availableUntil };
    return [
      framePack(p.id, p.title, p.frames, season, p.folder),
      stickerPack(`stickers-${p.id}`, p.folder, p.title, p.stickers, season),
    ];
  }),
];

const path = join(DESIGN_ASSETS, 'manifest.json');
const manifest = JSON.parse(readFileSync(path, 'utf8')) as Manifest;
const generatedIds = new Set(GENERATED.map((p) => p.id));
const before = JSON.stringify(manifest.packs.filter((p) => generatedIds.has(p.id)));
manifest.packs = [...manifest.packs.filter((p) => !generatedIds.has(p.id)), ...GENERATED];
if (before !== JSON.stringify(GENERATED)) manifest.version += 1;
writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`manifest version ${manifest.version}: ${manifest.packs.map((p) => `${p.id}(${(p.items as unknown[]).length})`).join(', ')}`);
