/**
 * Weekly queue format: marketing/queue/<ISO week>/posts.json. Written by the /marketing-weekly skill, reviewed in a PR,
 * published by scripts/marketing/publish.ts. Statuses: scheduled → posted | failed | skipped.
 */
import { z } from 'zod';

import { BRANDS, CHANNELS, FORMATS, MEDIA_LIMIT, brandLocale } from './constants';
import { LINK_LENGTH_ESTIMATE } from './links';
import { composeCaption } from './text';
import { isWeekId, weekMonday } from './week';

const DAY = 86_400_000;

/** A Pexels photo: by search query (the renderer picks deterministically, `pick` overrides) or by exact id. */
const photoRef = z.union([
  z.object({ query: z.string().min(2).max(80), pick: z.number().int().min(0).max(14).optional() }),
  z.object({ id: z.number().int().positive() }),
]);
export type PhotoRef = z.infer<typeof photoRef>;

const format = z.enum(FORMATS).optional();

export const mediaSpec = z.discriminatedUnion('kind', [
  /** Fourpop 4-cut strip: four photos under a real frame from design/assets/manifest.json, placed on a brand canvas. */
  z.object({
    kind: z.literal('strip'),
    frame: z.string().min(1),
    photos: z.array(photoRef).length(4),
    caption: z.string().max(60).optional(),
    format,
  }),
  /** Text card on the app's soft colour; Nuni cards show the mascot for `mood` 1–5, Fourpop cards a strip glyph. */
  z.object({
    kind: z.literal('card'),
    headline: z.string().min(1).max(80),
    lines: z.array(z.string().min(1).max(70)).max(5).optional(),
    mood: z.number().int().min(1).max(5).optional(),
    format,
  }),
  /** 1–4 frame thumbnails side by side ("frames for every season"). */
  z.object({
    kind: z.literal('frames'),
    frames: z.array(z.string().min(1)).min(1).max(4),
    headline: z.string().max(60).optional(),
    format,
  }),
]);
export type MediaSpec = z.infer<typeof mediaSpec>;

export const STATUSES = ['scheduled', 'posted', 'failed', 'skipped'] as const;
export type Status = (typeof STATUSES)[number];

export const postSchema = z.object({
  id: z.string().regex(/^\d{4}-W\d{2}-(fourpop|nuni)-(vi|th)-(threads|instagram|tiktok|x|facebook)-\d{2}$/),
  brand: z.enum(BRANDS),
  channel: z.enum(CHANNELS),
  pillar: z.string().min(1).max(40).optional(),
  publishAt: z.iso.datetime(),
  text: z.string().min(1).max(2200),
  hashtags: z.array(z.string().regex(/^[^#\s]+$/)).max(10).default([]),
  /** Append the App Store campaign link where links are clickable (threads, x, facebook). */
  link: z.boolean().default(false),
  media: z.array(mediaSpec).max(20).default([]),
  /** Rendered files relative to the week folder, one per media item; filled by `pnpm marketing:render`. */
  assets: z.array(z.string().regex(/^assets\/[\w.-]+\.(jpg|png|mp4)$/)).default([]),
  /** Pexels credits for the photos actually used (transparency; the licence does not require attribution). */
  picked: z.array(z.object({ pexelsId: z.number().int(), photographer: z.string(), url: z.string() })).optional(),
  status: z.enum(STATUSES).default('scheduled'),
  result: z
    .object({ id: z.string().optional(), permalink: z.string().optional(), at: z.string().optional(), error: z.string().optional() })
    .optional(),
  /** Free text for Cozy: why it was skipped, manual steps (facebook), etc. */
  note: z.string().max(300).optional(),
});
export type Post = z.infer<typeof postSchema>;

export const queueSchema = z.object({
  week: z.string().refine(isWeekId, 'week must look like 2026-W44'),
  posts: z.array(postSchema),
});
export type Queue = z.infer<typeof queueSchema>;

export type Issue = { id: string; message: string };

/** Cross-field rules the schema alone cannot express. Empty array = valid. */
export function queueIssues(q: Queue): Issue[] {
  const issues: Issue[] = [];
  const seen = new Set<string>();
  const monday = weekMonday(q.week).getTime();
  for (const p of q.posts) {
    if (seen.has(p.id)) issues.push({ id: p.id, message: 'duplicate id' });
    seen.add(p.id);
    const prefix = `${q.week}-${p.brand}-${p.channel}-`;
    if (!p.id.startsWith(prefix)) issues.push({ id: p.id, message: `id must start with ${prefix}` });
    const t = new Date(p.publishAt).getTime();
    if (t < monday - DAY || t > monday + 8 * DAY) issues.push({ id: p.id, message: `publishAt ${p.publishAt} is outside ${q.week}` });
    if (p.media.length > MEDIA_LIMIT[p.channel]) issues.push({ id: p.id, message: `${p.channel} allows at most ${MEDIA_LIMIT[p.channel]} media items` });
    if ((p.channel === 'instagram' || p.channel === 'tiktok') && p.media.length === 0) issues.push({ id: p.id, message: `${p.channel} posts need media` });
    if (p.assets.length && p.assets.length !== p.media.length) issues.push({ id: p.id, message: 'assets must match media one-to-one' });
    const cap = composeCaption({ channel: p.channel, text: p.text, hashtags: p.hashtags, link: p.link ? 'x'.repeat(LINK_LENGTH_ESTIMATE) : null });
    if (!cap.ok) issues.push({ id: p.id, message: `caption is ${cap.length} characters, ${p.channel} allows ${cap.limit}` });
    if (/\[[A-Z_ ]{3,}\]/.test(p.text)) issues.push({ id: p.id, message: 'placeholder left in text' });
    if (brandLocale(p.brand) === 'th' && !/[฀-๿]/.test(p.text)) issues.push({ id: p.id, message: 'Thai brand but the text has no Thai' });
    if (brandLocale(p.brand) === 'vi' && /[฀-๿]/.test(p.text)) issues.push({ id: p.id, message: 'Vietnamese brand but the text has Thai' });
  }
  return issues;
}

/** Structural parse + cross-field rules; throws with every issue listed. */
export function parseQueue(data: unknown): Queue {
  const q = queueSchema.parse(data);
  const issues = queueIssues(q);
  if (issues.length) throw new Error(`invalid queue ${q.week}:\n${issues.map((i) => `- ${i.id}: ${i.message}`).join('\n')}`);
  return q;
}

/** Scheduled posts whose time has come. Older than `staleHours` are reported separately so they can be skipped, not posted late. */
export function duePosts(q: Queue, now: Date, staleHours = 36): { due: Post[]; stale: Post[] } {
  const due: Post[] = [];
  const stale: Post[] = [];
  for (const p of q.posts) {
    if (p.status !== 'scheduled') continue;
    const t = new Date(p.publishAt).getTime();
    if (t > now.getTime()) continue;
    (now.getTime() - t > staleHours * 3_600_000 ? stale : due).push(p);
  }
  return { due, stale };
}
