import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { duePosts, parseQueue, queueIssues, queueSchema } from './schema';

const example = () => JSON.parse(readFileSync(join(__dirname, '../../../marketing/queue/_example/posts.json'), 'utf8'));

test('the example queue is valid', () => {
  const q = parseQueue(example());
  expect(q.week).toBe('2026-W44');
  expect(q.posts.length).toBeGreaterThanOrEqual(4);
  expect(new Set(q.posts.map((p) => p.channel)).size).toBeGreaterThanOrEqual(3);
});

test('cross-field rules', () => {
  const q = queueSchema.parse(example());
  const p = q.posts[0]!;
  const bad = {
    ...q,
    posts: [
      { ...p, id: '2026-W45-fourpop-vi-threads-01' }, // wrong week prefix
      { ...p, id: '2026-W44-fourpop-vi-instagram-01', channel: 'instagram' as const, media: [] }, // no media
      { ...p, id: '2026-W44-fourpop-vi-threads-02', text: 'x'.repeat(480), link: true }, // too long with link
      { ...p, id: '2026-W44-fourpop-vi-threads-03', publishAt: '2026-12-01T00:00:00.000Z' }, // outside week
      { ...p, id: '2026-W44-fourpop-vi-threads-04', text: 'Xin chào [LINK]' }, // placeholder
    ],
  };
  const messages = queueIssues(bad).map((i) => i.message);
  expect(messages.some((m) => m.includes('id must start with'))).toBe(true);
  expect(messages.some((m) => m.includes('need media'))).toBe(true);
  expect(messages.some((m) => m.includes('caption is'))).toBe(true);
  expect(messages.some((m) => m.includes('outside'))).toBe(true);
  expect(messages.some((m) => m.includes('placeholder'))).toBe(true);
  expect(() => parseQueue(bad)).toThrow(/invalid queue/);
});

test('duePosts separates due and stale', () => {
  const q = parseQueue(example());
  const now = new Date('2026-10-26T13:05:00Z');
  const { due, stale } = duePosts(q, now);
  expect(due.every((p) => new Date(p.publishAt) <= now)).toBe(true);
  expect(stale).toHaveLength(0);
  const late = duePosts(q, new Date('2026-11-10T00:00:00Z'));
  expect(late.due).toHaveLength(0);
  expect(late.stale.length).toBe(q.posts.filter((p) => p.status === 'scheduled').length);
});
