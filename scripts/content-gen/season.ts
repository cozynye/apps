/**
 * Generates the bundled free season packs (Cozy 2026-10-16: "시즌팩 일단 무료로 풀자"):
 * Halloween 2026, Christmas 2026, Tết 2027, Valentine 2027, Songkran 2027 — 6 frames + 8 stickers each,
 * same specs as base (frames/stickers README). Availability windows live in manifest.ts.
 *
 *   pnpm tsx scripts/content-gen/season.ts            # all packs
 *   pnpm tsx scripts/content-gen/season.ts tet-2027   # one pack
 */
import { join } from 'node:path';

import { C, DESIGN_ASSETS, renderPng, rng, writePng } from './common';
import { CAPTION_SLOT, SLOTS } from './frames';

const W = 1200;
const H = 3600;
const OUTER_R = 48;
const SLOT_R = 24;
const CAPTION_Y = CAPTION_SLOT.y + 150;
const S = 512;

type Localized = { en: string; vi: string; th: string };
type Opts = { fill?: string; fill2?: string; ink?: string; sw?: number };
const o = (opts: Opts) => ({ fill: opts.fill ?? '#fff', fill2: opts.fill2 ?? opts.fill ?? '#fff', ink: opts.ink ?? 'none', sw: opts.sw ?? 0 });
const line = (opts: Opts) => (opts.sw ? `stroke="${opts.ink ?? C.ink}" stroke-width="${opts.sw}" stroke-linejoin="round" stroke-linecap="round"` : 'stroke="none"');

/* ---------- motif library: (x, y, size, opts) → svg, drawn around (x, y) ---------- */

const g = (x: number, y: number, s: number, inner: string) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(s / 100).toFixed(3)})">${inner}</g>`;

export const M = {
  bat: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<path d="M0 -10 C -12 -28 -32 -30 -46 -16 C -62 -36 -96 -30 -100 -6 C -82 -10 -68 -2 -62 14 C -48 4 -30 8 -20 26 L0 14 L20 26 C30 8 48 4 62 14 C68 -2 82 -10 100 -6 C96 -30 62 -36 46 -16 C32 -30 12 -28 0 -10 Z" fill="${o(p).fill}" ${line(p)}/>`),
  ghost: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<path d="M-60 80 L-60 -20 A60 60 0 0 1 60 -20 L60 80 L36 60 L12 80 L-12 60 L-36 80 Z" fill="${o(p).fill}" ${line(p)}/><circle cx="-22" cy="-16" r="9" fill="${o(p).ink === 'none' ? C.ink : o(p).ink}"/><circle cx="22" cy="-16" r="9" fill="${o(p).ink === 'none' ? C.ink : o(p).ink}"/><ellipse cx="0" cy="18" rx="10" ry="14" fill="${o(p).ink === 'none' ? C.ink : o(p).ink}"/>`),
  pumpkin: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<path d="M-6 -70 C -4 -86 10 -92 18 -88 C 10 -82 8 -74 8 -64 Z" fill="${o(p).fill2}" ${line(p)}/><ellipse cx="0" cy="0" rx="90" ry="70" fill="${o(p).fill}" ${line(p)}/><ellipse cx="-34" cy="0" rx="40" ry="66" fill="none" ${p.sw ? line({ ...p, sw: Math.max(4, p.sw * 0.5) }) : `stroke="#000" stroke-opacity="0.12" stroke-width="6"`}/><ellipse cx="34" cy="0" rx="40" ry="66" fill="none" ${p.sw ? line({ ...p, sw: Math.max(4, p.sw * 0.5) }) : `stroke="#000" stroke-opacity="0.12" stroke-width="6"`}/>${p.sw ? `<path d="M-40 -14 L-18 -2 L-40 6 Z M40 -14 L18 -2 L40 6 Z" fill="${C.ink}"/><path d="M-30 26 Q0 50 30 26 L22 36 L12 28 L0 40 L-12 28 L-22 36 Z" fill="${C.ink}"/>` : ''}`),
  moon: (x: number, y: number, s: number, p: Opts) => g(x, y, s, `<path d="M20 -90 A90 90 0 1 0 90 30 A66 66 0 1 1 20 -90 Z" fill="${o(p).fill}" ${line(p)}/>`),
  star5: (x: number, y: number, s: number, p: Opts, rot = 0) => {
    const pts: string[] = [];
    for (let i = 0; i < 10; i += 1) {
      const r = i % 2 === 0 ? 100 : 42;
      const a = (Math.PI * i) / 5 - Math.PI / 2 + (rot * Math.PI) / 180;
      pts.push(`${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`);
    }
    return g(x, y, s, `<polygon points="${pts.join(' ')}" fill="${o(p).fill}" ${line(p)}/>`);
  },
  sparkle: (x: number, y: number, s: number, p: Opts) => g(x, y, s, `<path d="M0 -100 Q0 0 100 0 Q0 0 0 100 Q0 0 -100 0 Q0 0 0 -100Z" fill="${o(p).fill}" ${line(p)}/>`),
  snowflake: (x: number, y: number, s: number, p: Opts) => {
    const arm = `<path d="M0 0 L0 -100 M-22 -70 L0 -52 L22 -70 M-18 -40 L0 -26 L18 -40" fill="none" stroke="${o(p).fill}" stroke-width="${p.sw || 12}" stroke-linecap="round"/>`;
    return g(x, y, s, [0, 60, 120, 180, 240, 300].map((a) => `<g transform="rotate(${a})">${arm}</g>`).join(''));
  },
  holly: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<path d="M-6 0 C -30 -10 -60 -4 -90 -30 C -70 -34 -60 -50 -66 -70 C -46 -60 -30 -62 -12 -78 C -16 -56 -10 -36 -6 0 Z" fill="${o(p).fill}" ${line(p)}/><path d="M6 0 C 30 -10 60 -4 90 -30 C 70 -34 60 -50 66 -70 C 46 -60 30 -62 12 -78 C 16 -56 10 -36 6 0 Z" fill="${o(p).fill}" ${line(p)}/><circle cx="-16" cy="14" r="16" fill="${o(p).fill2}" ${line(p)}/><circle cx="16" cy="14" r="16" fill="${o(p).fill2}" ${line(p)}/><circle cx="0" cy="-10" r="16" fill="${o(p).fill2}" ${line(p)}/>`),
  gift: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<rect x="-80" y="-50" width="160" height="130" rx="12" fill="${o(p).fill}" ${line(p)}/><rect x="-14" y="-50" width="28" height="130" fill="${o(p).fill2}" ${line(p)}/><rect x="-80" y="-14" width="160" height="26" fill="${o(p).fill2}" ${line(p)}/><path d="M0 -50 C -20 -90 -70 -92 -60 -60 C -54 -44 -20 -46 0 -50 Z M0 -50 C 20 -90 70 -92 60 -60 C 54 -44 20 -46 0 -50 Z" fill="${o(p).fill2}" ${line(p)}/>`),
  bulb: (x: number, y: number, s: number, p: Opts) => g(x, y, s, `<rect x="-18" y="-70" width="36" height="26" rx="6" fill="#6b7280" ${line(p)}/><path d="M-34 -30 C -34 -60 34 -60 34 -30 C 34 10 10 40 0 60 C -10 40 -34 10 -34 -30 Z" fill="${o(p).fill}" ${line(p)}/>`),
  heart: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<path d="M0 80 C -60 36 -100 0 -90 -40 C -82 -70 -44 -80 0 -44 C 44 -80 82 -70 90 -40 C 100 0 60 36 0 80 Z" fill="${o(p).fill}" ${line(p)}/>`),
  blossom: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-52" rx="34" ry="50" fill="${o(p).fill}" ${line(p)} transform="rotate(${a})"/>`).join('')}<circle r="22" fill="${o(p).fill2}" ${line(p)}/>`),
  lantern: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<rect x="-26" y="-96" width="52" height="16" rx="6" fill="${o(p).fill2}" ${line(p)}/><ellipse cx="0" cy="-10" rx="70" ry="70" fill="${o(p).fill}" ${line(p)}/><path d="M-24 -80 Q-40 -10 -24 60 M24 -80 Q40 -10 24 60 M0 -80 L0 60" fill="none" stroke="${o(p).fill2}" stroke-width="${p.sw ? 8 : 6}" stroke-opacity="${p.sw ? 1 : 0.7}"/><rect x="-26" y="54" width="52" height="16" rx="6" fill="${o(p).fill2}" ${line(p)}/><path d="M-10 70 L-14 100 M0 70 L0 104 M10 70 L14 100" stroke="${o(p).fill2}" stroke-width="6" stroke-linecap="round"/>`),
  envelope: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<rect x="-70" y="-100" width="140" height="200" rx="10" fill="${o(p).fill}" ${line(p)}/><path d="M-70 -100 L0 -30 L70 -100" fill="none" ${p.sw ? line(p) : `stroke="${o(p).fill2}" stroke-width="6"`}/><circle cx="0" cy="-20" r="22" fill="${o(p).fill2}" ${line(p)}/>`),
  coin: (x: number, y: number, s: number, p: Opts) => g(x, y, s, `<circle r="70" fill="${o(p).fill}" ${line(p)}/><rect x="-22" y="-22" width="44" height="44" fill="${o(p).fill2}" ${line(p)}/>`),
  drop: (x: number, y: number, s: number, p: Opts) => g(x, y, s, `<path d="M0 -90 C 40 -30 70 0 70 40 A70 70 0 0 1 -70 40 C -70 0 -40 -30 0 -90 Z" fill="${o(p).fill}" ${line(p)}/>${p.sw ? `<ellipse cx="-26" cy="34" rx="10" ry="18" fill="#fff" transform="rotate(20 -26 34)"/>` : ''}`),
  bubble: (x: number, y: number, s: number, p: Opts) => g(x, y, s, `<circle r="90" fill="${o(p).fill}" fill-opacity="${p.sw ? 1 : 0.35}" ${p.sw ? line(p) : `stroke="${o(p).fill}" stroke-width="8"`}/><ellipse cx="-34" cy="-36" rx="16" ry="26" fill="#fff" transform="rotate(30 -34 -36)"/>`),
  candy: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<path d="M-70 -30 L-110 -60 L-100 0 L-110 60 L-70 30 Z M70 -30 L110 -60 L100 0 L110 60 L70 30 Z" fill="${o(p).fill2}" ${line(p)}/><ellipse rx="70" ry="50" fill="${o(p).fill}" ${line(p)}/><path d="M-30 -40 Q-10 0 -30 40 M10 -46 Q30 0 10 46" fill="none" stroke="${o(p).fill2}" stroke-width="10" stroke-linecap="round"/>`),
  spider: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `${[-60, -20, 20, 60].map((dy) => `<path d="M-30 ${dy / 2} L-90 ${dy - 20} L-110 ${dy + 20} M30 ${dy / 2} L90 ${dy - 20} L110 ${dy + 20}" fill="none" stroke="${o(p).fill}" stroke-width="${p.sw ? 14 : 8}" stroke-linecap="round"/>`).join('')}<circle cx="0" cy="10" r="46" fill="${o(p).fill}" ${line(p)}/><circle cx="0" cy="-46" r="26" fill="${o(p).fill}" ${line(p)}/>${p.sw ? '<circle cx="-9" cy="-50" r="5" fill="#fff"/><circle cx="9" cy="-50" r="5" fill="#fff"/>' : ''}`),
  witchHat: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<path d="M-10 -110 C 30 -80 50 -30 46 20 L-60 20 C -50 -40 -40 -80 -10 -110 Z" fill="${o(p).fill}" ${line(p)}/><ellipse cx="0" cy="24" rx="110" ry="24" fill="${o(p).fill}" ${line(p)}/><path d="M-46 -4 L42 -4" stroke="${o(p).fill2}" stroke-width="14"/>`),
  skull: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<path d="M-80 -10 A80 80 0 1 1 80 -10 L60 50 L60 80 L-60 80 L-60 50 Z" fill="${o(p).fill}" ${line(p)}/><circle cx="-32" cy="-10" r="22" fill="${C.ink}"/><circle cx="32" cy="-10" r="22" fill="${C.ink}"/><path d="M-8 24 L0 10 L8 24 Z" fill="${C.ink}"/><path d="M-30 56 L30 56 M-15 50 L-15 76 M0 50 L0 76 M15 50 L15 76" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/>`),
  tree: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<path d="M0 -110 L50 -40 L24 -40 L70 20 L40 20 L90 80 L-90 80 L-40 20 L-70 20 L-24 -40 L-50 -40 Z" fill="${o(p).fill}" ${line(p)}/><rect x="-18" y="80" width="36" height="30" fill="#8a5a3c" ${line(p)}/>${M.star5(0, -112, 20, { fill: o(p).fill2, ink: p.ink, sw: p.sw ? p.sw * 0.6 : 0 })}`),
  candyCane: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<path d="M-20 100 L-20 -40 A40 40 0 0 1 60 -40" fill="none" stroke="${o(p).fill}" stroke-width="${p.sw ? 44 : 30}" stroke-linecap="round"/><path d="M-20 100 L-20 -40 A40 40 0 0 1 60 -40" fill="none" stroke="${o(p).fill2}" stroke-width="${p.sw ? 30 : 20}" stroke-linecap="round" stroke-dasharray="26 26"/>`),
  snowman: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<circle cx="0" cy="40" r="60" fill="${o(p).fill}" ${line(p)}/><circle cx="0" cy="-44" r="42" fill="${o(p).fill}" ${line(p)}/><rect x="-34" y="-100" width="68" height="14" fill="${C.ink}"/><rect x="-24" y="-130" width="48" height="34" fill="${C.ink}"/><circle cx="-12" cy="-50" r="5" fill="${C.ink}"/><circle cx="12" cy="-50" r="5" fill="${C.ink}"/><path d="M0 -40 L16 -34 L0 -30 Z" fill="${o(p).fill2}"/><path d="M-34 -10 Q0 4 34 -10" fill="none" stroke="${o(p).fill2}" stroke-width="12" stroke-linecap="round"/><circle cx="0" cy="20" r="6" fill="${C.ink}"/><circle cx="0" cy="48" r="6" fill="${C.ink}"/>`),
  bell: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<path d="M-70 60 C -70 -10 -40 -20 -30 -70 C -24 -100 24 -100 30 -70 C 40 -20 70 -10 70 60 Z" fill="${o(p).fill}" ${line(p)}/><rect x="-80" y="56" width="160" height="22" rx="10" fill="${o(p).fill}" ${line(p)}/><circle cx="0" cy="92" r="18" fill="${o(p).fill2}" ${line(p)}/><circle cx="0" cy="-92" r="12" fill="${o(p).fill2}" ${line(p)}/>`),
  santaHat: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<path d="M-80 40 C -60 -40 -10 -100 70 -90 C 20 -70 20 -30 60 40 Z" fill="${o(p).fill}" ${line(p)}/><rect x="-96" y="34" width="166" height="40" rx="20" fill="${o(p).fill2}" ${line(p)}/><circle cx="76" cy="-88" r="22" fill="${o(p).fill2}" ${line(p)}/>`),
  banhChung: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<rect x="-90" y="-90" width="180" height="180" rx="16" fill="${o(p).fill}" ${line(p)}/><path d="M-30 -90 L-30 90 M30 -90 L30 90 M-90 -30 L90 -30 M-90 30 L90 30" fill="none" stroke="${o(p).fill2}" stroke-width="${p.sw ? 14 : 8}"/>`),
  firecracker: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<path d="M0 -110 Q 30 -80 0 -50" fill="none" stroke="${o(p).fill2}" stroke-width="8" stroke-linecap="round"/>${[-50, 0, 50].map((dy) => `<rect x="-40" y="${dy - 20}" width="80" height="44" rx="10" fill="${o(p).fill}" ${line(p)}/><rect x="-40" y="${dy - 2}" width="80" height="8" fill="${o(p).fill2}"/>`).join('')}`),
  rose: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<path d="M-40 60 C -80 40 -90 0 -50 10 Z M40 60 C 80 40 90 0 50 10 Z" fill="${o(p).fill2}" ${line(p)}/><circle r="64" fill="${o(p).fill}" ${line(p)}/><path d="M0 0 m -36 0 a 36 36 0 1 1 72 0 a 24 24 0 1 1 -48 0 a 12 12 0 1 1 24 0" fill="none" stroke="${p.sw ? C.ink : '#000'}" stroke-opacity="${p.sw ? 1 : 0.25}" stroke-width="${p.sw ? 12 : 8}" stroke-linecap="round"/>`),
  arrow: (x: number, y: number, s: number, p: Opts, rot = -30) =>
    g(x, y, s, `<g transform="rotate(${rot})"><path d="M-110 0 L90 0" stroke="${o(p).fill}" stroke-width="${p.sw ? 16 : 8}" stroke-linecap="round"/><path d="M110 0 L80 -22 L86 0 L80 22 Z" fill="${o(p).fill}" ${line(p)}/><path d="M-110 0 L-134 -26 L-104 -8 M-110 0 L-134 26 L-104 8" fill="none" stroke="${o(p).fill}" stroke-width="${p.sw ? 12 : 8}" stroke-linecap="round"/></g>`),
  lips: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<path d="M-100 0 C -60 -50 -20 -46 0 -24 C 20 -46 60 -50 100 0 C 60 56 -60 56 -100 0 Z" fill="${o(p).fill}" ${line(p)}/><path d="M-100 0 L100 0" stroke="${p.sw ? C.ink : '#000'}" stroke-opacity="${p.sw ? 1 : 0.3}" stroke-width="${p.sw ? 10 : 6}"/>`),
  ring: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<circle cy="30" r="64" fill="none" stroke="${o(p).fill}" stroke-width="${p.sw ? 26 : 14}"/>${p.sw ? `<circle cy="30" r="64" fill="none" stroke="${C.ink}" stroke-width="6"/>` : ''}<path d="M0 -100 L40 -62 L0 -20 L-40 -62 Z" fill="${o(p).fill2}" ${line(p)}/>`),
  chocolate: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<rect x="-90" y="-70" width="180" height="140" rx="14" fill="${o(p).fill}" ${line(p)}/><path d="M-30 -70 L-30 70 M30 -70 L30 70 M-90 0 L90 0" stroke="${p.sw ? C.ink : '#000'}" stroke-opacity="${p.sw ? 1 : 0.3}" stroke-width="${p.sw ? 10 : 6}"/>`),
  teddy: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<circle cx="-62" cy="-62" r="30" fill="${o(p).fill}" ${line(p)}/><circle cx="62" cy="-62" r="30" fill="${o(p).fill}" ${line(p)}/><circle r="86" fill="${o(p).fill}" ${line(p)}/><ellipse cy="26" rx="40" ry="30" fill="${o(p).fill2}" ${line(p)}/><ellipse cy="14" rx="14" ry="10" fill="${C.ink}"/><circle cx="-30" cy="-14" r="8" fill="${C.ink}"/><circle cx="30" cy="-14" r="8" fill="${C.ink}"/>`),
  waterGun: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<rect x="-100" y="-30" width="170" height="54" rx="20" fill="${o(p).fill}" ${line(p)}/><rect x="60" y="-18" width="60" height="30" rx="10" fill="${o(p).fill2}" ${line(p)}/><path d="M-60 24 L-70 90 L-20 90 L-10 24 Z" fill="${o(p).fill}" ${line(p)}/><circle cx="-10" cy="-60" r="36" fill="${o(p).fill2}" ${line(p)}/><path d="M-30 30 L-30 54" stroke="${p.sw ? C.ink : o(p).fill2}" stroke-width="${p.sw ? 12 : 8}" stroke-linecap="round"/>`),
  bucket: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<path d="M-80 -40 L-60 90 L60 90 L80 -40 Z" fill="${o(p).fill}" ${line(p)}/><ellipse cy="-40" rx="80" ry="20" fill="${o(p).fill2}" ${line(p)}/><path d="M-70 -46 A70 70 0 0 1 70 -46" fill="none" stroke="${p.sw ? C.ink : o(p).fill2}" stroke-width="${p.sw ? 14 : 10}" stroke-linecap="round"/>`),
  dokKhun: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<path d="M0 -110 L0 -40" stroke="${p.sw ? C.ink : o(p).fill2}" stroke-width="8" stroke-linecap="round"/>${[
      [0, -30],
      [-46, 10],
      [46, 10],
      [-24, 60],
      [24, 60],
      [0, 100],
    ]
      .map(([dx, dy]) => `${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="${dx}" cy="${dy! - 22}" rx="12" ry="22" fill="${o(p).fill}" ${line({ ...p, sw: p.sw ? 6 : 0 })} transform="rotate(${a} ${dx} ${dy})"/>`).join('')}<circle cx="${dx}" cy="${dy}" r="8" fill="${o(p).fill2}"/>`)
      .join('')}`),
  garland: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `${Array.from({ length: 9 }, (_, i) => `<circle cx="${-96 + i * 24}" cy="${Math.sin(i * 0.8) * 10}" r="14" fill="${i % 2 ? o(p).fill2 : o(p).fill}" ${line({ ...p, sw: p.sw ? 8 : 0 })}/>`).join('')}`),
  elephant: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `<ellipse cx="20" cy="10" rx="80" ry="60" fill="${o(p).fill}" ${line(p)}/><rect x="-30" y="40" width="26" height="60" rx="10" fill="${o(p).fill}" ${line(p)}/><rect x="40" y="40" width="26" height="60" rx="10" fill="${o(p).fill}" ${line(p)}/><circle cx="-50" cy="-20" r="50" fill="${o(p).fill}" ${line(p)}/><ellipse cx="-36" cy="-30" rx="30" ry="36" fill="${o(p).fill2}" ${line(p)}/><path d="M-84 10 C -110 30 -120 70 -96 96 C -84 104 -76 92 -84 82 C -98 66 -92 40 -70 26 Z" fill="${o(p).fill}" ${line(p)}/><circle cx="-66" cy="-30" r="7" fill="${C.ink}"/>`),
  splash: (x: number, y: number, s: number, p: Opts) =>
    g(x, y, s, `${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M0 -36 C 30 -60 32 -100 0 -124 C -32 -100 -30 -60 0 -36 Z" fill="${o(p).fill}" ${line(p)} transform="rotate(${a})"/>`).join('')}<circle r="52" fill="${o(p).fill}" ${line(p)}/>`),
};

/* ---------- frame helpers ---------- */

const caption = (text: string, fill: string, size = 56, family = 'Be Vietnam Pro', extra = '') =>
  `<text x="${W / 2}" y="${CAPTION_Y}" text-anchor="middle" font-family="${family}" font-weight="700" font-size="${size}" letter-spacing="${family === 'Prompt' ? 0 : Math.round(size * 0.16)}" fill="${fill}" ${extra}>${text}</text>`;

function frame(body: string, cap: string, defs = ''): string {
  const holes = SLOTS.map((s) => `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${SLOT_R}" fill="#000"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><clipPath id="outer"><rect width="${W}" height="${H}" rx="${OUTER_R}"/></clipPath><mask id="slots"><rect width="${W}" height="${H}" fill="#fff"/>${holes}</mask>${defs}</defs>
<g clip-path="url(#outer)" mask="url(#slots)">${body}</g>${cap}</svg>`;
}
const bg = (fill: string) => `<rect width="${W}" height="${H}" fill="${fill}"/>`;
const pill = (fill: string, w = 520, stroke = '') => `<rect x="${W / 2 - w / 2}" y="3322" width="${w}" height="146" rx="73" fill="${fill}" ${stroke}/>`;
const inCaption = (x: number, y: number, pad: number) => x > 220 - pad && x < 980 + pad && y > 3300 - pad && y < 3480 + pad;
function scatter(seed: number, count: number, margin: number, avoidCaption = true): { x: number; y: number }[] {
  const r = rng(seed);
  const out: { x: number; y: number }[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 300) {
    const x = margin + r() * (W - margin * 2);
    const y = margin + r() * (H - margin * 2);
    if (SLOTS.some((s) => x > s.x - margin && x < s.x + s.w + margin && y > s.y - margin && y < s.y + s.h + margin)) continue;
    if (avoidCaption && inCaption(x, y, margin)) continue;
    if (out.some((q) => Math.hypot(q.x - x, q.y - y) < margin * 2)) continue;
    out.push({ x, y });
  }
  return out;
}
/** Scatter a motif over the border bands; `sizes` = [min, max] motif size. */
const sprinkle = (seed: number, count: number, sizes: [number, number], draw: (x: number, y: number, s: number, r: () => number) => string) => {
  const r = rng(seed + 1000);
  return scatter(seed, count, sizes[1] * 0.9)
    .map(({ x, y }) => draw(x, y, sizes[0] + r() * (sizes[1] - sizes[0]), r))
    .join('');
};
const stripes = (id: string, a: string, b: string) =>
  `<pattern id="${id}" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="120" height="120" fill="${a}"/><rect width="60" height="120" fill="${b}"/></pattern>`;

type FrameDef = { id: string; title: Localized; svg: () => string };
type StickerDef = { id: string; svg: () => string };
export type SeasonPack = { id: string; folder: string; title: Localized; availableFrom: string; availableUntil: string; frames: FrameDef[]; stickers: StickerDef[] };

const stickerWrap = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${inner}</svg>`;
const stickerText = (t: string, size: number, fill: string, bgFill: string, family = 'Be Vietnam Pro', bgStroke = C.ink) => {
  // Keep the label inside the 440px pill: Be Vietnam Pro Bold is ~0.64em per glyph, Prompt ~0.5em.
  const per = family === 'Prompt' ? 0.5 : 0.64;
  const fit = Math.min(size, Math.floor(380 / ([...t].length * per)));
  return stickerWrap(`<rect x="36" y="146" width="440" height="220" rx="48" fill="${bgFill}" stroke="${bgStroke}" stroke-width="20"/><text x="256" y="${256 + fit * 0.36}" text-anchor="middle" font-family="${family}" font-weight="700" font-size="${fit}" fill="${fill}">${t}</text>`);
};
const INK = { ink: C.ink, sw: 20 };

/* ---------- Halloween 2026 ---------- */
const HW = { orange: '#ff7a1a', dark: '#1b1030', purple: '#5b3fa0', lime: '#b6f35c', white: '#ffffff', green: '#4caf50' };
const halloween: SeasonPack = {
  id: 'halloween-2026',
  folder: 'halloween-2026',
  title: { en: 'Halloween', vi: 'Halloween', th: 'ฮาโลวีน' },
  availableFrom: '2026-10-16',
  availableUntil: '2026-11-02',
  frames: [
    { id: 'pumpkin', title: { en: 'Pumpkin', vi: 'Bí ngô', th: 'ฟักทอง' }, svg: () => frame(`${bg(HW.orange)}${sprinkle(1, 40, [18, 34], (x, y, s) => M.bat(x, y, s, { fill: C.ink }))}`, caption('FOURPOP', C.ink)) },
    { id: 'midnight', title: { en: 'Midnight', vi: 'Nửa đêm', th: 'เที่ยงคืน' }, svg: () => frame(`${bg(HW.dark)}${sprinkle(2, 60, [8, 18], (x, y, s) => M.sparkle(x, y, s, { fill: '#fff' }))}${M.moon(1040, 3390, 60, { fill: '#ffe08a' })}`, caption('HAPPY HALLOWEEN', '#fff', 50)) },
    { id: 'boo', title: { en: 'Boo', vi: 'Hù', th: 'บู้' }, svg: () => frame(`${bg(HW.purple)}${sprinkle(3, 26, [22, 40], (x, y, s) => M.ghost(x, y, s, { fill: '#fff' }))}`, caption('BOO!', '#fff', 84)) },
    { id: 'candy', title: { en: 'Candy', vi: 'Kẹo', th: 'ลูกกวาด' }, svg: () => frame(`<rect width="${W}" height="${H}" fill="url(#st)"/>${pill('#fff')}`, caption('TRICK OR TREAT', HW.purple, 48), stripes('st', HW.orange, HW.purple)) },
    { id: 'web', title: { en: 'Web', vi: 'Mạng nhện', th: 'ใยแมงมุม' }, svg: () => {
      const web = (cx: number, cy: number, flip: number) =>
        `<g transform="translate(${cx} ${cy}) scale(${flip} 1)" fill="none" stroke="${C.ink}" stroke-width="3">${[0, 22, 45, 67, 90].map((a) => `<path d="M0 0 L${(300 * Math.cos((a * Math.PI) / 180)).toFixed(0)} ${(300 * Math.sin((a * Math.PI) / 180)).toFixed(0)}"/>`).join('')}${[60, 120, 180, 240].map((r) => `<path d="M${r} 0 Q${(r * 0.72).toFixed(0)} ${(r * 0.3).toFixed(0)} ${(r * 0.707).toFixed(0)} ${(r * 0.707).toFixed(0)} Q${(r * 0.3).toFixed(0)} ${(r * 0.72).toFixed(0)} 0 ${r}"/>`).join('')}</g>`;
      return frame(`${bg('#fff')}${web(0, 0, 1)}${web(W, 0, -1)}${web(0, H, 1).replace('scale(1 1)', 'scale(1 -1)')}${web(W, H, -1).replace('scale(-1 1)', 'scale(-1 -1)')}${M.spider(1010, 3400, 34, { fill: C.ink })}`, caption('FOURPOP', C.ink));
    } },
    { id: 'slime', title: { en: 'Slime', vi: 'Nhớt xanh', th: 'สไลม์' }, svg: () => frame(`${bg(HW.lime)}${sprinkle(6, 24, [22, 36], (x, y, s) => M.pumpkin(x, y, s, { fill: HW.orange, fill2: HW.green }))}`, caption('FOURPOP', C.ink)) },
  ],
  stickers: [
    { id: 'pumpkin', svg: () => stickerWrap(M.pumpkin(256, 276, 190, { fill: HW.orange, fill2: HW.green, ...INK })) },
    { id: 'ghost', svg: () => stickerWrap(M.ghost(256, 256, 220, { fill: '#fff', ...INK })) },
    { id: 'bat', svg: () => stickerWrap(M.bat(256, 256, 200, { fill: '#2b2240', ...INK })) },
    { id: 'candy', svg: () => stickerWrap(M.candy(256, 256, 180, { fill: HW.orange, fill2: HW.purple, ...INK })) },
    { id: 'spider', svg: () => stickerWrap(M.spider(256, 256, 180, { fill: '#2b2240', ...INK })) },
    { id: 'witch-hat', svg: () => stickerWrap(M.witchHat(256, 276, 190, { fill: HW.purple, fill2: HW.orange, ...INK })) },
    { id: 'skull', svg: () => stickerWrap(M.skull(256, 256, 200, { fill: '#fff', ...INK })) },
    { id: 'boo', svg: () => stickerText('BOO!', 150, '#fff', HW.purple) },
  ],
};

/* ---------- Christmas 2026 ---------- */
const XM = { red: '#d7263d', green: '#2f7d4f', gold: '#f2c14e', cream: '#fff8ee', navy: '#16213e' };
const xmas: SeasonPack = {
  id: 'xmas-2026',
  folder: 'xmas-2026',
  title: { en: 'Christmas', vi: 'Giáng sinh', th: 'คริสต์มาส' },
  availableFrom: '2026-11-20',
  availableUntil: '2026-12-31',
  frames: [
    { id: 'holly', title: { en: 'Holly', vi: 'Nhựa ruồi', th: 'ฮอลลี่' }, svg: () => frame(`${bg(XM.cream)}${M.holly(120, 3400, 70, { fill: XM.green, fill2: XM.red })}${M.holly(1080, 3400, 70, { fill: XM.green, fill2: XM.red })}${sprinkle(11, 30, [8, 14], (x, y, s) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.toFixed(1)}" fill="${XM.red}"/>`)}`, caption('FOURPOP', XM.green)) },
    { id: 'snow', title: { en: 'Snow', vi: 'Tuyết', th: 'หิมะ' }, svg: () => frame(`${bg(XM.red)}${sprinkle(12, 40, [12, 26], (x, y, s) => M.snowflake(x, y, s, { fill: '#fff' }))}`, caption('FOURPOP', '#fff')) },
    { id: 'gift', title: { en: 'Gift', vi: 'Quà', th: 'ของขวัญ' }, svg: () => frame(`${bg(XM.green)}<rect x="${W / 2 - 40}" y="0" width="80" height="${H}" fill="${XM.gold}"/><rect x="0" y="3230" width="${W}" height="60" fill="${XM.gold}"/>${M.gift(600, 3330, 0, { fill: XM.gold })}<path d="M600 3260 C 560 3200 470 3200 490 3250 C 500 3280 560 3272 600 3260 Z M600 3260 C 640 3200 730 3200 710 3250 C 700 3280 640 3272 600 3260 Z" fill="${XM.gold}"/>`, caption('FOURPOP', XM.gold).replace(`y="${CAPTION_Y}"`, `y="${CAPTION_Y + 40}"`)) },
    { id: 'lights', title: { en: 'Lights', vi: 'Đèn', th: 'ไฟประดับ' }, svg: () => {
      const colors = [XM.red, XM.gold, XM.green, '#4db8ff', '#ff8fb1'];
      const r = rng(13);
      const bulbs = scatter(13, 44, 34).map(({ x, y }) => M.bulb(x, y, 30, { fill: colors[Math.floor(r() * colors.length)]! })).join('');
      return frame(`${bg(XM.navy)}${bulbs}`, caption('MERRY XMAS', '#fff', 52));
    } },
    { id: 'candy-cane', title: { en: 'Candy Cane', vi: 'Kẹo gậy', th: 'ลูกกวาดไม้เท้า' }, svg: () => frame(`<rect width="${W}" height="${H}" fill="url(#cc)"/>${pill('#fff')}`, caption('FOURPOP', XM.red), stripes('cc', XM.red, '#fff')) },
    { id: 'tree', title: { en: 'Tree', vi: 'Cây thông', th: 'ต้นคริสต์มาส' }, svg: () => frame(`${bg(XM.cream)}${sprinkle(16, 22, [22, 36], (x, y, s) => M.tree(x, y, s, { fill: XM.green, fill2: XM.gold }))}`, caption('MERRY XMAS', XM.green, 52)) },
  ],
  stickers: [
    { id: 'tree', svg: () => stickerWrap(M.tree(256, 270, 180, { fill: XM.green, fill2: XM.gold, ...INK })) },
    { id: 'gift', svg: () => stickerWrap(M.gift(256, 266, 200, { fill: XM.red, fill2: XM.gold, ...INK })) },
    { id: 'candy-cane', svg: () => stickerWrap(M.candyCane(246, 256, 190, { fill: XM.red, fill2: '#fff', ...INK })) },
    { id: 'snowman', svg: () => stickerWrap(M.snowman(256, 276, 170, { fill: '#fff', fill2: XM.red, ...INK })) },
    { id: 'bell', svg: () => stickerWrap(M.bell(256, 256, 200, { fill: XM.gold, fill2: XM.red, ...INK })) },
    { id: 'santa-hat', svg: () => stickerWrap(M.santaHat(256, 266, 200, { fill: XM.red, fill2: '#fff', ...INK })) },
    { id: 'snowflake', svg: () => stickerWrap(`${M.snowflake(256, 256, 200, { fill: C.ink, sw: 44 })}${M.snowflake(256, 256, 200, { fill: '#7fd2ff', sw: 22 })}`) },
    { id: 'hohoho', svg: () => stickerText('HO HO HO', 92, '#fff', XM.red) },
  ],
};

/* ---------- Tết 2027 ---------- */
const TT = { red: '#e5322d', deep: '#b3121b', gold: '#f5c04a', pink: '#ff9ec4', mai: '#ffd34d', cream: '#fff6e5', blossomBg: '#ffe4ee', green: '#3f8f5a' };
const tet: SeasonPack = {
  id: 'tet-2027',
  folder: 'tet-2027',
  title: { en: 'Tết 2027', vi: 'Tết 2027', th: 'เต๊ต 2027' },
  availableFrom: '2027-01-16',
  availableUntil: '2027-02-21',
  frames: [
    { id: 'lixi', title: { en: 'Lì xì', vi: 'Lì xì', th: 'ซองอั่งเปา' }, svg: () => frame(`${bg(TT.red)}${sprinkle(21, 40, [14, 24], (x, y, s) => M.coin(x, y, s, { fill: TT.gold, fill2: TT.red }))}${M.envelope(140, 3390, 40, { fill: TT.deep, fill2: TT.gold })}${M.envelope(1060, 3390, 40, { fill: TT.deep, fill2: TT.gold })}`, caption('CHÚC MỪNG NĂM MỚI', TT.gold, 46)) },
    { id: 'hoa-mai', title: { en: 'Hoa mai', vi: 'Hoa mai', th: 'ดอกเหมย' }, svg: () => frame(`${bg(TT.cream)}${sprinkle(22, 40, [16, 30], (x, y, s) => M.blossom(x, y, s, { fill: TT.mai, fill2: '#c8771d' }))}`, caption('FOURPOP', TT.red)) },
    { id: 'hoa-dao', title: { en: 'Hoa đào', vi: 'Hoa đào', th: 'ดอกท้อ' }, svg: () => frame(`${bg(TT.blossomBg)}${sprinkle(23, 40, [16, 30], (x, y, s) => M.blossom(x, y, s, { fill: TT.pink, fill2: '#d6336c' }))}`, caption('FOURPOP', TT.deep)) },
    { id: 'lantern', title: { en: 'Lantern', vi: 'Đèn lồng', th: 'โคมแดง' }, svg: () => frame(`${bg(TT.deep)}${sprinkle(24, 22, [22, 34], (x, y, s) => M.lantern(x, y, s, { fill: TT.red, fill2: TT.gold }))}`, caption('FOURPOP', TT.gold)) },
    { id: 'gold', title: { en: 'Gold', vi: 'Vàng', th: 'ทอง' }, svg: () => frame(`<rect width="${W}" height="${H}" fill="url(#tg)"/>${pill(TT.gold)}`, caption('FOURPOP', TT.deep), `<pattern id="tg" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="100" height="100" fill="${TT.gold}"/><rect x="20" y="20" width="60" height="60" fill="${TT.red}"/></pattern>`) },
    { id: 'tet-2027', title: { en: 'Tết 2027', vi: 'Tết 2027', th: 'เต๊ต 2027' }, svg: () => frame(`${bg(TT.red)}${sprinkle(26, 40, [10, 22], (x, y, s) => M.sparkle(x, y, s, { fill: TT.gold }))}<text x="${W / 2}" y="3330" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="700" font-size="96" fill="${TT.gold}">2027</text>`, caption('CHÚC MỪNG NĂM MỚI', TT.gold, 40).replace(`y="${CAPTION_Y}"`, `y="${CAPTION_Y + 40}"`)) },
  ],
  stickers: [
    { id: 'lixi', svg: () => stickerWrap(M.envelope(256, 256, 190, { fill: TT.red, fill2: TT.gold, ...INK })) },
    { id: 'hoa-mai', svg: () => stickerWrap(M.blossom(256, 266, 190, { fill: TT.mai, fill2: '#c8771d', ...INK })) },
    { id: 'hoa-dao', svg: () => stickerWrap(M.blossom(256, 266, 190, { fill: TT.pink, fill2: '#d6336c', ...INK })) },
    { id: 'lantern', svg: () => stickerWrap(M.lantern(256, 256, 190, { fill: TT.red, fill2: TT.gold, ...INK })) },
    { id: 'firecracker', svg: () => stickerWrap(M.firecracker(256, 266, 180, { fill: TT.red, fill2: TT.gold, ...INK })) },
    { id: 'banh-chung', svg: () => stickerWrap(M.banhChung(256, 256, 180, { fill: TT.green, fill2: '#e8d7a0', ...INK })) },
    { id: 'coin', svg: () => stickerWrap(M.coin(256, 256, 220, { fill: TT.gold, fill2: TT.red, ...INK })) },
    { id: '2027', svg: () => stickerText('2027', 150, TT.gold, TT.red) },
  ],
};

/* ---------- Valentine 2027 ---------- */
const VL = { pink: '#ff6b9d', red: '#e63950', cream: '#fff5f7', brown: '#6b3e26', soft: '#ffd6e4', deep: '#9b1b3a' };
const valentine: SeasonPack = {
  id: 'valentine-2027',
  folder: 'valentine-2027',
  title: { en: 'Valentine', vi: 'Valentine', th: 'วาเลนไทน์' },
  availableFrom: '2027-02-01',
  availableUntil: '2027-02-15',
  frames: [
    { id: 'hearts', title: { en: 'Hearts', vi: 'Trái tim', th: 'หัวใจ' }, svg: () => frame(`${bg(VL.cream)}${sprinkle(31, 44, [12, 26], (x, y, s) => M.heart(x, y, s, { fill: VL.red }))}`, caption('FOURPOP', VL.red)) },
    { id: 'letter', title: { en: 'Love Letter', vi: 'Thư tình', th: 'จดหมายรัก' }, svg: () => frame(`${bg(VL.soft)}${sprinkle(32, 20, [20, 30], (x, y, s) => M.envelope(x, y, s, { fill: '#fff', fill2: VL.red }))}`, caption('FOURPOP', VL.deep)) },
    { id: 'choco', title: { en: 'Choco', vi: 'Sô-cô-la', th: 'ช็อกโกแลต' }, svg: () => frame(`${bg(VL.brown)}${sprinkle(33, 40, [12, 24], (x, y, s) => M.heart(x, y, s, { fill: VL.pink }))}`, caption('FOURPOP', VL.pink)) },
    { id: 'xoxo', title: { en: 'XOXO', vi: 'XOXO', th: 'XOXO' }, svg: () => frame(`${bg(VL.pink)}${sprinkle(34, 30, [10, 18], (x, y, s) => M.sparkle(x, y, s, { fill: '#fff' }))}`, caption('XOXO', '#fff', 84)) },
    { id: 'cupid', title: { en: 'Cupid', vi: 'Thần tình yêu', th: 'กามเทพ' }, svg: () => frame(`${bg('#fff')}${sprinkle(35, 20, [20, 30], (x, y, s, r) => M.arrow(x, y, s, { fill: VL.red }, -40 + r() * 80))}${sprinkle(36, 20, [10, 18], (x, y, s) => M.heart(x, y, s, { fill: VL.pink }))}`, caption('FOURPOP', VL.red)) },
    { id: 'rose', title: { en: 'Rose', vi: 'Hoa hồng', th: 'กุหลาบ' }, svg: () => frame(`${bg(VL.deep)}${sprinkle(37, 26, [18, 30], (x, y, s) => M.rose(x, y, s, { fill: VL.red, fill2: '#3f8f5a' }))}`, caption('LOVE', VL.cream, 72)) },
  ],
  stickers: [
    { id: 'heart-arrow', svg: () => stickerWrap(`${M.heart(256, 256, 190, { fill: VL.red, ...INK })}${M.arrow(256, 236, 170, { fill: C.ink, sw: 0 }, -35)}`) },
    { id: 'rose', svg: () => stickerWrap(M.rose(256, 256, 200, { fill: VL.red, fill2: '#3f8f5a', ...INK })) },
    { id: 'chocolate', svg: () => stickerWrap(M.chocolate(256, 256, 190, { fill: VL.brown, ...INK })) },
    { id: 'love-letter', svg: () => stickerWrap(M.envelope(256, 256, 190, { fill: '#fff', fill2: VL.red, ...INK })) },
    { id: 'lips', svg: () => stickerWrap(M.lips(256, 256, 190, { fill: VL.red, ...INK })) },
    { id: 'ring', svg: () => stickerWrap(M.ring(256, 266, 190, { fill: '#f2c14e', fill2: '#bfe9ff', ...INK })) },
    { id: 'teddy', svg: () => stickerWrap(M.teddy(256, 266, 180, { fill: '#c89b6d', fill2: '#f4e1c6', ...INK })) },
    { id: 'love-u', svg: () => stickerText('LOVE U', 120, '#fff', VL.pink) },
  ],
};

/* ---------- Songkran 2027 ---------- */
const SK = { blue: '#4db8ff', deep: '#1b6fd1', sky: '#e3f3ff', yellow: '#ffd23f', teal: '#2ec4b6', pink: '#ff8fb1', white: '#ffffff' };
const songkran: SeasonPack = {
  id: 'songkran-2027',
  folder: 'songkran-2027',
  title: { en: 'Songkran', vi: 'Songkran', th: 'สงกรานต์' },
  availableFrom: '2027-04-01',
  availableUntil: '2027-04-20',
  frames: [
    { id: 'splash', title: { en: 'Splash', vi: 'Té nước', th: 'สาดน้ำ' }, svg: () => frame(`${bg(SK.blue)}${sprinkle(41, 44, [12, 26], (x, y, s) => M.drop(x, y, s, { fill: '#fff' }))}${M.splash(600, 3230, 40, { fill: '#fff' })}`, caption('FOURPOP', '#fff').replace(`y="${CAPTION_Y}"`, `y="${CAPTION_Y + 30}"`)) },
    { id: 'dok-khun', title: { en: 'Dok Khun', vi: 'Hoa muồng', th: 'ดอกคูน' }, svg: () => frame(`${bg('#fff')}${sprinkle(42, 22, [20, 32], (x, y, s) => M.dokKhun(x, y, s, { fill: SK.yellow, fill2: '#c8771d' }))}`, caption('FOURPOP', SK.deep)) },
    { id: 'bubbles', title: { en: 'Bubbles', vi: 'Bong bóng', th: 'ฟองน้ำ' }, svg: () => frame(`${bg(SK.sky)}${sprinkle(43, 36, [12, 30], (x, y, s) => M.bubble(x, y, s, { fill: SK.blue }))}`, caption('FOURPOP', SK.deep)) },
    { id: 'waves', title: { en: 'Waves', vi: 'Sóng', th: 'คลื่น' }, svg: () => {
      const wave = (y: number, fill: string) => {
        let d = `M-40 ${y}`;
        for (let x = -40; x <= W + 40; x += 120) d += ` q 30 -26 60 0 t 60 0`;
        return `<path d="${d} V ${H + 40} H -40 Z" fill="${fill}"/>`;
      };
      return frame(`${bg(SK.teal)}${wave(3320, '#fff')}${wave(3390, SK.teal)}${wave(3460, '#fff')}${wave(3530, SK.teal)}${pill(SK.teal)}`, caption('FOURPOP', '#fff'));
    } },
    { id: 'malai', title: { en: 'Malai', vi: 'Vòng hoa', th: 'พวงมาลัย' }, svg: () => frame(`${bg('#fff4f8')}${sprinkle(45, 30, [18, 28], (x, y, s) => M.garland(x, y, s, { fill: SK.pink, fill2: SK.yellow }))}`, caption('FOURPOP', SK.pink)) },
    { id: 'sawasdee', title: { en: 'Sawasdee Pi Mai', vi: 'Sawasdee Pi Mai', th: 'สวัสดีปีใหม่ไทย' }, svg: () => frame(`${bg(SK.deep)}${sprinkle(46, 34, [10, 22], (x, y, s) => M.drop(x, y, s, { fill: SK.blue }))}<text x="${W / 2}" y="3330" text-anchor="middle" font-family="Prompt" font-weight="700" font-size="60" fill="#fff">สุขสันต์วันสงกรานต์</text>`, caption('SAWASDEE PI MAI 2027', SK.yellow, 36).replace(`y="${CAPTION_Y}"`, `y="${CAPTION_Y + 44}"`)) },
  ],
  stickers: [
    { id: 'water-gun', svg: () => stickerWrap(M.waterGun(256, 256, 180, { fill: SK.blue, fill2: SK.yellow, ...INK })) },
    { id: 'drop', svg: () => stickerWrap(M.drop(256, 266, 200, { fill: SK.blue, ...INK })) },
    { id: 'bucket', svg: () => stickerWrap(M.bucket(256, 266, 180, { fill: SK.teal, fill2: SK.deep, ...INK })) },
    { id: 'dok-khun', svg: () => stickerWrap(M.dokKhun(256, 256, 180, { fill: SK.yellow, fill2: '#c8771d', ...INK })) },
    { id: 'garland', svg: () => stickerWrap(`<g transform="rotate(-30 256 256)">${M.garland(256, 256, 220, { fill: SK.pink, fill2: '#fff8dc', ...INK })}</g>`) },
    { id: 'elephant', svg: () => stickerWrap(M.elephant(256, 256, 190, { fill: '#9fb3c8', fill2: SK.pink, ...INK })) },
    { id: 'splash', svg: () => stickerWrap(M.splash(256, 256, 200, { fill: SK.blue, ...INK })) },
    { id: 'songkran', svg: () => stickerText('สงกรานต์', 110, '#fff', SK.deep, 'Prompt') },
  ],
};

export const SEASON_PACKS: SeasonPack[] = [halloween, xmas, tet, valentine, songkran];

if (process.argv[1]?.endsWith('season.ts')) {
  const only = process.argv[2];
  for (const pack of SEASON_PACKS) {
    if (only && pack.id !== only) continue;
    for (const f of pack.frames) {
      const svg = f.svg();
      writePng(join(DESIGN_ASSETS, 'frames', pack.folder, `${f.id}.png`), renderPng(svg));
      writePng(join(DESIGN_ASSETS, 'frames', pack.folder, `${f.id}-thumb.png`), renderPng(svg, 200));
    }
    for (const s of pack.stickers) writePng(join(DESIGN_ASSETS, 'stickers', pack.folder, `${s.id}.png`), renderPng(s.svg()));
    console.log(`${pack.id}: ${pack.frames.length} frames + ${pack.stickers.length} stickers`);
  }
}
