import { Skia, type SkImage } from '@shopify/react-native-skia';
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
