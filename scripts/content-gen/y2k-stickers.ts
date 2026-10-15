/**
 * Generates the bundled "Y2K" sticker pack (design/assets/stickers/y2k): 18 stickers, 512×512,
 * ink outline 20px, chrome/neon/kitsch fills. Same spec as base (stickers README).
 *
 *   pnpm tsx scripts/content-gen/y2k-stickers.ts
 */
import { join } from 'node:path';

import { C, DESIGN_ASSETS, renderPng, rng, writePng } from './common';

const S = 512;
const CHROME = `<linearGradient id="chrome" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9ecf1"/><stop offset="0.25" stop-color="#ffffff"/><stop offset="0.45" stop-color="#aab2c0"/><stop offset="0.6" stop-color="#f6f7f9"/><stop offset="0.8" stop-color="#8e97a6"/><stop offset="1" stop-color="#dfe3e9"/></linearGradient>`;
const wrap = (inner: string, defs = CHROME) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}"><defs>${defs}</defs>
<g stroke="${C.ink}" stroke-width="20" stroke-linejoin="round" stroke-linecap="round">${inner}</g></svg>`;

const text = (t: string, y: number, size: number, fill: string, extra = '') =>
  `<text x="256" y="${y}" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="700" font-size="${size}" fill="${fill}" ${extra.includes('stroke=') ? '' : 'stroke="none"'} ${extra}>${t}</text>`;
const dot = (cx: number, cy: number, r: number, fill: string) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="none"/>`;

function starPoints(cx: number, cy: number, r1: number, r2: number, n = 5): string {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i += 1) {
    const r = i % 2 === 0 ? r1 : r2;
    const a = (Math.PI * i) / n - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

/** Pixel-art shape from a bitmap; each cell is a stroked square so the grid reads as pixels. */
function pixels(rows: string[], cell: number, fill: string): string {
  const w = rows[0]!.length * cell;
  const h = rows.length * cell;
  const x0 = (S - w) / 2;
  const y0 = (S - h) / 2;
  let out = '';
  rows.forEach((row, r) => {
    [...row].forEach((bit, c) => {
      if (bit === '1') out += `<rect x="${x0 + c * cell}" y="${y0 + r * cell}" width="${cell}" height="${cell}" fill="${fill}" stroke-width="6"/>`;
    });
  });
  return out;
}

/* ---------- the eighteen stickers ---------- */

const butterfly = () =>
  wrap(`<path d="M256 250 C 196 110 52 70 44 164 C 38 232 150 262 256 250 Z" fill="url(#chrome)"/>
<path d="M256 250 C 316 110 460 70 468 164 C 474 232 362 262 256 250 Z" fill="url(#chrome)"/>
<path d="M256 262 C 190 298 112 404 152 446 C 194 480 246 372 256 262 Z" fill="url(#chrome)"/>
<path d="M256 262 C 322 298 400 404 360 446 C 318 480 266 372 256 262 Z" fill="url(#chrome)"/>
<ellipse cx="256" cy="262" rx="22" ry="96" fill="${C.ink}"/>
<path d="M246 176 C 226 130 196 110 176 104 M266 176 C 286 130 316 110 336 104" fill="none" stroke-width="12"/>`);

const starChrome = () => wrap(`<polygon points="${starPoints(256, 272, 226, 96)}" fill="url(#chrome)"/>`);

const heartChrome = () =>
  wrap(`<path d="M256 440 C 150 360 70 290 90 200 C 104 140 180 120 256 190 C 332 120 408 140 422 200 C 442 290 362 360 256 440 Z" fill="url(#chrome)"/>
<ellipse cx="166" cy="212" rx="18" ry="30" fill="#fff" stroke="none" transform="rotate(-32 166 212)"/>`);

const boltChrome = () => wrap(`<polygon points="300,30 130,290 240,290 190,482 390,210 280,210 340,30" fill="url(#chrome)"/>`);

const dizzy = () =>
  wrap(`<circle cx="256" cy="256" r="206" fill="#ffd93b"/>
<path d="M156 196 L212 252 M212 196 L156 252 M300 196 L356 252 M356 196 L300 252" fill="none" stroke-width="18"/>
<path d="M166 330 q 30 -30 60 0 t 60 0 t 60 0" fill="none" stroke-width="16"/>
${dot(140, 300, 20, '#ff8ac5')}${dot(372, 300, 20, '#ff8ac5')}`);

const cd = () => {
  const colors = ['#ff8ac5', '#ffd93b', '#9fe1cb', '#7fd2ff', '#c9bdf0', '#ffb48f'];
  const wedges = colors
    .map((c, i) => {
      const a0 = (i * Math.PI) / 3;
      const a1 = ((i + 1) * Math.PI) / 3;
      const p = (a: number, r: number) => `${(256 + r * Math.cos(a)).toFixed(1)} ${(256 + r * Math.sin(a)).toFixed(1)}`;
      return `<path d="M${p(a0, 70)} L${p(a0, 214)} A214 214 0 0 1 ${p(a1, 214)} L${p(a1, 70)} A70 70 0 0 0 ${p(a0, 70)} Z" fill="${c}" fill-opacity="0.55" stroke="none"/>`;
    })
    .join('');
  return wrap(`<circle cx="256" cy="256" r="214" fill="#e6e8ee"/>${wedges}<circle cx="256" cy="256" r="70" fill="#f6f7f9"/><circle cx="256" cy="256" r="26" fill="#fff"/>`);
};

const cassette = () =>
  wrap(`<rect x="46" y="120" width="420" height="272" rx="28" fill="#2b2b33"/>
<rect x="86" y="156" width="340" height="130" rx="18" fill="#ff5fa2"/>
<circle cx="176" cy="222" r="42" fill="#fff"/><circle cx="336" cy="222" r="42" fill="#fff"/>
${dot(176, 222, 12, C.ink)}${dot(336, 222, 12, C.ink)}
<path d="M196 392 L216 330 L296 330 L316 392 Z" fill="#2b2b33"/>
${dot(246, 362, 7, '#fff')}${dot(266, 362, 7, '#fff')}`);

const flipPhone = () =>
  wrap(`<path d="M232 48 L232 100" stroke-width="16"/>
<rect x="150" y="100" width="212" height="372" rx="36" fill="url(#chrome)"/>
<rect x="190" y="150" width="132" height="96" rx="14" fill="${C.ink}"/>
<rect x="206" y="166" width="100" height="64" rx="8" fill="#2de2e6" stroke="none"/>
<path d="M150 300 H362" stroke-width="12"/>
${dot(256, 390, 22, C.ink)}`);

const pixelHeart = () =>
  wrap(pixels(['0110110', '1111111', '1111111', '1111111', '0111110', '0011100', '0001000'], 54, '#ff4f7a'));

const pixelStar = () =>
  wrap(pixels(['000010000', '000111000', '000111000', '111111111', '011111110', '001111100', '011101110', '011000110', '010000010'], 46, '#ffd93b'));

const barcode = () => {
  const r = rng(99);
  let bars = '';
  let x = 86;
  while (x < 420) {
    const w = 6 + Math.floor(r() * 3) * 6;
    bars += `<rect x="${x}" y="150" width="${w}" height="170" fill="${C.ink}" stroke="none"/>`;
    x += w + 6 + Math.floor(r() * 2) * 6;
  }
  return wrap(`<rect x="46" y="96" width="420" height="320" rx="24" fill="#fff"/>${bars}${text('FOURPOP', 376, 40, C.ink, 'letter-spacing="8"')}`);
};

const y2k = () => wrap(text('Y2K', 338, 220, 'url(#chrome)', `stroke="${C.ink}" stroke-width="16" paint-order="stroke" letter-spacing="-6"`));

const ootd = () => wrap(`<rect x="36" y="166" width="440" height="180" rx="90" fill="${C.ink}"/>${text('OOTD', 320, 112, '#fff', 'letter-spacing="4"')}`);

const slay = () =>
  wrap(`<g transform="rotate(-8 256 256)"><rect x="46" y="156" width="420" height="200" rx="40" fill="#ff5fa2"/>${text('slay', 330, 136, '#fff')}</g>`);

const forever = () =>
  wrap(`<rect x="56" y="106" width="400" height="300" rx="30" fill="#fff"/>${text('BFF', 236, 110, C.ink)}${text('4EVER', 356, 96, '#ff5fa2')}`);

const spiral = () => {
  let d = '';
  for (let i = 0; i <= 260; i += 1) {
    const t = (i / 260) * Math.PI * 7;
    const r = 6 + t * 10;
    const x = 256 + r * Math.cos(t);
    const y = 256 + r * Math.sin(t);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return wrap(`<path d="${d}" fill="none" stroke-width="22"/>`);
};

const yinYang = () =>
  wrap(`<circle cx="256" cy="256" r="206" fill="#fff"/>
<path d="M256 50 A206 206 0 0 0 256 462 A103 103 0 0 0 256 256 A103 103 0 0 1 256 50 Z" fill="${C.ink}" stroke="none"/>
<circle cx="256" cy="256" r="206" fill="none"/>
${dot(256, 153, 28, '#fff')}${dot(256, 359, 28, C.ink)}`);

const flame = () =>
  wrap(`<path d="M256 50 C 300 130 360 160 360 270 C 360 360 310 440 256 460 C 200 440 150 360 150 270 C 150 220 180 190 196 160 C 200 210 226 230 236 230 C 236 170 226 120 256 50 Z" fill="#ff7a1a"/>
<path d="M256 240 C 286 290 316 310 310 360 C 306 400 282 420 256 426 C 230 420 206 400 202 360 C 198 320 226 290 256 240 Z" fill="#ffd93b" stroke="none"/>`);

export const Y2K_STICKERS: { id: string; svg: () => string }[] = [
  { id: 'butterfly', svg: butterfly },
  { id: 'star-chrome', svg: starChrome },
  { id: 'heart-chrome', svg: heartChrome },
  { id: 'bolt-chrome', svg: boltChrome },
  { id: 'dizzy', svg: dizzy },
  { id: 'cd', svg: cd },
  { id: 'cassette', svg: cassette },
  { id: 'flip-phone', svg: flipPhone },
  { id: 'pixel-heart', svg: pixelHeart },
  { id: 'pixel-star', svg: pixelStar },
  { id: 'barcode', svg: barcode },
  { id: 'y2k', svg: y2k },
  { id: 'ootd', svg: ootd },
  { id: 'slay', svg: slay },
  { id: '4ever', svg: forever },
  { id: 'spiral', svg: spiral },
  { id: 'yin-yang', svg: yinYang },
  { id: 'flame', svg: flame },
];

if (process.argv[1]?.endsWith('y2k-stickers.ts')) {
  const out = join(DESIGN_ASSETS, 'stickers/y2k');
  for (const s of Y2K_STICKERS) {
    writePng(join(out, `${s.id}.png`), renderPng(s.svg()));
    console.log(`stickers/y2k/${s.id}.png`);
  }
}
