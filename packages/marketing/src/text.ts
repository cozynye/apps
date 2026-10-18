import { CAPTION_LIMIT, LINK_CHANNELS, type Channel } from './constants';

/** X wraps every URL in t.co and counts it as 23 characters. */
const X_LINK_LENGTH = 23;

export function formatHashtags(tags: readonly string[]): string {
  return tags
    .map((t) => t.trim().replace(/^#/, ''))
    .filter(Boolean)
    .map((t) => `#${t}`)
    .join(' ');
}

export type CaptionInput = { channel: Channel; text: string; hashtags?: readonly string[]; link?: string | null };
export type Caption = { caption: string; length: number; limit: number; ok: boolean; link: string | null };

/** text ␤␤ #tags ␤␤ link — the link only where it is clickable (see LINK_CHANNELS). */
export function composeCaption(input: CaptionInput): Caption {
  const parts = [input.text.trim()];
  const tags = formatHashtags(input.hashtags ?? []);
  if (tags) parts.push(tags);
  const link = input.link && LINK_CHANNELS.includes(input.channel) ? input.link : null;
  if (link) parts.push(link);
  const caption = parts.join('\n\n');
  const length = captionLength(input.channel, caption, link);
  const limit = CAPTION_LIMIT[input.channel];
  return { caption, length, limit, ok: length <= limit, link };
}

/** Code-point length; on X the URL counts as 23 regardless of its real length. */
export function captionLength(channel: Channel, caption: string, link: string | null): number {
  const chars = [...caption].length;
  if (channel === 'x' && link) return chars - [...link].length + X_LINK_LENGTH;
  return chars;
}
