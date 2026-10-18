import { bufferCreatePost, instagramContainers, threadsContainers, withChildren } from './publishers';

const a = 'https://cozynye.github.io/apps/m/2026-W44/assets/a.jpg';
const b = 'https://cozynye.github.io/apps/m/2026-W44/assets/b.jpg';

describe('threads', () => {
  test('text only', () => {
    expect(threadsContainers('hi', [])).toEqual({ items: [], final: { media_type: 'TEXT', text: 'hi' } });
  });
  test('single image', () => {
    expect(threadsContainers('hi', [a]).final).toEqual({ media_type: 'IMAGE', image_url: a, text: 'hi' });
  });
  test('carousel items then children', () => {
    const plan = threadsContainers('hi', [a, b]);
    expect(plan.items).toHaveLength(2);
    expect(plan.items[0]).toEqual({ media_type: 'IMAGE', image_url: a, is_carousel_item: 'true' });
    expect(withChildren(plan.final, ['1', '2'])).toEqual({ media_type: 'CAROUSEL', text: 'hi', children: '1,2' });
  });
  test('rejects >20 items', () => {
    expect(() => threadsContainers('x', Array(21).fill(a))).toThrow();
  });
});

describe('instagram', () => {
  test('needs an image', () => {
    expect(() => instagramContainers('x', [])).toThrow();
  });
  test('single and carousel', () => {
    expect(instagramContainers('cap', [a]).final).toEqual({ image_url: a, caption: 'cap' });
    expect(instagramContainers('cap', [a, b]).final).toEqual({ media_type: 'CAROUSEL', caption: 'cap' });
    expect(() => instagramContainers('x', Array(11).fill(a))).toThrow();
  });
});

describe('buffer', () => {
  test('scheduled image post', () => {
    const { query, variables } = bufferCreatePost({ channelId: 'c1', text: 't', dueAt: '2026-10-27T13:00:00.000Z', imageUrls: [a, b] });
    expect(query).toContain('createPost');
    expect(variables).toEqual({
      input: {
        channelId: 'c1',
        text: 't',
        schedulingType: 'automatic',
        mode: 'customScheduled',
        dueAt: '2026-10-27T13:00:00.000Z',
        assets: [{ image: { url: a } }, { image: { url: b } }],
      },
    });
  });
  test('video wins over images', () => {
    const { variables } = bufferCreatePost({ channelId: 'c', text: 't', dueAt: '2026-10-27T13:00:00.000Z', imageUrls: [a], videoUrl: 'https://x/v.mp4' });
    expect((variables.input as { assets: unknown[] }).assets).toEqual([{ video: { url: 'https://x/v.mp4' } }]);
  });
});
