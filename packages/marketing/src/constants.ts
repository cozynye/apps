/**
 * Shared vocabulary for the marketing pipeline (marketing/, scripts/marketing/). Pure data: no I/O.
 * A "brand" is one social identity = app × language (Vietnamese and Thai audiences never share a feed).
 */
export const APPS = ['nuni', 'fourpop'] as const;
export type App = (typeof APPS)[number];

export const LOCALES = ['vi', 'th'] as const;
export type Locale = (typeof LOCALES)[number];

export const BRANDS = ['fourpop-vi', 'fourpop-th', 'nuni-vi', 'nuni-th'] as const;
export type Brand = (typeof BRANDS)[number];

/** facebook = Page posts scheduled by hand in Meta Business Suite (no public API without App Review). */
export const CHANNELS = ['threads', 'instagram', 'tiktok', 'x', 'facebook'] as const;
export type Channel = (typeof CHANNELS)[number];
export const AUTOMATED_CHANNELS: readonly Channel[] = ['threads', 'instagram', 'tiktok', 'x'];

export const FORMATS = ['feed', 'vertical', 'square'] as const;
export type Format = (typeof FORMATS)[number];
/** Output canvas per format. feed = 4:5 (Instagram/Threads), vertical = 9:16 (TikTok), square = 1:1. */
export const CANVAS: Record<Format, { w: number; h: number }> = {
  feed: { w: 1080, h: 1350 },
  vertical: { w: 1080, h: 1920 },
  square: { w: 1080, h: 1080 },
};

export const APP_IDS: Record<App, string> = { nuni: '6821789626', fourpop: '6821789911' };

/** Captions where a URL is clickable. Instagram and TikTok captions are plain text ("link in bio"). */
export const LINK_CHANNELS: readonly Channel[] = ['threads', 'x', 'facebook'];

/** Platform caption limits (characters). X counts every URL as 23. */
export const CAPTION_LIMIT: Record<Channel, number> = { threads: 500, instagram: 2200, tiktok: 2200, x: 280, facebook: 5000 };

/** Max images per post. Threads carousel 20, Instagram carousel 10, TikTok photo post 35 (we cap at 10), X 4. */
export const MEDIA_LIMIT: Record<Channel, number> = { threads: 20, instagram: 10, tiktok: 10, x: 4, facebook: 10 };

export function brandApp(brand: Brand): App {
  return brand.startsWith('nuni') ? 'nuni' : 'fourpop';
}

export function brandLocale(brand: Brand): Locale {
  return brand.endsWith('-th') ? 'th' : 'vi';
}

export function defaultFormat(channel: Channel): Format {
  return channel === 'tiktok' ? 'vertical' : 'feed';
}
