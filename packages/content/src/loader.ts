import { createMMKV } from 'react-native-mmkv';

import bundledJson from './generated/manifest.json';
import { pickRemoteManifest } from './merge';
import { parseManifest, type Manifest } from './schema';

const CACHE_KEY = 'manifest.cache.v1';
const storage = createMMKV();

interface CacheEntry {
  etag: string | null;
  manifest: Manifest;
}

const bundled = parseManifest(bundledJson);
if (!bundled) throw new Error('Bundled manifest does not match the schema (run pnpm design:sync).');

/** The manifest shipped in the app (base frames + base stickers). */
export const bundledManifest: Manifest = bundled;

function readCache(): CacheEntry | null {
  const raw = storage.getString(CACHE_KEY);
  if (!raw) return null;
  try {
    const entry = JSON.parse(raw) as { etag?: unknown; manifest?: unknown };
    const manifest = parseManifest(entry.manifest);
    return manifest ? { etag: typeof entry.etag === 'string' ? entry.etag : null, manifest } : null;
  } catch {
    return null;
  }
}

export interface LoadResult {
  /** Newest valid CDN manifest (fresh or cached), or null → bundled only. */
  remote: Manifest | null;
  source: 'network' | 'not-modified' | 'cache' | 'none';
}

/**
 * Fetches `<baseUrl>/manifest.json` once per launch with ETag revalidation (PLAN 콘텐츠 매니페스트).
 * Network or parse failures fall back to the MMKV cache; `onError` lets the caller record a
 * Crashlytics non-fatal. Without a CDN base URL (P19 pending) only the cache/bundled data is used.
 */
export async function loadRemoteManifest(
  baseUrl: string | undefined,
  onError?: (error: Error) => void,
): Promise<LoadResult> {
  const cached = readCache();
  if (!baseUrl) return { remote: cached?.manifest ?? null, source: cached ? 'cache' : 'none' };

  try {
    const headers: Record<string, string> = { 'Cache-Control': 'no-cache' };
    if (cached?.etag) headers['If-None-Match'] = cached.etag;
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/manifest.json`, { headers });
    if (response.status === 304 && cached) return { remote: cached.manifest, source: 'not-modified' };
    if (!response.ok) throw new Error(`manifest HTTP ${response.status}`);

    const fresh = parseManifest(await response.json());
    if (!fresh) throw new Error('manifest failed schema validation');
    const chosen = pickRemoteManifest(cached?.manifest ?? null, fresh);
    if (chosen === fresh) {
      const entry: CacheEntry = { etag: response.headers.get('ETag'), manifest: fresh };
      storage.set(CACHE_KEY, JSON.stringify(entry));
    }
    return { remote: chosen, source: 'network' };
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error(String(error)));
    return { remote: cached?.manifest ?? null, source: cached ? 'cache' : 'none' };
  }
}
