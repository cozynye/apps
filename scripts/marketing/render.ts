/**
 * Renders a week's images into marketing/queue/<week>/assets/ and fills posts[].assets.
 *
 *   strip  — four Pexels photos under a real frame PNG (design/assets/frames, slots from manifest.json) on the brand canvas
 *   card   — headline + lines on the app's soft colour; Nuni shows the cloud mascot for `mood`, Fourpop a strip glyph
 *   frames — 1–4 frame thumbnails side by side
 *
 * Fonts: packages/ui/fonts (Be Vietnam Pro; Prompt for Thai) through resvg, like scripts/store-screenshots.ts.
 * Without PEXELS_API_KEY the photos are flat placeholder tiles so the pipeline can be smoke-tested offline — never publish those.
 *
 *   pnpm marketing:render --week 2026-W44 [--force] [--only <postId>]
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

import type { App, Format, Locale, MediaSpec, Palette, PhotoRef, Post } from '../../packages/marketing/src';
import { CANVAS, brandApp, brandLocale, cardSvg, defaultFormat, fontFamily, framesSvg, stripCanvasSvg } from '../../packages/marketing/src';
import { DESIGN, MARKETING, QUEUE, ROOT, accounts, arg, flag, loadDotenv, readEnv, readQueue, warn, writeQueue } from './lib';

loadDotenv();
const week = arg('week') ?? '';
if (!week) throw new Error('usage: render.ts --week 2026-W44 [--force] [--only <postId>]');
const force = flag('force');
const only = arg('only');
const PEXELS_KEY = readEnv(accounts().pexels.apiKeyEnv) ?? '';
if (!PEXELS_KEY) warn('PEXELS_API_KEY not set: rendering placeholder photos (do not publish these)');

const FONTS = join(ROOT, 'packages/ui/fonts');
const fontFiles = readdirSync(FONTS).filter((f) => f.endsWith('.ttf')).map((f) => join(FONTS, f));
const CACHE = join(MARKETING, '.cache/pexels');
mkdirSync(CACHE, { recursive: true });

// ---------- design inputs ----------
type Tokens = { color: { tokens: { name: string; value: { light: string } }[] } };
const tokens = JSON.parse(readFileSync(join(DESIGN, 'tokens.json'), 'utf8')) as Tokens;
const color = (name: string) => {
  const t = tokens.color.tokens.find((c) => c.name === name);
  if (!t) throw new Error(`token ${name} missing in design/tokens.json`);
  return t.value.light;
};
const palette = (app: App): Palette => ({
  bg: color(`${app}-soft`),
  surface: color('surface-0'),
  ink: color('ink'),
  inkMuted: color('ink-muted'),
  accent: color(`${app}-primary`),
  accentDeep: color(`${app}-deep`),
  line: color('line'),
});

type Slot = { x: number; y: number; w: number; h: number };
type FrameItem = { id: string; image: string; thumbnail: string; slots: Slot[]; canvas: { w: number; h: number } };
type Manifest = { packs: { type: string; items: (FrameItem & { layout?: string })[] }[] };
const manifest = JSON.parse(readFileSync(join(DESIGN, 'assets/manifest.json'), 'utf8')) as Manifest;
const frames = new Map<string, FrameItem>();
for (const pack of manifest.packs) if (pack.type === 'frame') for (const it of pack.items) frames.set(it.id, it);
const frameItem = (id: string): FrameItem => {
  const f = frames.get(id);
  if (!f) throw new Error(`frame ${id} not in design/assets/manifest.json (frame packs: ${[...frames.keys()].slice(0, 5).join(', ')}…)`);
  return f;
};

const APP_NAME: Record<App, string> = { nuni: 'Nuni', fourpop: 'Fourpop' };
const footerText = (app: App, locale: Locale) => (locale === 'th' ? `${APP_NAME[app]} · iPhone และ iPad` : `${APP_NAME[app]} · iPhone và iPad`);

function renderSvg(svg: string, locale: Locale): Buffer {
  const r = new Resvg(svg, { font: { fontFiles, loadSystemFonts: false, defaultFontFamily: fontFamily(locale) } });
  return r.render().asPng();
}

// ---------- photos ----------
type Pexels = { id: number; url: string; photographer: string; src: { large2x: string; large: string; original: string } };
const searchCache = new Map<string, Pexels[]>();
const hash = (s: string) => parseInt(createHash('sha1').update(s).digest('hex').slice(0, 8), 16);

async function pexelsSearch(query: string): Promise<Pexels[]> {
  const hit = searchCache.get(query);
  if (hit) return hit;
  const u = new URL('https://api.pexels.com/v1/search');
  u.searchParams.set('query', query);
  u.searchParams.set('per_page', '15');
  u.searchParams.set('orientation', 'landscape');
  const res = await fetch(u, { headers: { Authorization: PEXELS_KEY } });
  if (!res.ok) throw new Error(`Pexels search "${query}" → ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { photos: Pexels[] };
  searchCache.set(query, data.photos);
  return data.photos;
}

async function pexelsPhoto(id: number): Promise<Pexels> {
  const res = await fetch(`https://api.pexels.com/v1/photos/${id}`, { headers: { Authorization: PEXELS_KEY } });
  if (!res.ok) throw new Error(`Pexels photo ${id} → ${res.status}`);
  return (await res.json()) as Pexels;
}

async function download(p: Pexels): Promise<Buffer> {
  const file = join(CACHE, `${p.id}.jpg`);
  if (existsSync(file)) return readFileSync(file);
  const res = await fetch(p.src.large2x);
  if (!res.ok) throw new Error(`download ${p.id} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(file, buf);
  return buf;
}

/** Deterministic pick per post so re-rendering gives the same photo; `pick` overrides. */
async function resolvePhoto(ref: PhotoRef, seed: string): Promise<{ meta: Pexels | null; bytes: Buffer }> {
  if (!PEXELS_KEY) return { meta: null, bytes: placeholderPhoto(seed) };
  if ('id' in ref) {
    const meta = await pexelsPhoto(ref.id);
    return { meta, bytes: await download(meta) };
  }
  const list = await pexelsSearch(ref.query);
  if (!list.length) throw new Error(`Pexels: no results for "${ref.query}"`);
  const meta = list[(ref.pick ?? hash(seed)) % list.length]!;
  return { meta, bytes: await download(meta) };
}

function placeholderPhoto(seed: string): Buffer {
  const hue = hash(seed) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="720"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},70%,80%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360},70%,65%)"/></linearGradient></defs><rect width="1080" height="720" fill="url(#g)"/><text x="540" y="380" text-anchor="middle" font-family="Be Vietnam Pro" font-size="48" fill="#1f1f24" opacity="0.6">sample photo</text></svg>`;
  return renderSvg(svg, 'vi');
}

// ---------- compositions ----------
async function stripPng(frameId: string, photos: Buffer[]): Promise<Buffer> {
  const item = frameItem(frameId);
  const framePng = readFileSync(join(DESIGN, 'assets', item.image));
  const layers = await Promise.all(
    item.slots.map(async (s, i) => ({
      input: await sharp(photos[i]!).resize(s.w, s.h, { fit: 'cover', position: 'attention' }).toBuffer(),
      left: s.x,
      top: s.y,
    })),
  );
  return sharp({ create: { width: item.canvas.w, height: item.canvas.h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([...layers, { input: framePng, left: 0, top: 0 }])
    .png()
    .toBuffer();
}

const mascotCache = new Map<number, string>();
function mascotPng(mood: number): string {
  const hit = mascotCache.get(mood);
  if (hit) return hit;
  const svg = readFileSync(join(DESIGN, `assets/mascot/nuni-mood-${mood}.svg`), 'utf8');
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 800 } }).render().asPng().toString('base64');
  mascotCache.set(mood, png);
  return png;
}

async function toJpeg(png: Buffer, bg: string, format: Format): Promise<Buffer> {
  const { w, h } = CANVAS[format];
  return sharp(png).resize(w, h).flatten({ background: bg }).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
}

async function renderMedia(post: Post, m: MediaSpec, index: number): Promise<{ jpeg: Buffer; picked: Post['picked'] }> {
  const app = brandApp(post.brand);
  const locale = brandLocale(post.brand);
  const pal = palette(app);
  const format = m.format ?? defaultFormat(post.channel);
  const footer = footerText(app, locale);
  if (m.kind === 'strip') {
    const picked: NonNullable<Post['picked']> = [];
    const photos: Buffer[] = [];
    for (const [i, ref] of m.photos.entries()) {
      const { meta, bytes } = await resolvePhoto(ref, `${post.id}:${index}:${i}`);
      photos.push(bytes);
      if (meta) picked.push({ pexelsId: meta.id, photographer: meta.photographer, url: meta.url });
    }
    const strip = await stripPng(m.frame, photos);
    const svg = stripCanvasSvg({ format, palette: pal, locale, stripPng: strip.toString('base64'), caption: m.caption, footer });
    return { jpeg: await toJpeg(renderSvg(svg, locale), pal.bg, format), picked };
  }
  if (m.kind === 'card') {
    const svg = cardSvg({
      format,
      palette: pal,
      locale,
      headline: m.headline,
      lines: m.lines,
      mascotPng: app === 'nuni' ? mascotPng(m.mood ?? 4) : undefined,
      footer,
    });
    return { jpeg: await toJpeg(renderSvg(svg, locale), pal.bg, format), picked: undefined };
  }
  const thumbs = m.frames.map((id) => readFileSync(join(DESIGN, 'assets', frameItem(id).thumbnail)).toString('base64'));
  const svg = framesSvg({ format, palette: pal, locale, thumbs, headline: m.headline, footer });
  return { jpeg: await toJpeg(renderSvg(svg, locale), pal.bg, format), picked: undefined };
}

// ---------- main ----------
async function main(): Promise<void> {
  const q = readQueue(week);
  const outDir = join(QUEUE, week, 'assets');
  mkdirSync(outDir, { recursive: true });
  let rendered = 0;
  for (const post of q.posts) {
    if (only && post.id !== only) continue;
    if (!post.media.length) continue;
    if (post.assets.length === post.media.length && !force && post.assets.every((a) => existsSync(join(QUEUE, week, a)))) continue;
    const assets: string[] = [];
    const picked: NonNullable<Post['picked']> = [];
    for (const [i, m] of post.media.entries()) {
      const { jpeg, picked: p } = await renderMedia(post, m, i);
      const name = `assets/${post.id}-${i + 1}.jpg`;
      writeFileSync(join(QUEUE, week, name), jpeg);
      assets.push(name);
      if (p) picked.push(...p);
      rendered += 1;
      console.log(`  ${name}  ${m.kind}  ${(jpeg.length / 1024).toFixed(0)} KB`);
    }
    post.assets = assets;
    if (picked.length) post.picked = picked;
    else delete post.picked;
  }
  writeQueue(week, q);
  console.log(`${week}: rendered ${rendered} image(s) → ${outDir}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
