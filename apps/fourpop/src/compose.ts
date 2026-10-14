import { newId } from '@nf/db';
import { strips } from '@nf/db/fourpop';
import { drawAsImage, ImageFormat } from '@shopify/react-native-skia';
import { desc, eq } from 'drizzle-orm';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { createElement } from 'react';

import { StripScene, type StripSceneProps } from './components/StripScene';
import { db } from './db';
import { CANVAS } from './geometry';

export const stripsDir = new Directory(Paths.document, 'strips');
const tmpDir = new Directory(Paths.cache, 'tmp');

/** Thrown before writing when the device is nearly full (PLAN 예외 › 저장 공간 부족 → `error.storageFull`). */
export class StorageFullError extends Error {
  constructor() {
    super('storage full');
    this.name = 'StorageFullError';
  }
}
const MIN_FREE_BYTES = 50 * 1024 * 1024;

export function ensureDiskSpace() {
  if (Paths.availableDiskSpace < MIN_FREE_BYTES) throw new StorageFullError();
}

/** `error.storageFull` for a full disk, `error.generic` otherwise. */
export const saveErrorKey = (error: unknown) => (error instanceof StorageFullError ? 'error.storageFull' : 'error.generic');

/** Renders the strip offscreen at `scale` (0.5 standard / 1 HD) into a temporary JPEG. */
export async function renderStrip(props: Omit<StripSceneProps, 'scale'>, scale: number): Promise<string> {
  const width = Math.round(CANVAS.w * scale);
  const height = Math.round(CANVAS.h * scale);
  ensureDiskSpace();
  const image = await drawAsImage(createElement(StripScene, { ...props, scale }), { width, height });
  if (!image) throw new Error('strip render failed');
  tmpDir.create({ intermediates: true, idempotent: true });
  const file = new File(tmpDir, `strip-${Date.now()}-${scale}.jpg`);
  file.write(image.encodeToBase64(ImageFormat.JPEG, 92), { encoding: 'base64' });
  return file.uri;
}

export interface SavedStrip {
  id: string;
  uri: string;
}

/**
 * Gallery copy (PLAN 규칙 › 갤러리): the standard result + a 300px thumbnail in Documents/strips/,
 * then the `strips` row (files first, so a crash never leaves a row without its image).
 */
export async function saveToGallery(
  standardUri: string,
  meta: { frameId: string; packId: string; filter: string; hd: boolean },
): Promise<SavedStrip> {
  const id = newId();
  ensureDiskSpace();
  stripsDir.create({ intermediates: true, idempotent: true });
  const file = new File(stripsDir, `${id}.jpg`);
  await new File(standardUri).copy(file);
  const thumb = ImageManipulator.manipulate(standardUri);
  thumb.resize({ width: 300 });
  const thumbResult = await (await thumb.renderAsync()).saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  const thumbFile = new File(stripsDir, `${id}-thumb.jpg`);
  await new File(thumbResult.uri).move(thumbFile);
  await db.insert(strips).values({
    id,
    createdAt: Date.now(),
    layout: 'strip4',
    frameId: meta.frameId,
    packId: meta.packId,
    filter: meta.filter,
    hd: meta.hd,
    fileName: `${id}.jpg`,
    thumbName: `${id}-thumb.jpg`,
    width: Math.round(CANVAS.w / 2),
    height: Math.round(CANVAS.h / 2),
  });
  return { id, uri: file.uri };
}

export async function deleteStrip(id: string) {
  const [row] = await db.select().from(strips).where(eq(strips.id, id));
  if (!row) return;
  for (const name of [row.fileName, row.thumbName]) {
    const f = new File(stripsDir, name);
    if (f.exists) f.delete();
  }
  await db.delete(strips).where(eq(strips.id, id));
}

export const stripUri = (fileName: string) => new File(stripsDir, fileName).uri;

/** Next launch: half-written renders from an interrupted save are removed (PLAN 예외). */
export function cleanTemp() {
  if (tmpDir.exists) tmpDir.delete();
}

export const latestStrips = () => db.select().from(strips).orderBy(desc(strips.createdAt));
