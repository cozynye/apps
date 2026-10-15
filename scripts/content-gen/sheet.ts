/**
 * Review sheet for the generated Pop packs: frames (scaled) in a row, stickers in a grid, one PNG.
 *
 *   pnpm tsx scripts/content-gen/sheet.ts [out.png]
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { DESIGN_ASSETS, renderPng, writePng } from './common';
import { POP_FRAMES } from './frames';
import { POP_STICKERS } from './stickers';

const out = process.argv[2] ?? join(DESIGN_ASSETS, 'frames/pop/_sheet.png');
const dataUri = (p: string) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;

const FW = 150;
const FH = 450;
const GAP = 20;
const sheetW = GAP + POP_FRAMES.length * (FW + GAP);
const stickerSize = 120;
const perRow = Math.floor((sheetW - GAP) / (stickerSize + GAP));
const rows = Math.ceil(POP_STICKERS.length / perRow);
const sheetH = GAP + FH + 60 + rows * (stickerSize + GAP) + GAP;

const frames = POP_FRAMES.map(
  (f, i) =>
    `<image href="${dataUri(join(DESIGN_ASSETS, 'frames/pop', `${f.id}.png`))}" x="${GAP + i * (FW + GAP)}" y="${GAP}" width="${FW}" height="${FH}"/>
<text x="${GAP + i * (FW + GAP) + FW / 2}" y="${GAP + FH + 34}" text-anchor="middle" font-size="20" font-family="Be Vietnam Pro" fill="#1f1f24">${f.id}</text>`,
).join('');
const stickers = POP_STICKERS.map((s, i) => {
  const x = GAP + (i % perRow) * (stickerSize + GAP);
  const y = GAP + FH + 60 + Math.floor(i / perRow) * (stickerSize + GAP);
  return `<rect x="${x}" y="${y}" width="${stickerSize}" height="${stickerSize}" rx="12" fill="#f2efe9"/><image href="${dataUri(join(DESIGN_ASSETS, 'stickers/pop', `${s.id}.png`))}" x="${x}" y="${y}" width="${stickerSize}" height="${stickerSize}"/>`;
}).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${sheetW}" height="${sheetH}" viewBox="0 0 ${sheetW} ${sheetH}">
<rect width="${sheetW}" height="${sheetH}" fill="#d9d6cf"/>${frames}${stickers}</svg>`;
writePng(out, renderPng(svg));
console.log(`sheet → ${out}`);
