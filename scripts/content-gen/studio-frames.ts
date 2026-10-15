/**
 * Generates the bundled "Studio" frame pack (design/assets/frames/studio): the minimal looks Korean
 * photo-booth brands are known for (Cozy 2026-10-16: 인생네컷·포토이즘·하루필름·포토그레이·그믐달 참고) —
 * solid black/white/grey/pastel mats with a small wordmark bottom-right and the date stamp area
 * (bottom-left, DATE_STAMP in geometry) left clear, plus aurora, moon and mono-band variants.
 *
 *   pnpm tsx scripts/content-gen/studio-frames.ts
 */
import { join } from 'node:path';

import { C, DESIGN_ASSETS, renderPng, writePng } from './common';
import { CAPTION_SLOT, SLOTS } from './frames';

const W = 1200;
const H = 3600;
const OUTER_R = 48;
const SLOT_R = 24;

const ST = {
  black: '#0d0d0f',
  white: '#ffffff',
  grey: '#d9d9d9',
  greyInk: '#5a5a60',
  ivory: '#f3eee4',
  filmOrange: '#ff8a3c',
  pink: '#ffd9e2',
  powder: '#d6e6f5',
  navy: '#0b0f1f',
  cocoa: '#4a2c2a',
  cream: '#f6e9d8',
} as const;

/** Small wordmark bottom-right (booth logo position); the date stamp sits bottom-left. */
const wordmark = (fill: string, text = 'FOURPOP', y = CAPTION_SLOT.y + 150) =>
  `<text x="${W - 90}" y="${y}" text-anchor="end" font-family="Be Vietnam Pro" font-weight="700" font-size="34" letter-spacing="8" fill="${fill}">${text}</text>`;
const sub = (fill: string, text: string, y = CAPTION_SLOT.y + 196) =>
  `<text x="${W - 90}" y="${y}" text-anchor="end" font-family="Be Vietnam Pro" font-weight="400" font-size="22" letter-spacing="4" fill="${fill}" fill-opacity="0.8">${text}</text>`;

function frame(body: string, cap: string, defs = ''): string {
  const holes = SLOTS.map((s) => `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${SLOT_R}" fill="#000"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><clipPath id="outer"><rect width="${W}" height="${H}" rx="${OUTER_R}"/></clipPath><mask id="slots"><rect width="${W}" height="${H}" fill="#fff"/>${holes}</mask>${defs}</defs>
<g clip-path="url(#outer)" mask="url(#slots)">${body}</g>${cap}</svg>`;
}
const bg = (fill: string) => `<rect width="${W}" height="${H}" fill="${fill}"/>`;
/** Hairline around each slot (photo-print look). */
const slotLines = (stroke: string, w = 3, inset = 8) =>
  SLOTS.map((s) => `<rect x="${s.x - inset}" y="${s.y - inset}" width="${s.w + inset * 2}" height="${s.h + inset * 2}" rx="${SLOT_R + inset - 2}" fill="none" stroke="${stroke}" stroke-width="${w}"/>`).join('');

const plain = (fill: string, ink: string, extra = '', subText = '4 CUTS') => frame(`${bg(fill)}${extra}`, `${wordmark(ink)}${sub(ink, subText)}`);

export const STUDIO_FRAMES: { id: string; svg: () => string; title: { en: string; vi: string; th: string } }[] = [
  { id: 'black', title: { en: 'Black', vi: 'Đen', th: 'ดำ' }, svg: () => plain(ST.black, '#fff') },
  { id: 'white', title: { en: 'White', vi: 'Trắng', th: 'ขาว' }, svg: () => plain(ST.white, C.ink, slotLines('#e6e6e6')) },
  { id: 'grey', title: { en: 'Grey', vi: 'Xám', th: 'เทา' }, svg: () => plain(ST.grey, ST.greyInk) },
  { id: 'ivory', title: { en: 'Ivory Film', vi: 'Ngà phim', th: 'งาช้าง' }, svg: () => frame(`${bg(ST.ivory)}${slotLines('#e4dccd', 3, 10)}`, `${wordmark(ST.filmOrange)}${sub('#8a7f70', 'FILM · 4 CUTS')}`) },
  { id: 'pink', title: { en: 'Baby Pink', vi: 'Hồng phấn', th: 'ชมพูอ่อน' }, svg: () => plain(ST.pink, '#fff', slotLines('#ffffff', 4, 8)) },
  { id: 'powder', title: { en: 'Powder Blue', vi: 'Xanh phấn', th: 'ฟ้าพาวเดอร์' }, svg: () => plain(ST.powder, '#fff', slotLines('#ffffff', 4, 8)) },
  { id: 'cocoa', title: { en: 'Cocoa', vi: 'Ca cao', th: 'โกโก้' }, svg: () => plain(ST.cocoa, ST.cream) },
  {
    id: 'moon',
    title: { en: 'Moon', vi: 'Trăng', th: 'จันทร์' },
    svg: () =>
      frame(
        `${bg(ST.navy)}${slotLines('#1f2742', 2, 8)}<path d="M 120 3330 a 54 54 0 1 0 46 84 a 40 40 0 1 1 -46 -84 z" fill="#f2e6c8"/><circle cx="210" cy="3330" r="4" fill="#f2e6c8"/><circle cx="236" cy="3378" r="3" fill="#f2e6c8"/><circle cx="188" cy="3420" r="3" fill="#f2e6c8"/>`,
        `${wordmark('#f2e6c8')}${sub('#f2e6c8', 'SELF STUDIO')}`,
      ),
  },
  {
    id: 'aurora',
    title: { en: 'Aurora', vi: 'Cực quang', th: 'ออโรรา' },
    svg: () =>
      frame(
        `${bg('#2b1b5e')}<defs><clipPath id="inner"><rect x="18" y="18" width="${W - 36}" height="${H - 36}" rx="${OUTER_R - 18}"/></clipPath></defs><g clip-path="url(#inner)"><rect width="${W}" height="${H}" fill="url(#au)"/></g>`,
        `${wordmark('#fff')}${sub('#fff', '4 CUTS')}`,
        `<linearGradient id="au" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a3fd6"/><stop offset="0.45" stop-color="#2f7fe0"/><stop offset="0.8" stop-color="#2ec4b6"/><stop offset="1" stop-color="#9be7c4"/></linearGradient>`,
      ),
  },
  {
    id: 'mono-band',
    title: { en: 'Mono Band', vi: 'Dải đen trắng', th: 'แถบขาวดำ' },
    svg: () =>
      frame(
        `${bg('#fff')}<rect x="0" y="0" width="${W}" height="60" fill="${ST.black}"/><rect x="0" y="3220" width="${W}" height="${H - 3220}" fill="${ST.black}"/>${slotLines('#d0d0d0', 2, 8)}`,
        `${wordmark('#fff')}${sub('#fff', 'MONO · 4 CUTS')}`,
      ),
  },
];

if (process.argv[1]?.endsWith('studio-frames.ts')) {
  const out = join(DESIGN_ASSETS, 'frames/studio');
  for (const f of STUDIO_FRAMES) {
    const svg = f.svg();
    writePng(join(out, `${f.id}.png`), renderPng(svg));
    writePng(join(out, `${f.id}-thumb.png`), renderPng(svg, 200));
    console.log(`frames/studio/${f.id}.png + thumb`);
  }
}
