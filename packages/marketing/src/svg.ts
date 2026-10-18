/**
 * SVG templates for rendered posts. Pure string builders; scripts/marketing/render.ts supplies palette (design tokens),
 * fonts (packages/ui/fonts via resvg) and base64 PNGs (strips, mascot, thumbnails).
 */
import type { Format, Locale } from './constants';
import { CANVAS } from './constants';

export type Palette = { bg: string; surface: string; ink: string; inkMuted: string; accent: string; accentDeep: string; line: string };
export type TextLocale = Locale | 'en';

export const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** resvg mis-shapes Thai SARA AM (U+0E33); the decomposed NIKHAHIT + SARA AA renders correctly. */
export const shapeThai = (s: string) => s.replace(/ำ/g, 'ํา');

export const fontFamily = (locale: TextLocale) => (locale === 'th' ? 'Prompt' : 'Be Vietnam Pro');

/** Greedy wrap by estimated glyph width. Thai has no spaces: kept on one line, the caller shrinks the font instead. */
export function wrap(text: string, maxWidth: number, fontSize: number): string[] {
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

/** Shrinks the font until the text fits `maxLines` lines of `maxWidth`. */
export function fit(text: string, maxWidth: number, startSize: number, minSize: number, maxLines: number): { lines: string[]; size: number } {
  let size = startSize;
  let lines = wrap(text, maxWidth, size);
  const widest = () => Math.max(...lines.map((l) => l.length)) * size * 0.56;
  while ((lines.length > maxLines || widest() > maxWidth) && size > minSize) {
    size -= 2;
    lines = wrap(text, maxWidth, size);
  }
  return { lines, size };
}

export type TextBlock = {
  x: number;
  y: number; // baseline of the first line
  lines: string[];
  size: number;
  weight: 400 | 600 | 700;
  fill: string;
  locale: TextLocale;
  anchor?: 'start' | 'middle';
  lineHeight?: number;
};

export function textBlock(t: TextBlock): string {
  const lh = t.lineHeight ?? Math.round(t.size * 1.25);
  const spans = t.lines
    .map((l, i) => `<tspan x="${t.x}" dy="${i === 0 ? 0 : lh}">${escapeXml(t.locale === 'th' ? shapeThai(l) : l)}</tspan>`)
    .join('');
  return `<text x="${t.x}" y="${t.y}" text-anchor="${t.anchor ?? 'start'}" font-family="${fontFamily(t.locale)}" font-weight="${t.weight}" font-size="${t.size}" fill="${t.fill}">${spans}</text>`;
}

const png = (b64: string, x: number, y: number, w: number, h: number, extra = '') =>
  `<image href="data:image/png;base64,${b64}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"${extra}/>`;

const frame = (w: number, h: number, p: Palette) => `<rect width="${w}" height="${h}" fill="${p.bg}"/>`;

const footer = (w: number, h: number, text: string, p: Palette, locale: TextLocale) =>
  textBlock({ x: w / 2, y: h - 48, lines: [text], size: 26, weight: 600, fill: p.inkMuted, locale, anchor: 'middle' });

export type StripCanvas = {
  format: Format;
  palette: Palette;
  locale: TextLocale;
  stripPng: string; // base64, 1200×3600
  caption?: string;
  footer: string;
};

/** One 4-cut strip centred on the brand colour with an optional caption above and a footer line. */
export function stripCanvasSvg(o: StripCanvas): string {
  const { w, h } = CANVAS[o.format];
  const margin = Math.round(w * 0.07);
  let top = Math.round(h * 0.06);
  let caption = '';
  if (o.caption) {
    const { lines, size } = fit(o.caption, w - margin * 2, Math.round(w * 0.055), 32, 2);
    caption = textBlock({ x: w / 2, y: top + size, lines, size, weight: 700, fill: o.palette.ink, locale: o.locale, anchor: 'middle' });
    top += Math.round(size * 1.25) * lines.length + Math.round(h * 0.03);
  }
  const bottom = h - 110;
  const availH = bottom - top;
  const sh = availH;
  const sw = Math.round(sh / 3);
  const sx = Math.round((w - sw) / 2);
  const r = Math.round(sw * 0.04);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
${frame(w, h, o.palette)}
${caption}
<rect x="${sx - 3}" y="${top - 3}" width="${sw + 6}" height="${sh + 6}" rx="${r + 3}" fill="${o.palette.line}"/>
<defs><clipPath id="s"><rect x="${sx}" y="${top}" width="${sw}" height="${sh}" rx="${r}"/></clipPath></defs>
${png(o.stripPng, sx, top, sw, sh, ' clip-path="url(#s)"')}
${footer(w, h, o.footer, o.palette, o.locale)}
</svg>`;
}

export type Card = {
  format: Format;
  palette: Palette;
  locale: TextLocale;
  headline: string;
  lines?: string[];
  /** Nuni: rendered mascot PNG (square). Fourpop: omitted → strip glyph. */
  mascotPng?: string;
  footer: string;
};

/** Text card. Nuni shows the cloud mascot, Fourpop a four-slot strip glyph in the accent colour. */
export function cardSvg(o: Card): string {
  const { w, h } = CANVAS[o.format];
  const margin = Math.round(w * 0.09);
  const art = Math.round(Math.min(w, h) * 0.36);
  const artTop = 0;
  let visual: string;
  if (o.mascotPng) {
    visual = png(o.mascotPng, (w - art) / 2, artTop, art, art);
  } else {
    const gw = Math.round(art * 0.42);
    const gh = art;
    const gx = (w - gw) / 2;
    const slotH = Math.round((gh - 5 * 14) / 4);
    const slots = Array.from({ length: 4 }, (_, i) =>
      `<rect x="${gx + 14}" y="${artTop + 14 + i * (slotH + 14)}" width="${gw - 28}" height="${slotH}" rx="10" fill="${o.palette.accent}"/>`,
    ).join('');
    visual = `<rect x="${gx}" y="${artTop}" width="${gw}" height="${gh}" rx="22" fill="${o.palette.surface}" stroke="${o.palette.line}" stroke-width="3"/>${slots}`;
  }
  const headTop = artTop + art + Math.round(h * 0.06);
  const head = fit(o.headline, w - margin * 2, Math.round(w * 0.072), 40, 3);
  const headSvg = textBlock({ x: w / 2, y: headTop + head.size, lines: head.lines, size: head.size, weight: 700, fill: o.palette.ink, locale: o.locale, anchor: 'middle' });
  let y = headTop + Math.round(head.size * 1.25) * head.lines.length + Math.round(h * 0.035);
  const body = (o.lines ?? [])
    .map((line) => {
      const f = fit(line, w - margin * 2, Math.round(w * 0.04), 26, 2);
      const svg = textBlock({ x: w / 2, y: y + f.size, lines: f.lines, size: f.size, weight: 400, fill: o.palette.inkMuted, locale: o.locale, anchor: 'middle' });
      y += Math.round(f.size * 1.3) * f.lines.length + 10;
      return svg;
    })
    .join('\n');
  const blockH = y;
  const offset = Math.max(Math.round(h * 0.06), Math.round((h - 110 - blockH) / 2));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
${frame(w, h, o.palette)}
<g transform="translate(0 ${offset})">
${visual}
${headSvg}
${body}
</g>
${footer(w, h, o.footer, o.palette, o.locale)}
</svg>`;
}

export type FramesCanvas = {
  format: Format;
  palette: Palette;
  locale: TextLocale;
  thumbs: string[]; // base64 PNG thumbnails, 200×600 each
  headline?: string;
  footer: string;
};

/** Up to four frame thumbnails side by side. */
export function framesSvg(o: FramesCanvas): string {
  const { w, h } = CANVAS[o.format];
  const margin = Math.round(w * 0.07);
  let top = Math.round(h * 0.07);
  let head = '';
  if (o.headline) {
    const f = fit(o.headline, w - margin * 2, Math.round(w * 0.055), 32, 2);
    head = textBlock({ x: w / 2, y: top + f.size, lines: f.lines, size: f.size, weight: 700, fill: o.palette.ink, locale: o.locale, anchor: 'middle' });
    top += Math.round(f.size * 1.25) * f.lines.length + Math.round(h * 0.04);
  }
  const gap = 36;
  const n = Math.max(1, Math.min(4, o.thumbs.length));
  const availH = h - 120 - top;
  let th = availH;
  let tw = Math.round(th / 3);
  if (n * tw + (n - 1) * gap > w - margin * 2) {
    tw = Math.floor((w - margin * 2 - (n - 1) * gap) / n);
    th = tw * 3;
  }
  const x0 = Math.round((w - (n * tw + (n - 1) * gap)) / 2);
  const y0 = top + Math.round((availH - th) / 2);
  const imgs = o.thumbs
    .slice(0, 4)
    .map((b64, i) => `<rect x="${x0 + i * (tw + gap) - 2}" y="${y0 - 2}" width="${tw + 4}" height="${th + 4}" rx="18" fill="${o.palette.line}"/>${png(b64, x0 + i * (tw + gap), y0, tw, th)}`)
    .join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
${frame(w, h, o.palette)}
${head}
${imgs}
${footer(w, h, o.footer, o.palette, o.locale)}
</svg>`;
}
