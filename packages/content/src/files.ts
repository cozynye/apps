import type { Pack } from './schema';

/** Every file a pack needs on disk: the pack thumbnail, item images and item thumbnails (no duplicates). */
export function packFiles(pack: Pack): string[] {
  const files = new Set<string>();
  if (pack.thumbnail) files.add(pack.thumbnail);
  for (const item of pack.items) {
    files.add(item.image);
    if ('thumbnail' in item) files.add(item.thumbnail);
  }
  return [...files];
}

/** Last path segment. Installed pack files keep only their name under Documents/packs/<id>/. */
export function fileName(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1);
}
