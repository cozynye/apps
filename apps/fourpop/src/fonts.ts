import { useFonts } from '@shopify/react-native-skia';

const FONTS = {
  BeVietnamPro: [
    require('../../../packages/ui/fonts/BeVietnamPro-Regular.ttf'),
    require('../../../packages/ui/fonts/BeVietnamPro-SemiBold.ttf'),
    require('../../../packages/ui/fonts/BeVietnamPro-Bold.ttf'),
  ],
  Prompt: [
    require('../../../packages/ui/fonts/Prompt-Regular.ttf'),
    require('../../../packages/ui/fonts/Prompt-SemiBold.ttf'),
    require('../../../packages/ui/fonts/Prompt-Bold.ttf'),
  ],
};

/** Font provider for Skia text (stickers text, date stamp, watermark). Thai falls back to Prompt. */
export function useStripFonts() {
  return useFonts(FONTS);
}
