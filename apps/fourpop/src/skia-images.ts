import { AlphaType, ColorType, Skia, type SkImage } from '@shopify/react-native-skia';
import { Asset } from 'expo-asset';
import { useEffect, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';

const cache = new Map<string, Promise<SkImage | null>>();

function keyOf(source: ImageSourcePropType | string): string {
  if (typeof source === 'string') return source;
  if (typeof source === 'number') return `module:${source}`;
  return (source as { uri?: string }).uri ?? '';
}

/** Decodes an image (bundled module, file or https URI) into a cached Skia image. */
export function loadSkImage(source: ImageSourcePropType | string): Promise<SkImage | null> {
  const key = keyOf(source);
  let pending = cache.get(key);
  if (!pending) {
    pending = (async () => {
      let uri = typeof source === 'string' ? source : (source as { uri?: string }).uri;
      if (typeof source === 'number') {
        const asset = await Asset.fromModule(source).downloadAsync();
        uri = asset.localUri ?? asset.uri;
      }
      if (!uri) return null;
      const data = await Skia.Data.fromURI(uri);
      return Skia.Image.MakeImageFromEncoded(data);
    })().catch(() => null);
    cache.set(key, pending);
  }
  return pending;
}

/**
 * The frame PNG's border colour, sampled along its straight edges (inside the 48px rounded corners)
 * and taken by majority of opaque samples. Fills the corners of the exported JPEG so a dark frame
 * does not end with white corners (Cozy, iPhone 12 Pro 2026-10-14). Null when nothing opaque.
 */
export function frameEdgeColor(image: SkImage): string | null {
  const w = image.width();
  const h = image.height();
  const points: [number, number][] = [];
  for (let i = 1; i <= 11; i += 1) {
    const x = Math.round((w * i) / 12);
    points.push([x, 1], [x, h - 2]);
  }
  for (let i = 1; i <= 9; i += 1) {
    const y = Math.round((h * i) / 10);
    points.push([1, y], [w - 2, y]);
  }
  const counts = new Map<string, number>();
  for (const [x, y] of points) {
    const px = image.readPixels(x, y, { width: 1, height: 1, alphaType: AlphaType.Unpremul, colorType: ColorType.RGBA_8888 });
    if (!px || px[3]! < 250) continue;
    const hex = `#${[px[0]!, px[1]!, px[2]!].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [hex, count] of counts) {
    if (count > bestCount) {
      best = hex;
      bestCount = count;
    }
  }
  return best;
}

/** Forget decoded shots when a session ends (they are large). */
export function dropSkImage(uri: string) {
  cache.delete(uri);
}

/** Loads several images; returns them in order once all are ready (nulls while loading). */
export function useSkImages(sources: (ImageSourcePropType | string | null)[]): (SkImage | null)[] {
  const key = sources.map((s) => (s === null ? '' : keyOf(s))).join('|');
  const [images, setImages] = useState<(SkImage | null)[]>(() => sources.map(() => null));
  useEffect(() => {
    let alive = true;
    void Promise.all(sources.map((s) => (s === null ? Promise.resolve(null) : loadSkImage(s)))).then(
      (loaded) => alive && setImages(loaded),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return images;
}
