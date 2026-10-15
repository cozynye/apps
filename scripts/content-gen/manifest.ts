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

type Pack = { id: string; [k: string]: unknown };
type Manifest = { schemaVersion: number; version: number; minAppVersion: string; packs: Pack[] };
type Localized = { en: string; vi: string; th: string };
type FrameDef = { id: string; title: Localized };
type StickerDef = { id: string };

const common = { productId: null, entitlementId: null, free: true, bundled: true, category: 'basic', minAppVersion: '1.0.0' };

const framePack = (id: string, title: Localized, frames: FrameDef[]): Pack => ({
  id,
  type: 'frame',
  ...common,
  title,
  items: frames.map((f) => ({
    id: `${id}-${f.id}`,
    title: f.title,
    layout: 'strip4',
    image: `frames/${id}/${f.id}.png`,
    thumbnail: `frames/${id}/${f.id}-thumb.png`,
    slots: SLOTS,
    canvas: { w: 1200, h: 3600 },
    captionSlot: CAPTION_SLOT,
    category: 'basic',
  })),
});

const stickerPack = (id: string, folder: string, title: Localized, stickers: StickerDef[]): Pack => ({
  id,
  type: 'sticker',
  ...common,
  title,
  items: stickers.map((s) => ({ id: `${folder}-${s.id}`, image: `stickers/${folder}/${s.id}.png`, size: 512, canvas: { w: 512, h: 512 } })),
});

/** Generated packs in catalogue order (after the hand-made base packs). */
const GENERATED: Pack[] = [
  framePack('pop', { en: 'Pop', vi: 'Pop', th: 'Pop' }, POP_FRAMES),
  stickerPack('stickers-pop', 'pop', { en: 'Pop', vi: 'Pop', th: 'Pop' }, POP_STICKERS),
  framePack('y2k', { en: 'Y2K', vi: 'Y2K', th: 'Y2K' }, Y2K_FRAMES),
  stickerPack('stickers-y2k', 'y2k', { en: 'Y2K', vi: 'Y2K', th: 'Y2K' }, Y2K_STICKERS),
];

const path = join(DESIGN_ASSETS, 'manifest.json');
const manifest = JSON.parse(readFileSync(path, 'utf8')) as Manifest;
const generatedIds = new Set(GENERATED.map((p) => p.id));
const before = JSON.stringify(manifest.packs.filter((p) => generatedIds.has(p.id)));
manifest.packs = [...manifest.packs.filter((p) => !generatedIds.has(p.id)), ...GENERATED];
if (before !== JSON.stringify(GENERATED)) manifest.version += 1;
writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`manifest version ${manifest.version}: ${manifest.packs.map((p) => `${p.id}(${(p.items as unknown[]).length})`).join(', ')}`);
