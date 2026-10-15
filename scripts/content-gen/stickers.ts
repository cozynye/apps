/**
 * Generates the bundled "Pop" sticker pack (design/assets/stickers/pop): 20 stickers, 512×512
 * transparent PNG, ink outline 20px (= 10/256, stickers README), pastel fills from the palette.
 *
 *   pnpm tsx scripts/content-gen/stickers.ts
 */
import { join } from 'node:path';

import { C, DESIGN_ASSETS, renderPng, writePng } from './common';

const S = 512;
const wrap = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
<g stroke="${C.ink}" stroke-width="20" stroke-linejoin="round" stroke-linecap="round">${inner}</g></svg>`;

const label = (text: string, y: number, size: number, fill: string = C.ink) =>
  `<text x="256" y="${y}" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="700" font-size="${size}" fill="${fill}" stroke="none">${text}</text>`;

const dot = (cx: number, cy: number, r: number, fill: string) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="none"/>`;

/* ---------- the twenty stickers ---------- */

const strawberry = () =>
  wrap(`<path d="M256 470 C150 430 86 340 96 236 C104 160 176 130 256 176 C336 130 408 160 416 236 C426 340 362 430 256 470 Z" fill="${C.berry}"/>
${[
  [200, 262],
  [312, 262],
  [256, 318],
  [182, 340],
  [330, 340],
  [220, 400],
  [292, 400],
  [256, 445],
]
  .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="13" fill="#fff" stroke="none"/>`)
  .join('')}
<path d="M256 180 C 226 124 178 112 146 132 C 188 154 222 166 256 180 Z" fill="${C.leaf}"/>
<path d="M256 180 C 286 124 334 112 366 132 C 324 154 290 166 256 180 Z" fill="${C.leaf}"/>
<path d="M256 180 C 240 130 248 90 256 60 C 264 90 272 130 256 180 Z" fill="${C.leaf}"/>`);

const iceCream = () =>
  wrap(`<path d="M172 252 L256 472 L340 252 Z" fill="#f3c98b"/>
<path d="M200 318 L312 318 M224 380 L288 380 M212 252 L296 380 M300 252 L216 380" fill="none" stroke-width="10"/>
<circle cx="256" cy="226" r="92" fill="#ffb3c7"/>
<circle cx="206" cy="150" r="68" fill="${C.mint}"/>
<circle cx="306" cy="150" r="68" fill="${C.butter}"/>
<path d="M262 76 C 272 50 292 44 304 52" fill="none" stroke-width="12"/>
<circle cx="256" cy="92" r="26" fill="${C.berry}"/>`);

const sakura = () =>
  wrap(`<g transform="translate(256 262)">
${[0, 72, 144, 216, 288]
  .map((a) => `<path transform="rotate(${a})" d="M0 0 C -62 -40 -74 -136 -22 -156 Q 0 -146 0 -124 Q 0 -146 22 -156 C 74 -136 62 -40 0 0 Z" fill="#ffc2d1"/>`)
  .join('')}
<circle r="30" fill="${C.mood4}"/>
${[0, 72, 144, 216, 288].map((a) => `<circle cx="0" cy="-56" r="7" fill="${C.mood4}" stroke="none" transform="rotate(${a + 36})"/>`).join('')}
</g>`);

const daisy = () =>
  wrap(`<g transform="translate(256 256)">
${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<ellipse cx="0" cy="-124" rx="42" ry="92" fill="#fff" transform="rotate(${a})"/>`).join('')}
<circle r="64" fill="${C.mood4}"/>
</g>`);

const butterfly = () =>
  wrap(`<g transform="translate(256 256)">
<ellipse cx="-112" cy="-62" rx="104" ry="84" fill="#ffb3ac" transform="rotate(-22)"/>
<ellipse cx="112" cy="-62" rx="104" ry="84" fill="#ffb3ac" transform="rotate(22)"/>
<ellipse cx="-84" cy="78" rx="70" ry="60" fill="${C.mood4}" transform="rotate(14)"/>
<ellipse cx="84" cy="78" rx="70" ry="60" fill="${C.mood4}" transform="rotate(-14)"/>
${dot(-130, -70, 22, '#fff')}${dot(130, -70, 22, '#fff')}${dot(-90, 90, 12, '#fff')}${dot(90, 90, 12, '#fff')}
<ellipse cx="0" cy="16" rx="24" ry="112" fill="${C.ink}"/>
<path d="M-12 -94 C -30 -140 -60 -160 -84 -168 M12 -94 C 30 -140 60 -160 84 -168" fill="none" stroke-width="12"/>
</g>`);

const bubbleTea = () =>
  wrap(`<rect x="230" y="22" width="48" height="330" rx="22" fill="${C.primary}" transform="rotate(10 254 180)"/>
<path d="M148 150 L176 444 Q 256 478 336 444 L364 150 Z" fill="#f6d5b8"/>
<path d="M160 270 L352 270" fill="none" stroke="#e3b98f" stroke-width="12"/>
${[
  [206, 404],
  [256, 416],
  [306, 404],
  [232, 372],
  [282, 372],
]
  .map(([x, y]) => dot(x!, y!, 18, C.ink))
  .join('')}
<rect x="134" y="116" width="244" height="48" rx="24" fill="#fff"/>`);

const cat = () =>
  wrap(`<path d="M118 206 L138 86 L226 154 Q256 146 286 154 L374 86 L394 206 C 424 330 350 424 256 424 C 162 424 88 330 118 206 Z" fill="${C.peach}"/>
<path d="M156 118 L166 190 L214 160 Z" fill="#ffb3c7" stroke="none"/>
<path d="M356 118 L346 190 L298 160 Z" fill="#ffb3c7" stroke="none"/>
<path d="M186 262 q 22 -26 44 0 M282 262 q 22 -26 44 0" fill="none" stroke-width="14"/>
<path d="M244 296 L268 296 L256 312 Z" fill="${C.primary}" stroke="none"/>
<path d="M232 322 q 12 16 24 0 q 12 16 24 0" fill="none" stroke-width="12"/>
<path d="M90 290 L170 300 M92 334 L172 320 M422 290 L342 300 M420 334 L340 320" fill="none" stroke-width="10"/>
${dot(166, 322, 18, '#ffb3c7')}${dot(346, 322, 18, '#ffb3c7')}`);

const bear = () =>
  wrap(`<circle cx="138" cy="148" r="58" fill="#c89b6d"/>
<circle cx="374" cy="148" r="58" fill="#c89b6d"/>
${dot(138, 148, 26, '#e8c2a0')}${dot(374, 148, 26, '#e8c2a0')}
<circle cx="256" cy="276" r="162" fill="#c89b6d"/>
<ellipse cx="256" cy="326" rx="74" ry="54" fill="#f4e1c6"/>
<ellipse cx="256" cy="304" rx="26" ry="18" fill="${C.ink}" stroke="none"/>
<path d="M256 322 v 14 M256 336 q -16 20 -34 6 M256 336 q 16 20 34 6" fill="none" stroke-width="10"/>
${dot(198, 246, 14, C.ink)}${dot(314, 246, 14, C.ink)}
${dot(160, 300, 18, '#ffb3ac')}${dot(352, 300, 18, '#ffb3ac')}`);

const bow = () =>
  wrap(`<path d="M256 256 C 200 170 90 160 70 230 C 56 290 150 330 256 256 Z" fill="${C.primary}"/>
<path d="M256 256 C 312 170 422 160 442 230 C 456 290 362 330 256 256 Z" fill="${C.primary}"/>
<path d="M238 272 L186 408 L242 396 L258 300 Z" fill="${C.deep}"/>
<path d="M274 272 L326 408 L270 396 L254 300 Z" fill="${C.deep}"/>
<rect x="218" y="220" width="76" height="72" rx="22" fill="${C.deep}"/>
${dot(130, 230, 14, '#fff')}${dot(382, 230, 14, '#fff')}`);

const balloon = () =>
  wrap(`<path d="M256 436 q -34 30 0 60" fill="none" stroke-width="10"/>
<path d="M256 420 C 150 340 70 270 90 180 C 104 120 180 100 256 170 C 332 100 408 120 422 180 C 442 270 362 340 256 420 Z" fill="${C.primary}"/>
<path d="M240 418 L272 418 L256 444 Z" fill="${C.deep}" stroke="none"/>
<ellipse cx="166" cy="196" rx="20" ry="34" fill="#fff" stroke="none" transform="rotate(-32 166 196)"/>`);

const cupcake = () =>
  wrap(`<path d="M148 262 L180 452 L332 452 L364 262 Z" fill="#ffb3ac"/>
<path d="M200 270 L212 440 M256 270 L256 440 M312 270 L300 440" fill="none" stroke-width="10"/>
<path d="M126 266 C 106 204 168 172 200 206 C 212 142 300 142 312 206 C 344 172 406 204 386 266 Z" fill="#fff5f7"/>
${[
  [176, 236, C.mint],
  [226, 190, C.mood4],
  [296, 190, C.skyDeep],
  [340, 236, C.primary],
  [256, 232, C.mint],
]
  .map(([x, y, c]) => `<rect x="${Number(x) - 12}" y="${Number(y) - 5}" width="24" height="10" rx="5" fill="${c}" stroke="none" transform="rotate(-30 ${x} ${y})"/>`)
  .join('')}
<path d="M258 140 C 266 110 284 100 300 104" fill="none" stroke-width="10"/>
<circle cx="256" cy="150" r="22" fill="${C.berry}"/>`);

const clover = () =>
  wrap(`<path d="M256 262 q 10 100 70 170" fill="none" stroke-width="16"/>
<g transform="translate(256 256)">
${[0, 90, 180, 270]
  .map((a) => `<path transform="rotate(${a})" d="M0 -34 C -52 -78 -94 -130 -52 -164 C -26 -184 0 -152 0 -140 C 0 -152 26 -184 52 -164 C 94 -130 52 -78 0 -34 Z" fill="#7ccf9a"/>`)
  .join('')}
</g>`);

const sunglasses = () =>
  wrap(`<path d="M62 242 L22 214 M450 242 L490 214" fill="none" stroke-width="16"/>
<rect x="56" y="196" width="176" height="124" rx="44" fill="${C.ink}"/>
<rect x="280" y="196" width="176" height="124" rx="44" fill="${C.ink}"/>
<path d="M232 236 q 24 -30 48 0" fill="none"/>
<rect x="92" y="222" width="46" height="16" rx="8" fill="#fff" stroke="none" opacity="0.8" transform="rotate(-30 115 230)"/>
<rect x="316" y="222" width="46" height="16" rx="8" fill="#fff" stroke="none" opacity="0.8" transform="rotate(-30 339 230)"/>`);

function burst(points: number, r1: number, r2: number): string {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? r1 : r2;
    const a = (Math.PI * i) / points - Math.PI / 2;
    pts.push(`${(256 + r * Math.cos(a)).toFixed(1)},${(256 + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

const wow = () => wrap(`<polygon points="${burst(12, 236, 168)}" fill="${C.mood4}"/>${label('WOW!', 292, 96)}`);

const bubble = (fill: string, flip: boolean) =>
  `<path transform="${flip ? 'translate(512 0) scale(-1 1)' : ''}" d="M90 100 h332 a40 40 0 0 1 40 40 v176 a40 40 0 0 1 -40 40 h-176 l-74 76 v-76 h-82 a40 40 0 0 1 -40 -40 v-176 a40 40 0 0 1 40 -40 z" fill="${fill}"/>`;

const yay = () => wrap(`${bubble('#fff', false)}${label('YAY!', 266, 104)}`);
const omg = () => wrap(`${bubble(C.soft, true)}${label('OMG', 266, 104, C.deep)}`);

const planet = () =>
  wrap(`<circle cx="256" cy="256" r="128" fill="#c9bdf0"/>
<path d="M146 226 q 110 64 220 0" fill="none" stroke="#8f7fc9" stroke-width="18"/>
<ellipse cx="256" cy="256" rx="232" ry="64" fill="none" transform="rotate(-18 256 256)"/>
${dot(150, 320, 12, '#fff')}${dot(330, 176, 10, '#fff')}`);

const sparkle = () =>
  wrap(`<path d="M232 60 Q 232 232 60 232 Q 232 232 232 404 Q 232 232 404 232 Q 232 232 232 60 Z" fill="${C.primary}"/>
<path d="M404 320 Q 404 404 320 404 Q 404 404 404 488 Q 404 404 488 404 Q 404 404 404 320 Z" fill="${C.mood4}"/>
<path d="M404 40 Q 404 100 344 100 Q 404 100 404 160 Q 404 100 464 100 Q 404 100 404 40 Z" fill="${C.mint}"/>`);

const peach = () =>
  wrap(`<path d="M256 150 C 170 120 90 170 96 270 C 100 360 180 430 256 440 C 332 430 412 360 416 270 C 422 170 342 120 256 150 Z" fill="#ffb48f"/>
<path d="M256 150 q -34 130 0 290" fill="none" stroke-width="12"/>
<path d="M256 150 C 280 90 330 78 362 94 C 332 130 300 150 256 150 Z" fill="${C.leaf}"/>`);

const watermelon = () =>
  wrap(`<path d="M60 200 A 196 196 0 0 0 452 200 Z" fill="#7ccf9a"/>
<path d="M92 200 A 164 164 0 0 0 420 200 Z" fill="#fff" stroke="none"/>
<path d="M118 200 A 138 138 0 0 0 394 200 Z" fill="${C.berry}" stroke="none"/>
${[
  [196, 236],
  [256, 300],
  [316, 236],
  [226, 274],
  [286, 274],
]
  .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="13" fill="${C.ink}" stroke="none"/>`)
  .join('')}`);

export const POP_STICKERS: { id: string; svg: () => string }[] = [
  { id: 'strawberry', svg: strawberry },
  { id: 'ice-cream', svg: iceCream },
  { id: 'sakura', svg: sakura },
  { id: 'daisy', svg: daisy },
  { id: 'butterfly', svg: butterfly },
  { id: 'bubble-tea', svg: bubbleTea },
  { id: 'cat', svg: cat },
  { id: 'bear', svg: bear },
  { id: 'bow', svg: bow },
  { id: 'balloon', svg: balloon },
  { id: 'cupcake', svg: cupcake },
  { id: 'clover', svg: clover },
  { id: 'sunglasses', svg: sunglasses },
  { id: 'wow', svg: wow },
  { id: 'yay', svg: yay },
  { id: 'omg', svg: omg },
  { id: 'planet', svg: planet },
  { id: 'sparkle', svg: sparkle },
  { id: 'peach', svg: peach },
  { id: 'watermelon', svg: watermelon },
];

if (process.argv[1]?.endsWith('stickers.ts')) {
  const out = join(DESIGN_ASSETS, 'stickers/pop');
  for (const s of POP_STICKERS) {
    writePng(join(out, `${s.id}.png`), renderPng(s.svg()));
    console.log(`stickers/pop/${s.id}.png`);
  }
}
