import { fileName, packFiles } from './files';
import type { Pack } from './schema';

const slot = { x: 60, y: 80, w: 1080, h: 720 };
const title = { en: 'T', vi: 'T', th: 'T' };

const framePack: Pack = {
  id: 'p',
  type: 'frame',
  productId: 'booth_pack_p',
  entitlementId: 'booth_pack_p',
  free: false,
  bundled: false,
  category: 'season',
  minAppVersion: '1.0.0',
  title,
  thumbnail: 'packs/p/1/pack.png',
  items: [
    { id: 'a', layout: 'strip4', image: 'packs/p/1/a.png', thumbnail: 'packs/p/1/a-thumb.png', canvas: { w: 1200, h: 3600 }, slots: [slot, slot, slot, slot], captionSlot: slot, title },
    // Same thumbnail as the pack: listed once.
    { id: 'b', layout: 'strip4', image: 'packs/p/1/b.png', thumbnail: 'packs/p/1/pack.png', canvas: { w: 1200, h: 3600 }, slots: [slot, slot, slot, slot], captionSlot: slot, title },
  ],
};

const stickerPack: Pack = {
  ...framePack,
  type: 'sticker',
  thumbnail: undefined,
  items: [{ id: 's', image: 'packs/p/1/s.png', size: 512, canvas: { w: 512, h: 512 } }],
};

test('packFiles lists pack thumbnail, images and thumbnails once', () => {
  expect(packFiles(framePack)).toEqual(['packs/p/1/pack.png', 'packs/p/1/a.png', 'packs/p/1/a-thumb.png', 'packs/p/1/b.png']);
});

test('packFiles for sticker packs has no item thumbnails', () => {
  expect(packFiles(stickerPack)).toEqual(['packs/p/1/s.png']);
});

test('fileName keeps the last segment', () => {
  expect(fileName('packs/p/1/a.png')).toBe('a.png');
  expect(fileName('a.png')).toBe('a.png');
});
