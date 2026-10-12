import { newId } from '@nf/db';
import { entries, entryTags, photos, tags } from '@nf/db/nuni';
import type { Mood } from '@nf/ui';
import { asc, eq, max } from 'drizzle-orm';
import { Directory, File, Paths } from 'expo-file-system';
import { SaveFormat, ImageManipulator } from 'expo-image-manipulator';

import { db, sqlite } from './db';

/** Photos live in Documents/photos/ (PLAN 상태 경계); rows store the file name only. */
export const photosDir = new Directory(Paths.document, 'photos');

export function photoUri(fileName: string): string {
  return new File(photosDir, fileName).uri;
}

/** A photo in the editor: already saved (`fileName`) or picked and prepared in Cache (`cacheUri`). */
export type DraftPhoto =
  | { kind: 'saved'; id: string; fileName: string; width: number | null; height: number | null }
  | { kind: 'new'; cacheUri: string; width: number; height: number };

export interface EntryDraft {
  id?: string;
  date: string;
  mood: Mood;
  note: string;
  tagIds: string[];
  photos: DraftPhoto[];
}

const LONG_EDGE = 1600;

/**
 * Right after picking: long edge 1600px, JPEG 85, EXIF orientation applied, written to Cache
 * (PLAN 규칙 › 사진 저장). Rendering through the manipulator bakes in the orientation.
 */
export async function preparePhoto(uri: string, width: number, height: number): Promise<DraftPhoto> {
  const context = ImageManipulator.manipulate(uri);
  if (Math.max(width, height) > LONG_EDGE) {
    context.resize(width >= height ? { width: LONG_EDGE } : { height: LONG_EDGE });
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: 0.85, format: SaveFormat.JPEG });
  return { kind: 'new', cacheUri: result.uri, width: result.width, height: result.height };
}

export async function loadEntry(id: string): Promise<EntryDraft | null> {
  const [row] = await db.select().from(entries).where(eq(entries.id, id));
  if (!row) return null;
  const tagRows = await db.select({ tagId: entryTags.tagId }).from(entryTags).where(eq(entryTags.entryId, id));
  const photoRows = await db.select().from(photos).where(eq(photos.entryId, id)).orderBy(asc(photos.sortOrder));
  return {
    id: row.id,
    date: row.date,
    mood: row.mood as Mood,
    note: row.note ?? '',
    tagIds: tagRows.map((r) => r.tagId),
    photos: photoRows.map((p) => ({ kind: 'saved', id: p.id, fileName: p.fileName, width: p.width, height: p.height })),
  };
}

/**
 * Inserts or updates an entry with its tags and photos in one transaction. New photo rows are
 * inserted and their files moved into Documents/photos/ inside the transaction, so a failed move
 * rolls the rows back. Files of removed photos are deleted after the commit.
 * Returns the entry id.
 */
export async function saveEntry(draft: EntryDraft): Promise<string> {
  const now = Date.now();
  const id = draft.id ?? newId();
  const note = draft.note.trim() || null;
  const removed: string[] = [];

  if (!photosDir.exists) photosDir.create({ intermediates: true, idempotent: true });

  await sqlite.withTransactionAsync(async () => {
    if (draft.id) {
      await db.update(entries).set({ date: draft.date, mood: draft.mood, note, updatedAt: now }).where(eq(entries.id, id));
      await db.delete(entryTags).where(eq(entryTags.entryId, id));
      const kept = new Set(draft.photos.flatMap((p) => (p.kind === 'saved' ? [p.id] : [])));
      const existing = await db.select().from(photos).where(eq(photos.entryId, id));
      for (const photo of existing) {
        if (kept.has(photo.id)) continue;
        removed.push(photo.fileName);
        await db.delete(photos).where(eq(photos.id, photo.id));
      }
    } else {
      await db.insert(entries).values({ id, date: draft.date, mood: draft.mood, note, createdAt: now, updatedAt: now });
    }
    if (draft.tagIds.length > 0) {
      await db.insert(entryTags).values(draft.tagIds.map((tagId) => ({ entryId: id, tagId })));
    }
    for (const [sortOrder, photo] of draft.photos.entries()) {
      if (photo.kind === 'saved') {
        await db.update(photos).set({ sortOrder }).where(eq(photos.id, photo.id));
        continue;
      }
      const photoId = newId();
      const fileName = `${photoId}.jpg`;
      await db.insert(photos).values({ id: photoId, entryId: id, fileName, width: photo.width, height: photo.height, sortOrder });
      await new File(photo.cacheUri).move(new File(photosDir, fileName));
    }
  });

  for (const fileName of removed) deleteFileQuietly(fileName);
  return id;
}

/** Deletes the photo files first, then the entry (tags and photo rows cascade). */
export async function deleteEntry(id: string): Promise<void> {
  const rows = await db.select({ fileName: photos.fileName }).from(photos).where(eq(photos.entryId, id));
  for (const { fileName } of rows) deleteFileQuietly(fileName);
  await db.delete(entries).where(eq(entries.id, id));
}

/** App start: removes files in Documents/photos/ that no row references (interrupted saves). */
export async function cleanOrphanPhotos(): Promise<void> {
  if (!photosDir.exists) return;
  const known = new Set((await db.select({ fileName: photos.fileName }).from(photos)).map((r) => r.fileName));
  for (const item of photosDir.list()) {
    if (item instanceof File && !known.has(item.name)) item.delete();
  }
}

function deleteFileQuietly(fileName: string) {
  const file = new File(photosDir, fileName);
  if (file.exists) file.delete();
}

/** Free users keep up to 3 custom tags (PLAN 기능 범위). */
export const FREE_CUSTOM_TAGS = 3;

export async function createCustomTag(name: string): Promise<string> {
  const [row] = await db.select({ last: max(tags.sortOrder) }).from(tags);
  const id = newId();
  await db.insert(tags).values({ id, customName: name, icon: 'Tag', sortOrder: (row?.last ?? 0) + 1 });
  return id;
}
