/**
 * Review sheet for a generated pack pair: frames (scaled) in a row, stickers in a grid, one PNG.
 *
 *   pnpm tsx scripts/content-gen/sheet.ts <pop|y2k> [out.png]
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { DESIGN_ASSETS, renderPng, writePng } from './common';
import { POP_FRAMES } from './frames';
import { POP_STICKERS } from './stickers';
import { Y2K_FRAMES } from './y2k-frames';
import { Y2K_STICKERS } from './y2k-stickers';
import { SEASON_PACKS } from './season';

const pack = process.argv[2] ?? 'pop';
type Set = { frames: { id: string }[]; stickers: { id: string }[]; folder: string };
const sets: Record<string, Set> = {
  pop: { frames: POP_FRAMES, stickers: POP_STICKERS, folder: 'pop' },
  y2k: { frames: Y2K_FRAMES, stickers: Y2K_STICKERS, folder: 'y2k' },
  ...Object.fromEntries(SEASON_PACKS.map((p) => [p.id, { frames: p.frames, stickers: p.stickers, folder: p.folder }])),
};
const set = sets[pack];
if (!set) throw new Error(`usage: sheet.ts <${Object.keys(sets).join('|')}> [out.png]`);
const out = process.argv[3] ?? join(DESIGN_ASSETS, `frames/${set.folder}/_sheet.png`);
const dataUri = (p: string) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;

const FW = 150;
const FH = 450;
const GAP = 20;
const sheetW = GAP + set.frames.length * (FW + GAP);
const stickerSize = 120;
const perRow = Math.floor((sheetW - GAP) / (stickerSize + GAP));
const rows = Math.ceil(set.stickers.length / perRow);
const sheetH = GAP + FH + 60 + rows * (stickerSize + GAP) + GAP;

const frames = set.frames
  .map(
    (f, i) =>
      `<image href="${dataUri(join(DESIGN_ASSETS, `frames/${set.folder}`, `${f.id}.png`))}" x="${GAP + i * (FW + GAP)}" y="${GAP}" width="${FW}" height="${FH}"/>
<text x="${GAP + i * (FW + GAP) + FW / 2}" y="${GAP + FH + 34}" text-anchor="middle" font-size="20" font-family="Be Vietnam Pro" fill="#1f1f24">${f.id}</text>`,
  )
  .join('');
const stickers = set.stickers
  .map((s, i) => {
    const x = GAP + (i % perRow) * (stickerSize + GAP);
    const y = GAP + FH + 60 + Math.floor(i / perRow) * (stickerSize + GAP);
    return `<rect x="${x}" y="${y}" width="${stickerSize}" height="${stickerSize}" rx="12" fill="#f2efe9"/><image href="${dataUri(join(DESIGN_ASSETS, `stickers/${set.folder}`, `${s.id}.png`))}" x="${x}" y="${y}" width="${stickerSize}" height="${stickerSize}"/>`;
  })
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${sheetW}" height="${sheetH}" viewBox="0 0 ${sheetW} ${sheetH}">
<rect width="${sheetW}" height="${sheetH}" fill="#d9d6cf"/>${frames}${stickers}</svg>`;
writePng(out, renderPng(svg));
console.log(`sheet → ${out}`);
