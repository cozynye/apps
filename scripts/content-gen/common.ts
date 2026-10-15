/** Shared helpers for generating bundled content (frames, stickers) with resvg. */
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const ROOT = join(import.meta.dirname, '../..');
export const DESIGN_ASSETS = join(ROOT, 'design/assets');
const FONTS = join(ROOT, 'packages/ui/fonts');

/** Design tokens (light values) used by the generators. Keep in sync with design/tokens.json. */
export const C = {
  ink: '#1f1f24',
  inkLight: '#f2f1ee',
  surface0: '#ffffff',
  primary: '#ff8a80',
  soft: '#ffe6e3',
  deep: '#b8413a',
  mint: '#9fe1cb',
  mood4: '#ffc95c',
  peach: '#ffd6cc',
  // Pack-specific pastels (frames README allows per-pack colors, e.g. base "peach").
  cream: '#fff8f0',
  lavender: '#e6def7',
  lavenderDeep: '#5a4a9c',
  sky: '#d9ecff',
  skyDeep: '#3b6fb6',
  mintSoft: '#d5f3ea',
  leaf: '#5bbf9a',
  berry: '#ff6f61',
  butter: '#fff3b0',
} as const;

const fontFiles = () => readdirSync(FONTS).filter((f) => f.endsWith('.ttf')).map((f) => join(FONTS, f));

/** Renders an SVG string to PNG (RGBA). `width` scales the output (fit to width). */
export function renderPng(svg: string, width?: number): Buffer {
  const r = new Resvg(svg, {
    font: { fontFiles: fontFiles(), loadSystemFonts: false, defaultFontFamily: 'Be Vietnam Pro' },
    ...(width ? { fitTo: { mode: 'width' as const, value: width } } : {}),
  });
  return r.render().asPng();
}

export function writePng(path: string, png: Buffer) {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, png);
}

/** Deterministic PRNG (mulberry32) so re-running the generator reproduces the same scatter. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 5×7 bitmap glyphs for pixel-style captions (Y2K pack). */
const GLYPHS: Record<string, string[]> = {
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};

/** Renders `text` as pixel rects, centred on (cx, cy); `px` = pixel size. Unknown glyphs become spaces. */
export function pixelText(text: string, cx: number, cy: number, px: number, fill: string): string {
  const width = text.length * 6 - 1;
  const x0 = cx - (width * px) / 2;
  const y0 = cy - (7 * px) / 2;
  const rects: string[] = [];
  [...text].forEach((ch, i) => {
    const rows = GLYPHS[ch] ?? GLYPHS[' ']!;
    rows.forEach((row, r) => {
      [...row].forEach((bit, c) => {
        if (bit === '1') rects.push(`<rect x="${x0 + (i * 6 + c) * px}" y="${y0 + r * px}" width="${px}" height="${px}" fill="${fill}"/>`);
      });
    });
  });
  return rects.join('');
}

