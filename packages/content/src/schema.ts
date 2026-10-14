import { z } from 'zod';

/** Manifest schema (design/assets/README.md › Manifest). Bundled and CDN manifests share it. */

const localized = z.object({ en: z.string(), vi: z.string(), th: z.string() });
const slot = z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() });
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}/);
const semver = z.string().regex(/^\d+(\.\d+){0,2}$/);

export const frameItemSchema = z.object({
  id: z.string(),
  layout: z.literal('strip4'),
  image: z.string(),
  thumbnail: z.string(),
  canvas: z.object({ w: z.literal(1200), h: z.literal(3600) }),
  slots: z.array(slot).length(4),
  captionSlot: slot,
  title: localized,
});

export const stickerItemSchema = z.object({
  id: z.string(),
  image: z.string(),
  size: z.literal(512),
  canvas: z.object({ w: z.literal(512), h: z.literal(512) }),
});

const packBase = {
  id: z.string(),
  productId: z.string().nullable(),
  entitlementId: z.string().nullable(),
  free: z.boolean(),
  bundled: z.boolean(),
  category: z.enum(['basic', 'season', 'collab']),
  minAppVersion: semver,
  availableFrom: isoDate.optional(),
  availableUntil: isoDate.optional(),
  title: localized,
  thumbnail: z.string().optional(),
  /** File path → SHA-256 hex. Verified after download when present (PLAN 다운로드). */
  sha256: z.record(z.string(), z.string().regex(/^[0-9a-f]{64}$/i)).optional(),
};

export const packSchema = z.discriminatedUnion('type', [
  z.object({ ...packBase, type: z.literal('frame'), items: z.array(frameItemSchema) }),
  z.object({ ...packBase, type: z.literal('sticker'), items: z.array(stickerItemSchema) }),
]);

export const SUPPORTED_SCHEMA_VERSION = 1;

export const manifestSchema = z.object({
  schemaVersion: z.literal(SUPPORTED_SCHEMA_VERSION),
  version: z.number().int(),
  minAppVersion: semver,
  packs: z.array(packSchema),
});

export type Manifest = z.infer<typeof manifestSchema>;
export type Pack = z.infer<typeof packSchema>;
export type FramePack = Extract<Pack, { type: 'frame' }>;
export type StickerPack = Extract<Pack, { type: 'sticker' }>;
export type FrameItem = z.infer<typeof frameItemSchema>;
export type StickerItem = z.infer<typeof stickerItemSchema>;
export type Slot = z.infer<typeof slot>;

/** Validates untrusted JSON. Returns null for an unknown schemaVersion or invalid shape. */
export function parseManifest(json: unknown): Manifest | null {
  const result = manifestSchema.safeParse(json);
  return result.success ? result.data : null;
}
