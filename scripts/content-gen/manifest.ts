/**
 * Adds/refreshes the bundled "Pop" packs in design/assets/manifest.json from the generator
 * definitions (frames.ts, stickers.ts). Run after regenerating the PNGs, then `pnpm design:sync`.
 *
 *   pnpm tsx scripts/content-gen/manifest.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { DESIGN_ASSETS } from './common';
import { CAPTION_SLOT, POP_FRAMES, SLOTS } from './frames';
import { POP_STICKERS } from './stickers';

type Pack = { id: string; [k: string]: unknown };
type Manifest = { schemaVersion: number; version: number; minAppVersion: string; packs: Pack[] };

const path = join(DESIGN_ASSETS, 'manifest.json');
const manifest = JSON.parse(readFileSync(path, 'utf8')) as Manifest;

const title = { en: 'Pop', vi: 'Pop', th: 'Pop' };
const common = { productId: null, entitlementId: null, free: true, bundled: true, category: 'basic', minAppVersion: '1.0.0' };

const framePack: Pack = {
  id: 'pop',
  type: 'frame',
  ...common,
  title,
  items: POP_FRAMES.map((f) => ({
    id: `pop-${f.id}`,
    title: f.title,
    layout: 'strip4',
    image: `frames/pop/${f.id}.png`,
    thumbnail: `frames/pop/${f.id}-thumb.png`,
    slots: SLOTS,
    canvas: { w: 1200, h: 3600 },
    captionSlot: CAPTION_SLOT,
    category: 'basic',
  })),
};

const stickerPack: Pack = {
  id: 'stickers-pop',
  type: 'sticker',
  ...common,
  title,
  items: POP_STICKERS.map((s) => ({ id: `pop-${s.id}`, image: `stickers/pop/${s.id}.png`, size: 512, canvas: { w: 512, h: 512 } })),
};

const existing = new Set(['pop', 'stickers-pop']);
const changed = JSON.stringify(manifest.packs.filter((p) => existing.has(p.id))) !== JSON.stringify([framePack, stickerPack]);
manifest.packs = [...manifest.packs.filter((p) => !existing.has(p.id)), framePack, stickerPack];
if (changed) manifest.version += 1;
writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`manifest version ${manifest.version}: ${manifest.packs.map((p) => `${p.id}(${(p.items as unknown[]).length})`).join(', ')}`);
