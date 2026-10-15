/**
 * Composes App Store screenshots (C9): caption + device screenshot on the app's soft accent
 * background, at the exact store sizes. Raw screenshots come from the Maestro `store-shots` flow
 * (scripts/store-shots.sh copies them to docs/release/screenshots/raw/<app>/<device>/<locale>/N.png).
 *
 *   pnpm tsx scripts/store-screenshots.ts            # composes everything found under raw/
 *
 * Output: docs/release/screenshots/<app>/<device>/<locale>/N.png (gitignored).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';

const ROOT = join(import.meta.dirname, '..');
const RAW = join(ROOT, 'docs/release/screenshots/raw');
const OUT = join(ROOT, 'docs/release/screenshots');
const FONTS = join(ROOT, 'packages/ui/fonts');

type App = 'nuni' | 'fourpop';
type Device = 'iphone' | 'ipad';
type Locale = 'en' | 'vi' | 'th';

/** Raw capture sizes: iPhone 17 Pro Max (6.9") and iPad Pro 13" simulators, portrait. */
const SIZE: Record<Device, { w: number; h: number }> = { iphone: { w: 1320, h: 2868 }, ipad: { w: 2064, h: 2752 } };
/**
 * App Store Connect upload sizes. The 2026 ASC version page's primary iPhone slot is "Dynamic Island iPhone
 * (medium display)" = 6.3" 1206×2622; the 6.9" 1320×2868 set stays for the large-display slot in Media Manager.
 */
const OUTPUTS: { device: Device; out: string; w: number; h: number }[] = [
  { device: 'iphone', out: 'iphone-6.3', w: 1206, h: 2622 },
  { device: 'iphone', out: 'iphone', w: 1320, h: 2868 },
  { device: 'ipad', out: 'ipad', w: 2064, h: 2752 },
];

const tokens = JSON.parse(readFileSync(join(ROOT, 'design/tokens.json'), 'utf8')) as {
  color: { tokens: { name: string; value: { light: string } }[] };
};
const color = (name: string) => tokens.color.tokens.find((t) => t.name === name)!.value.light;

/** Captions from the submission copy (docs/release/store-<app>.md, "Screenshot captions" per locale). */
function captions(app: App, locale: Locale): string[] {
  const md = readFileSync(join(ROOT, `docs/release/store-${app}.md`), 'utf8');
  const section = md.split(/^## /m).find((s) => s.startsWith(`${locale}\n`));
  if (!section) throw new Error(`no ${locale} section for ${app}`);
  const line = section.split('\n').find((l) => l.includes('Screenshot captions'));
  if (!line) throw new Error(`no captions for ${app}/${locale}`);
  const found = [...line.matchAll(/\d+ "([^"]+)"/g)].map((m) => m[1]!);
  if (found.length !== 6) throw new Error(`${app}/${locale}: expected 6 captions, got ${found.length}`);
  return found;
}

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** resvg mis-shapes Thai SARA AM (U+0E33); the decomposed NIKHAHIT + SARA AA renders correctly. */
const shapeThai = (s: string) => s.replace(/\u0E33/g, '\u0E4D\u0E32');

/** Greedy wrap by estimated glyph width (Thai has no spaces: kept on one line, font shrinks instead). */
function wrap(text: string, maxWidth: number, fontSize: number): string[] {
  const per = fontSize * 0.56;
  if (!text.includes(' ')) return [text];
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (next.length * per > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function compose(app: App, device: Device, outDir: string, w: number, h: number, locale: Locale, index: number, caption: string, png: Buffer) {
  const accentSoft = color(app === 'nuni' ? 'nuni-soft' : 'fourpop-soft');
  const family = locale === 'th' ? 'Prompt' : 'Be Vietnam Pro';
  const margin = Math.round(w * 0.07);
  let fontSize = Math.round(w * 0.066);
  let lines = wrap(caption, w - margin * 2, fontSize);
  while ((lines.length > 2 || Math.max(...lines.map((l) => l.length)) * fontSize * 0.56 > w - margin * 2) && fontSize > 40) {
    fontSize -= 4;
    lines = wrap(caption, w - margin * 2, fontSize);
  }
  const lineH = Math.round(fontSize * 1.2);
  const captionTop = Math.round(h * 0.075);
  const captionBottom = captionTop + lineH * lines.length;

  // Screenshot: fit below the caption, keep aspect, rounded corners + hairline.
  const shotTop = captionBottom + Math.round(h * 0.04);
  const availH = h - shotTop - Math.round(h * 0.03);
  const availW = w - margin * 2;
  const { w: sw, h: sh } = SIZE[device]; // raw screenshots are full-screen captures at these sizes
  const scale = Math.min(availW / sw, availH / sh);
  const dw = Math.round(sw * scale);
  const dh = Math.round(sh * scale);
  const dx = Math.round((w - dw) / 2);
  const dy = shotTop + Math.round((availH - dh) / 2);
  const radius = Math.round(dw * 0.06);

  const text = lines
    .map((l, i) => `<tspan x="${w / 2}" dy="${i === 0 ? 0 : lineH}">${escape(locale === 'th' ? shapeThai(l) : l)}</tspan>`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${accentSoft}"/>
  <text x="${w / 2}" y="${captionTop + fontSize}" text-anchor="middle" font-family="${family}" font-weight="700" font-size="${fontSize}" fill="${color('ink')}">${text}</text>
  <defs><clipPath id="c"><rect x="${dx}" y="${dy}" width="${dw}" height="${dh}" rx="${radius}"/></clipPath></defs>
  <rect x="${dx - 2}" y="${dy - 2}" width="${dw + 4}" height="${dh + 4}" rx="${radius + 2}" fill="${color('line')}"/>
  <image href="data:image/png;base64,${png.toString('base64')}" x="${dx}" y="${dy}" width="${dw}" height="${dh}" clip-path="url(#c)" preserveAspectRatio="xMidYMid slice"/>
</svg>`;
  const out = new Resvg(svg, {
    font: {
      fontFiles: readdirSync(FONTS).filter((f) => f.endsWith('.ttf')).map((f) => join(FONTS, f)),
      loadSystemFonts: false,
      defaultFontFamily: family,
    },
  }).render();
  // App Store Connect rejects screenshots with an alpha channel ("파일 크기가 유효하지 않습니다"): write opaque RGB.
  const rgb = new PNG({ width: out.width, height: out.height });
  rgb.data = Buffer.from(out.pixels);
  const dir = join(OUT, app, outDir, locale);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${index}.png`), PNG.sync.write(rgb, { colorType: 2 }));
}

let made = 0;
for (const app of ['nuni', 'fourpop'] as App[]) {
  for (const { device, out, w, h } of OUTPUTS) {
    for (const locale of ['en', 'vi', 'th'] as Locale[]) {
      const dir = join(RAW, app, device, locale);
      if (!existsSync(dir)) continue;
      const caps = captions(app, locale);
      for (let i = 1; i <= 6; i += 1) {
        const file = join(dir, `${i}.png`);
        if (!existsSync(file)) {
          console.warn(`missing ${app}/${device}/${locale}/${i}.png`);
          continue;
        }
        compose(app, device, out, w, h, locale, i, caps[i - 1]!, readFileSync(file));
        made += 1;
      }
    }
  }
}
console.log(`${made} store screenshots → ${OUT}`);
