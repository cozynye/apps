/**
 * Dev-only stand-in for the R2 CDN (P19 pending): writes a sample season frame pack and sticker
 * pack with SHA-256 digests to scripts/mock-cdn/ (gitignored) and serves them like R2
 * (ETag + 304, `no-cache` manifest, immutable pack paths).
 *
 *   pnpm cdn:mock                      # http://localhost:8090/manifest.json
 *   EXPO_PUBLIC_CDN_BASE_URL=http://localhost:8090 pnpm fourpop start --port 8082
 *
 * Products `booth_pack_dev_sample` / `booth_stickers_dev_sample` must exist in the RevenueCat Test
 * Store for purchases; `fourpop:///dev` installs without buying.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

import { Resvg } from '@resvg/resvg-js';

const OUT = join(import.meta.dirname, 'mock-cdn');
const PORT = Number(process.env.MOCK_CDN_PORT ?? 8090);
const PACK_VERSION = 1;

const slots = [0, 1, 2, 3].map((i) => ({ x: 60, y: 80 + 780 * i, w: 1080, h: 720 }));
const captionSlot = { x: 60, y: 3260, w: 1080, h: 220 };

/** 1200×3600 frame with four transparent slots (same geometry as the base frames). */
function frameSvg(bg: string, accent: string, label: string): string {
  const holes = slots.map((s) => `M${s.x} ${s.y}h${s.w}v${s.h}h-${s.w}z`).join(' ');
  const dots = Array.from({ length: 24 }, (_, i) => `<circle cx="${100 + (i % 6) * 200}" cy="${3300 + Math.floor(i / 6) * 50}" r="10" fill="${accent}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="3600" viewBox="0 0 1200 3600">
  <path fill-rule="evenodd" fill="${bg}" d="M0 0h1200v3600H0z ${holes}"/>
  ${dots}
  <text x="600" y="3420" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="64" fill="${accent}">${label}</text>
</svg>`;
}

function stickerSvg(fill: string, shape: 'star' | 'heart'): string {
  const body =
    shape === 'star'
      ? '<polygon points="256,40 318,196 484,196 350,296 400,460 256,364 112,460 162,296 28,196 194,196"/>'
      : '<path d="M256 460 L60 264 A110 110 0 0 1 256 118 A110 110 0 0 1 452 264 Z"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="${fill}">${body}</svg>`;
}

function png(svg: string, width?: number): Buffer {
  return new Resvg(svg, width ? { fitTo: { mode: 'width', value: width } } : undefined).render().asPng();
}

const sha256 = (data: Buffer) => createHash('sha256').update(data).digest('hex');

function build() {
  const files: Record<string, Buffer> = {};
  const framePath = (file: string) => `packs/dev-sample/${PACK_VERSION}/${file}`;
  const stickerPath = (file: string) => `packs/dev-stickers/${PACK_VERSION}/${file}`;
  const frames = [
    { id: 'sample-night', file: 'night', bg: '#1f2a44', accent: '#ffd166', label: 'FOURPOP · NIGHT' },
    { id: 'sample-party', file: 'party', bg: '#ff8fab', accent: '#ffffff', label: 'FOURPOP · PARTY' },
  ];
  for (const f of frames) {
    const svg = frameSvg(f.bg, f.accent, f.label);
    files[framePath(`${f.file}.png`)] = png(svg);
    files[framePath(`${f.file}-thumb.png`)] = png(svg, 200);
  }
  files[framePath('pack.png')] = files[framePath('night-thumb.png')]!;
  files[stickerPath('star.png')] = png(stickerSvg('#ffd166', 'star'));
  files[stickerPath('heart.png')] = png(stickerSvg('#ff5d8f', 'heart'));
  files[stickerPath('pack.png')] = files[stickerPath('star.png')]!;

  const digests = (prefix: string) => Object.fromEntries(Object.entries(files).filter(([p]) => p.startsWith(prefix)).map(([p, b]) => [p, sha256(b)]));
  const title = (en: string, vi: string, th: string) => ({ en, vi, th });
  const manifest = {
    schemaVersion: 1,
    version: 100,
    minAppVersion: '1.0.0',
    packs: [
      {
        id: 'dev-sample',
        type: 'frame',
        productId: 'booth_pack_dev_sample',
        entitlementId: 'booth_pack_dev_sample',
        free: false,
        bundled: false,
        category: 'season',
        minAppVersion: '1.0.0',
        availableFrom: '2026-01-01',
        availableUntil: '2099-12-31',
        title: title('Sample season', 'Mùa thử nghiệm', 'ซีซันตัวอย่าง'),
        thumbnail: framePath('pack.png'),
        sha256: digests('packs/dev-sample/'),
        items: frames.map((f) => ({
          id: f.id,
          layout: 'strip4',
          image: framePath(`${f.file}.png`),
          thumbnail: framePath(`${f.file}-thumb.png`),
          canvas: { w: 1200, h: 3600 },
          slots,
          captionSlot,
          title: title(f.label.split(' · ')[1]!, f.label.split(' · ')[1]!, f.label.split(' · ')[1]!),
        })),
      },
      {
        id: 'dev-stickers',
        type: 'sticker',
        productId: 'booth_stickers_dev_sample',
        entitlementId: 'booth_stickers_dev_sample',
        free: false,
        bundled: false,
        category: 'season',
        minAppVersion: '1.0.0',
        title: title('Sample stickers', 'Sticker thử nghiệm', 'สติกเกอร์ตัวอย่าง'),
        thumbnail: stickerPath('pack.png'),
        sha256: digests('packs/dev-stickers/'),
        items: [
          { id: 'dev-star', image: stickerPath('star.png'), size: 512, canvas: { w: 512, h: 512 } },
          { id: 'dev-heart', image: stickerPath('heart.png'), size: 512, canvas: { w: 512, h: 512 } },
        ],
      },
    ],
  };
  // Broken pack: same image, wrong digest → install must fail after 3 attempts and clean up.
  const brokenPath = (file: string) => `packs/dev-broken/${PACK_VERSION}/${file}`;
  files[brokenPath('night.png')] = files[framePath('night.png')]!;
  files[brokenPath('night-thumb.png')] = files[framePath('night-thumb.png')]!;
  manifest.packs.push({
    id: 'dev-broken',
    type: 'frame',
    productId: 'booth_pack_dev_broken',
    entitlementId: 'booth_pack_dev_broken',
    free: false,
    bundled: false,
    category: 'season',
    minAppVersion: '1.0.0',
    availableFrom: '2026-01-01',
    availableUntil: '2099-12-31',
    title: title('Broken sample (bad sha256)', 'Mẫu lỗi (sha256 sai)', 'ตัวอย่างเสีย (sha256 ผิด)'),
    thumbnail: brokenPath('night-thumb.png'),
    sha256: { [brokenPath('night.png')]: '0'.repeat(64), [brokenPath('night-thumb.png')]: sha256(files[brokenPath('night-thumb.png')]!) },
    items: [
      {
        id: 'broken-night',
        layout: 'strip4',
        image: brokenPath('night.png'),
        thumbnail: brokenPath('night-thumb.png'),
        canvas: { w: 1200, h: 3600 },
        slots,
        captionSlot,
        title: title('Broken', 'Broken', 'Broken'),
      },
    ],
  });
  files['manifest.json'] = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
  for (const [path, data] of Object.entries(files)) {
    const target = join(OUT, path);
    mkdirSync(join(target, '..'), { recursive: true });
    writeFileSync(target, data);
  }
  console.log(`mock CDN content written to ${OUT} (${Object.keys(files).length} files)`);
}

const TYPES: Record<string, string> = { '.json': 'application/json', '.png': 'image/png' };

function serve() {
  const server = createServer((req, res) => {
    const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0]!)).replace(/^(\.\.[/\\])+/, '');
    let body: Buffer;
    try {
      body = readFileSync(join(OUT, path));
    } catch {
      res.writeHead(404).end();
      return;
    }
    const etag = `"${sha256(body).slice(0, 16)}"`;
    const headers = {
      ETag: etag,
      'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream',
      'Cache-Control': path.endsWith('manifest.json') ? 'no-cache' : 'public, max-age=31536000, immutable',
    };
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, headers).end();
      return;
    }
    res.writeHead(200, { ...headers, 'Content-Length': body.length }).end(body);
    console.log(`${res.statusCode} ${path}`);
  });
  server.listen(PORT, () => console.log(`mock CDN at http://localhost:${PORT}/manifest.json`));
}

build();
if (!process.argv.includes('--build-only')) serve();
