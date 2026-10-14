/** Frame canvas space (PLAN 구현 명세 › 좌표계): 1200×3600, origin top-left. */
export const CANVAS = { w: 1200, h: 3600 } as const;
/** Standard output = 0.5 (600×1800); HD = 1 (1200×3600, Cozy 2026-10-14). */
export const STANDARD_SCALE = 0.5;
export const HD_SCALE = 1;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * `cover` crop: the centred part of an iw×ih image that fills `slot` without distortion.
 * Returns the source rectangle in image pixels.
 */
export function coverSource(slot: Rect, iw: number, ih: number): Rect {
  const slotRatio = slot.w / slot.h;
  const imageRatio = iw / ih;
  if (imageRatio > slotRatio) {
    const w = ih * slotRatio;
    return { x: (iw - w) / 2, y: 0, w, h: ih };
  }
  const h = iw / slotRatio;
  return { x: 0, y: (ih - h) / 2, w: iw, h };
}

/** Maps a point from preview pixels (strip drawn `previewWidth` wide) to canvas space. */
export function toCanvas(px: number, py: number, previewWidth: number): { x: number; y: number } {
  const k = CANVAS.w / previewWidth;
  return { x: px * k, y: py * k };
}

/** Free watermark box (frame README): right-aligned at x 1140, top y 3180, height 72. */
export const WATERMARK = { right: 1140, y: 3180, h: 72, opacity: 0.7 } as const;
/** Default date stamp anchor: caption area, left (frame README). */
export const DATE_STAMP = { x: 90, y: 3380 } as const;
/** Default sticker size: 22% of the canvas width; allowed 10–60% (stickers README). */
export const STICKER = { base: 0.22 * CANVAS.w, min: 0.1 * CANVAS.w, max: 0.6 * CANVAS.w } as const;
