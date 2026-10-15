/**
 * Generates the bundled "Y2K" frame pack (design/assets/frames/y2k): 10 strip4 frames in the
 * Gen-Z photo-booth vernacular (chrome, holographic, pixel, film grain, receipt, cyber grid,
 * kitsch pink, mono, neon, bling hearts). Same slot geometry as base.
 *
 *   pnpm tsx scripts/content-gen/y2k-frames.ts
 */
import { join } from 'node:path';

import { C, DESIGN_ASSETS, pixelText, renderPng, rng, writePng } from './common';
import { CAPTION_SLOT, SLOTS } from './frames';

const W = 1200;
const H = 3600;
const OUTER_R = 48;
const SLOT_R = 24;
const CAPTION_Y = CAPTION_SLOT.y + 150;

const Y = {
  chromeA: '#e9ecf1',
  chromeB: '#aab2c0',
  chromeC: '#8e97a6',
  navy: '#0f1230',
  black: '#0a0a0c',
  cyan: '#2de2e6',
  magenta: '#ff4fd8',
  hotPink: '#ff5fa2',
  brown: '#3b2a1f',
  orange: '#ff9a3c',
  yellow: '#ffd93b',
  paper: '#fbfbf7',
} as const;

const CHROME = `<linearGradient id="chrome" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${Y.chromeA}"/><stop offset="0.25" stop-color="#ffffff"/><stop offset="0.45" stop-color="${Y.chromeB}"/><stop offset="0.6" stop-color="#f6f7f9"/><stop offset="0.8" stop-color="${Y.chromeC}"/><stop offset="1" stop-color="#dfe3e9"/></linearGradient>`;
const GLOW = `<filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>`;

const caption = (text: string, fill: string, size = 56, extra = '') =>
  `<text x="${W / 2}" y="${CAPTION_Y}" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="700" font-size="${size}" letter-spacing="${Math.round(size * 0.18)}" fill="${fill}" ${extra}>${text}</text>`;

function frame(body: string, cap: string, defs = ''): string {
  const holes = SLOTS.map((s) => `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${SLOT_R}" fill="#000"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <clipPath id="outer"><rect width="${W}" height="${H}" rx="${OUTER_R}"/></clipPath>
  <mask id="slots"><rect width="${W}" height="${H}" fill="#fff"/>${holes}</mask>
  ${defs}
</defs>
<g clip-path="url(#outer)" mask="url(#slots)">${body}</g>
${cap}
</svg>`;
}

const bg = (fill: string) => `<rect width="${W}" height="${H}" fill="${fill}"/>`;
/** Solid outer mat so the exported JPEG corners (B8 edge-colour fill) match a gradient frame. */
const mat = (fill: string, inner: string, inset = 18) =>
  `${bg(fill)}<defs><clipPath id="inner"><rect x="${inset}" y="${inset}" width="${W - inset * 2}" height="${H - inset * 2}" rx="${OUTER_R - inset}"/></clipPath></defs><g clip-path="url(#inner)">${inner}</g>`;

const inCaption = (x: number, y: number, pad: number) => x > 240 - pad && x < 960 + pad && y > 3300 - pad && y < 3480 + pad;
function scatter(seed: number, count: number, margin: number, avoidCaption = true): { x: number; y: number }[] {
  const r = rng(seed);
  const out: { x: number; y: number }[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 300) {
    const x = margin + r() * (W - margin * 2);
    const y = margin + r() * (H - margin * 2);
    if (SLOTS.some((s) => x > s.x - margin && x < s.x + s.w + margin && y > s.y - margin && y < s.y + s.h + margin)) continue;
    if (avoidCaption && inCaption(x, y, margin)) continue;
    if (out.some((p) => Math.hypot(p.x - x, p.y - y) < margin * 2)) continue;
    out.push({ x, y });
  }
  return out;
}

const star5 = (cx: number, cy: number, r: number, fill: string, rot = 0) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const rr = i % 2 === 0 ? r : r * 0.42;
    const a = (Math.PI * i) / 5 - Math.PI / 2 + (rot * Math.PI) / 180;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}"/>`;
};
const sparkle4 = (x: number, y: number, s: number, fill: string) =>
  `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" d="M0 ${-s} Q0 0 ${s} 0 Q0 0 0 ${s} Q0 0 ${-s} 0 Q0 0 0 ${-s}Z" fill="${fill}"/>`;

/* ---------- the ten frames ---------- */

function chrome() {
  const body = `${mat(C.ink, `<rect width="${W}" height="${H}" fill="url(#chrome)"/>`)}
<rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="${OUTER_R - 40}" fill="none" stroke="${C.ink}" stroke-width="3"/>`;
  return frame(body, caption('FOURPOP', C.ink), CHROME);
}

function holo() {
  const defs = `<linearGradient id="holo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd1e8"/><stop offset="0.2" stop-color="#d6f5ff"/><stop offset="0.4" stop-color="#e3d7ff"/><stop offset="0.6" stop-color="#fff3b0"/><stop offset="0.8" stop-color="#d4fff0"/><stop offset="1" stop-color="#ffd1e8"/></linearGradient>`;
  const r = rng(31);
  const sparks = scatter(32, 60, 24).map(({ x, y }) => sparkle4(x, y, 10 + r() * 16, '#fff')).join('');
  const body = `${mat('#ffffff', `<rect width="${W}" height="${H}" fill="url(#holo)"/>${sparks}`)}`;
  return frame(body, caption('FOURPOP', '#fff', 56, `stroke="${C.ink}" stroke-width="6" paint-order="stroke"`), defs);
}

function pixel() {
  const r = rng(41);
  const palette = [Y.cyan, Y.magenta, Y.yellow, '#fff'];
  const px = scatter(42, 90, 20)
    .map(({ x, y }) => `<rect x="${(Math.round(x / 24) * 24).toFixed(0)}" y="${(Math.round(y / 24) * 24).toFixed(0)}" width="24" height="24" fill="${palette[Math.floor(r() * palette.length)]}"/>`)
    .join('');
  const cap = `<g>${pixelText('FOURPOP', W / 2 + 6, CAPTION_Y - 22, 12, Y.magenta)}${pixelText('FOURPOP', W / 2, CAPTION_Y - 28, 12, Y.cyan)}</g>`;
  return frame(`${bg('#1b1b2f')}${px}`, cap);
}

function grain() {
  const r = rng(51);
  let dots = '';
  for (let i = 0; i < 2600; i += 1) {
    const x = (r() * W).toFixed(0);
    const y = (r() * H).toFixed(0);
    dots += `<rect x="${x}" y="${y}" width="3" height="3" fill="${r() > 0.5 ? '#fff' : '#000'}" fill-opacity="${(0.08 + r() * 0.18).toFixed(2)}"/>`;
  }
  const stamp = `<g filter="url(#glow)" opacity="0.8">${pixelText('FOURPOP', W / 2, CAPTION_Y - 28, 12, Y.orange)}</g>${pixelText('FOURPOP', W / 2, CAPTION_Y - 28, 12, Y.orange)}`;
  return frame(`${bg(Y.brown)}${dots}`, stamp, GLOW);
}

function receipt() {
  const r = rng(61);
  let bars = '';
  let x = 300;
  while (x < 900) {
    const w = 4 + Math.floor(r() * 4) * 4;
    bars += `<rect x="${x}" y="3290" width="${w}" height="90" fill="${C.ink}"/>`;
    x += w + 4 + Math.floor(r() * 3) * 4;
  }
  const dashes = `<path d="M40 3240 H1160 M40 3520 H1160" stroke="${C.ink}" stroke-width="3" stroke-dasharray="18 12"/>`;
  const text = `<text x="${W / 2}" y="3460" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="500" font-size="34" letter-spacing="6" fill="${C.ink}">FOURPOP * 4 CUTS * THANK YOU</text>`;
  return frame(`${bg(Y.paper)}${bars}${dashes}`, text);
}

function cyber() {
  const grid = `<path d="${Array.from({ length: 13 }, (_, i) => `M${i * 100} 0 V${H}`).join(' ')} ${Array.from({ length: 37 }, (_, i) => `M0 ${i * 100} H${W}`).join(' ')}" stroke="${Y.cyan}" stroke-opacity="0.35" stroke-width="2"/>`;
  const dots = [
    [30, 30],
    [1170, 30],
    [30, 3570],
    [1170, 3570],
  ]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="${Y.magenta}"/><circle cx="${x}" cy="${y}" r="22" fill="${Y.magenta}" filter="url(#glow)" opacity="0.7"/>`)
    .join('');
  const cap = `<g filter="url(#glow)" opacity="0.9">${caption('FOURPOP', Y.cyan)}</g>${caption('FOURPOP', Y.cyan)}`;
  return frame(`${bg(Y.black)}${grid}${dots}`, cap, GLOW);
}

function kitsch() {
  const r = rng(71);
  const stars = scatter(72, 46, 30)
    .map(({ x, y }) => (r() > 0.3 ? star5(x, y, 14 + r() * 16, C.ink, r() * 40) : `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(0.9)" d="M0 14 C -16 2 -24 -10 -16 -18 C -10 -24 -2 -20 0 -14 C 2 -20 10 -24 16 -18 C 24 -10 16 2 0 14 Z" fill="#fff"/>`))
    .join('');
  return frame(`${bg(Y.hotPink)}${stars}`, caption('FOURPOP', C.ink));
}

function mono() {
  const outlines = SLOTS.map((s) => `<rect x="${s.x - 12}" y="${s.y - 12}" width="${s.w + 24}" height="${s.h + 24}" rx="${SLOT_R + 10}" fill="none" stroke="#fff" stroke-width="4"/>`).join('');
  const sub = `<text x="${W / 2}" y="${CAPTION_Y + 58}" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="400" font-size="26" letter-spacing="8" fill="#fff" fill-opacity="0.75">PHOTO BOOTH · 4 CUTS</text>`;
  return frame(`${bg(Y.black)}${outlines}`, `${caption('FOURPOP', '#fff', 60)}${sub}`);
}

function neon() {
  const ring = (inset: number, color: string, w: number) =>
    `<rect x="${inset}" y="${inset}" width="${W - inset * 2}" height="${H - inset * 2}" rx="${OUTER_R - inset / 2}" fill="none" stroke="${color}" stroke-width="${w}"/>`;
  const body = `${bg(Y.navy)}<g filter="url(#glow)" opacity="0.8">${ring(22, Y.magenta, 10)}${ring(44, Y.cyan, 8)}</g>${ring(22, Y.magenta, 8)}${ring(44, Y.cyan, 6)}`;
  const cap = `<g filter="url(#glow)" opacity="0.9">${caption('FOURPOP', Y.magenta)}</g>${caption('FOURPOP', Y.magenta)}`;
  return frame(body, cap, GLOW);
}

function heartcore() {
  const defs = `<linearGradient id="hc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3d7ff"/><stop offset="1" stop-color="#ffc2e6"/></linearGradient>`;
  const r = rng(81);
  const heart = (x: number, y: number, s: number) =>
    `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(s / 24).toFixed(2)})"><path d="M0 18 C -20 4 -30 -12 -20 -22 C -12 -30 -2 -26 0 -18 C 2 -26 12 -30 20 -22 C 30 -12 20 4 0 18 Z" fill="#ff8ac5" stroke="${C.ink}" stroke-width="3"/><ellipse cx="-9" cy="-16" rx="4" ry="6" fill="#fff" transform="rotate(-30 -9 -16)"/></g>`;
  const items = scatter(82, 44, 30)
    .map(({ x, y }) => (r() > 0.4 ? heart(x, y, 18 + r() * 18) : sparkle4(x, y, 8 + r() * 12, '#fff')))
    .join('');
  const body = `${mat('#ffc2e6', `<rect width="${W}" height="${H}" fill="url(#hc)"/>${items}`)}`;
  const sideHeart = (x: number) =>
    `<path transform="translate(${x} ${CAPTION_Y - 20}) scale(1.6)" d="M0 18 C -20 4 -30 -12 -20 -22 C -12 -30 -2 -26 0 -18 C 2 -26 12 -30 20 -22 C 30 -12 20 4 0 18 Z" fill="#ff8ac5" stroke="${C.ink}" stroke-width="3"/>`;
  return frame(body, `${caption('FOURPOP', C.ink)}${sideHeart(330)}${sideHeart(870)}`, defs);
}

export const Y2K_FRAMES: { id: string; svg: () => string; title: { en: string; vi: string; th: string } }[] = [
  { id: 'chrome', svg: chrome, title: { en: 'Chrome', vi: 'Chrome', th: 'โครเมียม' } },
  { id: 'holo', svg: holo, title: { en: 'Holo', vi: 'Holo', th: 'โฮโลแกรม' } },
  { id: 'pixel', svg: pixel, title: { en: 'Pixel', vi: 'Pixel', th: 'พิกเซล' } },
  { id: 'grain', svg: grain, title: { en: 'Film Grain', vi: 'Hạt phim', th: 'เกรนฟิล์ม' } },
  { id: 'receipt', svg: receipt, title: { en: 'Receipt', vi: 'Hóa đơn', th: 'ใบเสร็จ' } },
  { id: 'cyber', svg: cyber, title: { en: 'Cyber', vi: 'Cyber', th: 'ไซเบอร์' } },
  { id: 'kitsch', svg: kitsch, title: { en: 'Kitsch', vi: 'Kitsch', th: 'คิตช์' } },
  { id: 'mono', svg: mono, title: { en: 'Mono', vi: 'Đen trắng', th: 'ขาวดำ' } },
  { id: 'neon', svg: neon, title: { en: 'Neon', vi: 'Neon', th: 'นีออน' } },
  { id: 'heartcore', svg: heartcore, title: { en: 'Heartcore', vi: 'Tim lấp lánh', th: 'หัวใจวิบวับ' } },
];

if (process.argv[1]?.endsWith('y2k-frames.ts')) {
  const out = join(DESIGN_ASSETS, 'frames/y2k');
  for (const f of Y2K_FRAMES) {
    const svg = f.svg();
    writePng(join(out, `${f.id}.png`), renderPng(svg));
    writePng(join(out, `${f.id}-thumb.png`), renderPng(svg, 200));
    console.log(`frames/y2k/${f.id}.png + thumb`);
  }
}
