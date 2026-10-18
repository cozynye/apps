import { composeCaption, formatHashtags } from './text';

const link = 'https://apps.apple.com/app/apple-store/id6821789911?pt=123456789&ct=threads_vi&mt=8';

test('hashtags are normalised', () => {
  expect(formatHashtags(['photobooth', '#chụpảnh', ' sốngảo '])).toBe('#photobooth #chụpảnh #sốngảo');
});

test('threads: text, tags and link joined with blank lines', () => {
  const c = composeCaption({ channel: 'threads', text: 'Hello', hashtags: ['a', 'b'], link });
  expect(c.caption).toBe(`Hello\n\n#a #b\n\n${link}`);
  expect(c.ok).toBe(true);
  expect(c.link).toBe(link);
});

test('instagram and tiktok drop the link (not clickable)', () => {
  expect(composeCaption({ channel: 'instagram', text: 'Hi', link }).caption).toBe('Hi');
  expect(composeCaption({ channel: 'tiktok', text: 'Hi', link }).link).toBeNull();
});

test('x counts a link as 23 characters', () => {
  const text = 'x'.repeat(250);
  const c = composeCaption({ channel: 'x', text, link });
  expect(c.length).toBe(250 + 2 + 23);
  expect(c.ok).toBe(true);
  expect(composeCaption({ channel: 'x', text: 'x'.repeat(260), link }).ok).toBe(false);
});

test('threads limit is 500', () => {
  expect(composeCaption({ channel: 'threads', text: 'x'.repeat(500) }).ok).toBe(true);
  expect(composeCaption({ channel: 'threads', text: 'x'.repeat(501) }).ok).toBe(false);
});
