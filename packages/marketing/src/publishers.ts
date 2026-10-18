/**
 * Request builders for the three publishing APIs. Pure: they return params/queries, scripts/marketing/publish.ts does the
 * HTTP, waits and status handling.
 *
 * Threads: create container(s) → wait ~30 s → threads_publish. Instagram: same shape on graph.instagram.com (JPEG only).
 * Buffer (TikTok, X): one GraphQL createPost with the scheduled time; Buffer fetches the media URLs when it publishes.
 */
export const THREADS_API = 'https://graph.threads.net/v1.0';
export const INSTAGRAM_API = 'https://graph.instagram.com/v25.0';
export const BUFFER_API = 'https://api.buffer.com';

export type Params = Record<string, string>;
export type ContainerPlan = { items: Params[]; final: Params };

/** Text, single image or carousel (2–20). `children` is appended to `final` once the item container ids exist. */
export function threadsContainers(text: string, imageUrls: readonly string[]): ContainerPlan {
  if (imageUrls.length === 0) return { items: [], final: { media_type: 'TEXT', text } };
  if (imageUrls.length === 1) return { items: [], final: { media_type: 'IMAGE', image_url: imageUrls[0]!, text } };
  if (imageUrls.length > 20) throw new Error(`Threads carousel supports at most 20 items, got ${imageUrls.length}`);
  return {
    items: imageUrls.map((u) => ({ media_type: 'IMAGE', image_url: u, is_carousel_item: 'true' })),
    final: { media_type: 'CAROUSEL', text },
  };
}

/** Instagram needs at least one image; carousels are 2–10 items. */
export function instagramContainers(caption: string, imageUrls: readonly string[]): ContainerPlan {
  if (imageUrls.length === 0) throw new Error('Instagram posts need an image');
  if (imageUrls.length === 1) return { items: [], final: { image_url: imageUrls[0]!, caption } };
  if (imageUrls.length > 10) throw new Error(`Instagram carousel supports at most 10 items, got ${imageUrls.length}`);
  return {
    items: imageUrls.map((u) => ({ image_url: u, is_carousel_item: 'true' })),
    final: { media_type: 'CAROUSEL', caption },
  };
}

export function withChildren(final: Params, childIds: readonly string[]): Params {
  return childIds.length ? { ...final, children: childIds.join(',') } : final;
}

export type BufferPost = { channelId: string; text: string; dueAt: string; imageUrls: readonly string[]; videoUrl?: string };

/** Buffer GraphQL `createPost` scheduled at `dueAt` (ISO 8601 UTC). Exactly one asset variant per entry. */
export function bufferCreatePost(input: BufferPost): { query: string; variables: Record<string, unknown> } {
  const assets = input.videoUrl ? [{ video: { url: input.videoUrl } }] : input.imageUrls.map((url) => ({ image: { url } }));
  return {
    query: `mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    ... on PostActionSuccess { post { id dueAt } }
    ... on MutationError { message }
  }
}`,
    variables: {
      input: {
        channelId: input.channelId,
        text: input.text,
        schedulingType: 'automatic',
        mode: 'customScheduled',
        dueAt: input.dueAt,
        ...(assets.length ? { assets } : {}),
      },
    },
  };
}

export const BUFFER_ORGANIZATIONS_QUERY = `query GetOrganizations { account { organizations { id name } } }`;
export const bufferChannelsQuery = (organizationId: string) =>
  `query GetChannels { channels(input: { organizationId: "${organizationId}" }) { id name service } }`;
