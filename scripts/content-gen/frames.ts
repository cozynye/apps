/**
 * Generates the bundled "Pop" frame pack (design/assets/frames/pop): 10 strip4 frames at 1200×3600
 * with the base slot geometry (frames README), plus 200×600 thumbnails.
 *
 *   pnpm tsx scripts/content-gen/frames.ts
 */
import { join } from 'node:path';

import { C, DESIGN_ASSETS, renderPng, rng, writePng } from './common';

const W = 1200;
const H = 3600;
const OUTER_R = 48;
const SLOT_R = 24;
export const SLOTS = [0, 1, 2, 3].map((i) => ({ x: 60, y: 80 + 780 * i, w: 1080, h: 720 }));
export const CAPTION_SLOT = { x: 60, y: 3260, w: 1080, h: 220 };
/** Decorations may use the bottom band but must leave the caption text clear. */
const CAPTION_CLEAR = { x: 280, y: 3310, w: 640, h: 170 };

const caption = (text: string, fill: string, size = 56) =>
  `<text x="${W / 2}" y="${CAPTION_SLOT.y + 150}" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="700" font-size="${size}" letter-spacing="${Math.round(size * 0.18)}" fill="${fill}">${text}</text>`;

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

const inCaptionClear = (x: number, y: number, pad = 0) =>
  x > CAPTION_CLEAR.x - pad && x < CAPTION_CLEAR.x + CAPTION_CLEAR.w + pad && y > CAPTION_CLEAR.y - pad && y < CAPTION_CLEAR.y + CAPTION_CLEAR.h + pad;

/** Points on the border bands (outside every slot), for scattered decorations. */
function scatter(seed: number, count: number, margin: number, avoidCaption = true): { x: number; y: number }[] {
  const r = rng(seed);
  const out: { x: number; y: number }[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 200) {
    const x = margin + r() * (W - margin * 2);
    const y = margin + r() * (H - margin * 2);
    const inSlot = SLOTS.some((s) => x > s.x - margin && x < s.x + s.w + margin && y > s.y - margin && y < s.y + s.h + margin);
    if (inSlot) continue;
    if (avoidCaption && inCaptionClear(x, y, margin)) continue;
    if (out.some((p) => Math.hypot(p.x - x, p.y - y) < margin * 2.2)) continue;
    out.push({ x, y });
  }
  return out;
}

const bg = (fill: string) => `<rect width="${W}" height="${H}" fill="${fill}"/>`;

/* ---------- the ten frames ---------- */

function sunset() {
  const defs = `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.primary}"/><stop offset="0.55" stop-color="#ffb48f"/><stop offset="1" stop-color="${C.mood4}"/></linearGradient>`;
  // Solid mat ring keeps the outer edge one color (B8 fills the JPEG corners with the edge color).
  const body = `${bg(C.primary)}<rect x="30" y="30" width="${W - 60}" height="${H - 60}" rx="${OUTER_R - 18}" fill="url(#g)"/>
<circle cx="${W / 2}" cy="3395" r="120" fill="#fff" fill-opacity="0.35"/>`;
  return frame(body, caption('FOURPOP', C.ink), defs);
}

function stardust() {
  const r = rng(7);
  const stars = scatter(11, 70, 26)
    .map(({ x, y }) => {
      const s = 10 + r() * 16;
      const fill = r() > 0.5 ? '#fff' : '#c9bdf0';
      return `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" d="M0 ${-s} Q0 0 ${s} 0 Q0 0 0 ${s} Q0 0 ${-s} 0 Q0 0 0 ${-s}Z" fill="${fill}"/>`;
    })
    .join('');
  const moon = `<path d="M 600 3330 a 70 70 0 1 0 60 108 a 52 52 0 1 1 -60 -108 z" fill="#fff" transform="translate(-440 0)"/>`;
  return frame(`${bg(C.lavender)}${stars}${moon}`, caption('FOURPOP', C.lavenderDeep));
}

function gingham() {
  const defs = `<pattern id="p" width="160" height="160" patternUnits="userSpaceOnUse">
<rect width="160" height="160" fill="#fff"/>
<rect width="80" height="160" fill="#ffd1cc"/>
<rect width="160" height="80" fill="#ffd1cc"/>
<rect width="80" height="80" fill="#ffb8b1"/></pattern>`;
  const pill = `<rect x="${W / 2 - 260}" y="3320" width="520" height="150" rx="75" fill="#fff"/>`;
  return frame(`${bg('#fff')}<rect width="${W}" height="${H}" fill="url(#p)"/>${pill}`, caption('FOURPOP', C.deep), defs);
}

function confetti() {
  const r = rng(3);
  const colors = [C.primary, C.mint, C.mood4, '#8f7fc9', C.skyDeep];
  const pieces = scatter(5, 110, 22)
    .map(({ x, y }) => {
      const c = colors[Math.floor(r() * colors.length)]!;
      const rot = Math.round(r() * 180);
      return r() > 0.4
        ? `<rect x="${(x - 14).toFixed(1)}" y="${(y - 7).toFixed(1)}" width="28" height="14" rx="4" fill="${c}" transform="rotate(${rot} ${x.toFixed(1)} ${y.toFixed(1)})"/>`
        : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="${c}"/>`;
    })
    .join('');
  return frame(`${bg('#fffdf9')}${pieces}`, caption('FOURPOP', C.ink));
}

function sky() {
  const cloud = (x: number, y: number, s: number) =>
    `<g transform="translate(${x} ${y}) scale(${s})" fill="#fff"><circle cx="0" cy="0" r="38"/><circle cx="40" cy="-14" r="46"/><circle cx="88" cy="0" r="36"/><rect x="-10" y="0" width="110" height="38" rx="19"/></g>`;
  const clouds = [cloud(90, 3400, 1), cloud(960, 3380, 0.9), cloud(140, 3300, 0.55), cloud(1010, 3470, 0.5)].join('');
  const sun = `<circle cx="1040" cy="40" r="60" fill="${C.mood4}"/>`;
  return frame(`${bg(C.sky)}${sun}${clouds}`, caption('FOURPOP', C.ink));
}

function checker() {
  const defs = `<pattern id="p" width="120" height="120" patternUnits="userSpaceOnUse"><rect width="120" height="120" fill="#fff"/><rect width="60" height="60" fill="${C.ink}"/><rect x="60" y="60" width="60" height="60" fill="${C.ink}"/></pattern>`;
  const pill = `<rect x="${W / 2 - 250}" y="3325" width="500" height="140" rx="70" fill="#fff" stroke="${C.ink}" stroke-width="8"/>`;
  return frame(`<rect width="${W}" height="${H}" fill="url(#p)"/>${pill}`, caption('FOURPOP', C.ink), defs);
}

function ribbon() {
  const inset = (d: number, w: number) =>
    `<rect x="${d}" y="${d}" width="${W - d * 2}" height="${H - d * 2}" rx="${OUTER_R - d}" fill="none" stroke="${C.ink}" stroke-width="${w}"/>`;
  const bow = `<g transform="translate(600 3286) scale(1.3)" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round">
<path d="M-10 0 C-80 -70 -170 -60 -170 -10 C-170 40 -80 50 -10 0 Z" fill="${C.primary}"/>
<path d="M10 0 C80 -70 170 -60 170 -10 C170 40 80 50 10 0 Z" fill="${C.primary}"/>
<path d="M-12 6 L-60 70 L-24 72 L0 30 Z" fill="${C.deep}"/>
<path d="M12 6 L60 70 L24 72 L0 30 Z" fill="${C.deep}"/>
<circle cx="0" cy="0" r="24" fill="${C.deep}"/></g>`;
  return frame(`${bg(C.cream)}${inset(22, 4)}${inset(36, 4)}${bow}`, caption('FOURPOP', C.deep).replace('y="3410"', 'y="3440"'));
}

function daisy() {
  const r = rng(21);
  const flower = (x: number, y: number, s: number) => {
    const petals = [0, 45, 90, 135].map((a) => `<ellipse cx="0" cy="0" rx="${s}" ry="${s * 0.36}" transform="rotate(${a})" fill="#fff"/>`).join('');
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">${petals}<circle r="${s * 0.3}" fill="${C.mood4}"/></g>`;
  };
  const flowers = scatter(9, 60, 30).map(({ x, y }) => flower(x, y, 16 + r() * 14)).join('');
  return frame(`${bg(C.mintSoft)}${flowers}`, caption('FOURPOP', C.ink));
}

function notebook() {
  const defs = `<pattern id="p" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#fff"/><path d="M60 0 V60 M0 60 H60" stroke="#cfe2ff" stroke-width="3"/></pattern>`;
  const major = [300, 600, 900].map((v) => `<path d="M${v} 0 V${H} M0 ${v} H${W} M0 ${v + 1200} H${W} M0 ${v + 2400} H${W}" stroke="#b7d3f7" stroke-width="4"/>`).join('');
  const holes = [0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${30}" cy="${300 + i * 600}" r="14" fill="#fff" stroke="#b7d3f7" stroke-width="4"/>`).join('');
  return frame(`<rect width="${W}" height="${H}" fill="url(#p)"/>${major}${holes}`, caption('FOURPOP', C.skyDeep), defs);
}

function waves() {
  const wave = (y: number, fill: string, amp: number) => {
    let d = `M-40 ${y}`;
    for (let x = -40; x <= W + 40; x += 120) d += ` q 30 ${-amp} 60 0 t 60 0`;
    d += ` V ${H + 40} H -40 Z`;
    return `<path d="${d}" fill="${fill}"/>`;
  };
  const body = `${bg(C.soft)}${wave(3330, '#fff', 26)}${wave(3390, C.mint, 26)}${wave(3450, '#fff', 26)}${wave(3510, C.mint, 26)}`;
  const pill = `<rect x="${W / 2 - 250}" y="3325" width="500" height="140" rx="70" fill="${C.soft}"/>`;
  return frame(`${body}${pill}`, caption('FOURPOP', C.ink));
}

export const POP_FRAMES: { id: string; svg: () => string; title: { en: string; vi: string; th: string } }[] = [
  { id: 'sunset', svg: sunset, title: { en: 'Sunset', vi: 'Hoàng hôn', th: 'พระอาทิตย์ตก' } },
  { id: 'stardust', svg: stardust, title: { en: 'Stardust', vi: 'Bụi sao', th: 'ละอองดาว' } },
  { id: 'gingham', svg: gingham, title: { en: 'Gingham', vi: 'Kẻ caro', th: 'ลายตาราง' } },
  { id: 'confetti', svg: confetti, title: { en: 'Confetti', vi: 'Confetti', th: 'คอนเฟตติ' } },
  { id: 'sky', svg: sky, title: { en: 'Sky', vi: 'Bầu trời', th: 'ท้องฟ้า' } },
  { id: 'checker', svg: checker, title: { en: 'Checker', vi: 'Bàn cờ', th: 'หมากรุก' } },
  { id: 'ribbon', svg: ribbon, title: { en: 'Ribbon', vi: 'Nơ', th: 'โบว์' } },
  { id: 'daisy', svg: daisy, title: { en: 'Daisy', vi: 'Cúc họa mi', th: 'เดซี่' } },
  { id: 'notebook', svg: notebook, title: { en: 'Notebook', vi: 'Vở ô li', th: 'สมุดกริด' } },
  { id: 'waves', svg: waves, title: { en: 'Waves', vi: 'Sóng', th: 'คลื่น' } },
];

if (process.argv[1]?.endsWith('frames.ts')) {
  const out = join(DESIGN_ASSETS, 'frames/pop');
  for (const f of POP_FRAMES) {
    const svg = f.svg();
    writePng(join(out, `${f.id}.png`), renderPng(svg));
    writePng(join(out, `${f.id}-thumb.png`), renderPng(svg, 200));
    console.log(`frames/pop/${f.id}.png + thumb`);
  }
}
