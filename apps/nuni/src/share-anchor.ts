import type { RefObject } from 'react';
import type { View } from 'react-native';

export type ShareAnchor = { x: number; y: number; width: number; height: number };

/** iPad shows the share sheet as a popover: anchor it to the button that opened it. */
export function measureAnchor(ref: RefObject<View | null>): Promise<ShareAnchor | undefined> {
  return new Promise((resolve) => {
    if (!ref.current) return resolve(undefined);
    ref.current.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
  });
}
