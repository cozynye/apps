/**
 * Sample "shots" for EXPO_PUBLIC_MOCK_CAMERA=1 (simulators have no camera, PLAN iPad 대응 / 예외).
 * Simple shape scenes, 1200×800 (3:2 like the slots). Re-run: `pnpm tsx scripts/mock-shots.ts`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { Resvg } from '@resvg/resvg-js';

const out = join(import.meta.dirname, '../apps/fourpop/assets/mock');
mkdirSync(out, { recursive: true });

const palettes = [
  ['#ffd6cc', '#ff8a80'],
  ['#9fe1cb', '#3fae8b'],
  ['#e3f0fc', '#8fbff0'],
  ['#ffe9a8', '#f2b705'],
  ['#d9d0f5', '#8f7ad6'],
  ['#ffe6e3', '#b8413a'],
  ['#c8f0e4', '#2e8c70'],
  ['#f7f6f3', '#66656e'],
];

palettes.forEach(([bg, fg], i) => {
  const cx = 420 + (i % 4) * 120;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <rect width="1200" height="800" fill="${bg}"/>
  <circle cx="${cx}" cy="360" r="170" fill="${fg}"/>
  <circle cx="${cx - 55}" cy="330" r="20" fill="#1f1f24"/>
  <circle cx="${cx + 55}" cy="330" r="20" fill="#1f1f24"/>
  <path d="M${cx - 60} 410 Q${cx} ${450 + (i % 3) * 20} ${cx + 60} 410" stroke="#1f1f24" stroke-width="16" fill="none" stroke-linecap="round"/>
  <rect x="${cx - 200}" y="560" width="400" height="240" rx="120" fill="${fg}"/>
  ${Array.from({ length: i + 1 }, (_, k) => `<circle cx="${80 + k * 60}" cy="80" r="18" fill="${fg}"/>`).join('')}
</svg>`;
  const png = new Resvg(svg).render().asPng();
  writeFileSync(join(out, `shot-${i + 1}.png`), png);
});
console.log('mock shots written');
