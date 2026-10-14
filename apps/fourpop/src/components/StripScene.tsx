import type { FrameItem } from '@nf/content';
import { colors } from '@nf/ui';
import {
  ColorMatrix,
  FractalNoise,
  Group,
  Image,
  Paragraph,
  Path,
  Rect,
  RoundedRect,
  Skia,
  TextAlign,
  type SkImage,
  type SkTypefaceFontProvider,
} from '@shopify/react-native-skia';

import type { Decoration } from '../decorate';
import { FILTER_SPECS, type FilterId } from '../filters';
import { CANVAS, DATE_STAMP, WATERMARK } from '../geometry';

/** Output colours are fixed (the strip is a photo, not themed UI). */
const C = colors.light;
const SLOT_RADIUS = 24;

export interface StripSceneProps {
  frame: FrameItem;
  frameImage: SkImage | null;
  /** The 4 picked shots, in strip order. */
  shots: (SkImage | null)[];
  filter: FilterId;
  items: Decoration[];
  stickerImages: Record<string, SkImage | null>;
  dateText: string | null;
  watermark: string | null;
  fonts: SkTypefaceFontProvider | null;
  /** Canvas → pixels (preview width / 1200, 0.5 standard, 1 HD). */
  scale: number;
}

/**
 * Composition order (PLAN 구현 명세): background → cuts (filtered, cover-cropped) → frame PNG →
 * stickers/pen/text → date stamp → watermark (free).
 */
export function StripScene(p: StripSceneProps) {
  const spec = FILTER_SPECS[p.filter];
  return (
    <Group transform={[{ scale: p.scale }]}>
      <Rect x={0} y={0} width={CANVAS.w} height={CANVAS.h} color={C.surface0} />
      {p.frame.slots.map((slot, i) => {
        const shot = p.shots[i];
        const clip = Skia.RRectXY(Skia.XYWHRect(slot.x, slot.y, slot.w, slot.h), SLOT_RADIUS, SLOT_RADIUS);
        return (
          <Group key={i} clip={clip}>
            <Rect x={slot.x} y={slot.y} width={slot.w} height={slot.h} color={C.surface2} />
            {shot && (
              <Image image={shot} x={slot.x} y={slot.y} width={slot.w} height={slot.h} fit="cover">
                <ColorMatrix matrix={spec.matrix} />
              </Image>
            )}
            {spec.grain > 0 && (
              <Rect x={slot.x} y={slot.y} width={slot.w} height={slot.h} opacity={spec.grain} blendMode="overlay">
                <FractalNoise freqX={0.9} freqY={0.9} octaves={2} />
              </Rect>
            )}
          </Group>
        );
      })}
      {p.frameImage && <Image image={p.frameImage} x={0} y={0} width={CANVAS.w} height={CANVAS.h} />}
      {p.items.map((item) => (
        <DecorationNode key={item.key} item={item} stickerImages={p.stickerImages} fonts={p.fonts} />
      ))}
      {p.dateText && p.fonts && <DateStamp text={p.dateText} fonts={p.fonts} />}
      {p.watermark && p.fonts && <Watermark text={p.watermark} fonts={p.fonts} />}
    </Group>
  );
}

function DecorationNode({
  item,
  stickerImages,
  fonts,
}: {
  item: Decoration;
  stickerImages: Record<string, SkImage | null>;
  fonts: SkTypefaceFontProvider | null;
}) {
  if (item.kind === 'pen') {
    const path = Skia.Path.Make();
    for (let i = 0; i < item.points.length; i += 2) {
      if (i === 0) path.moveTo(item.points[0]!, item.points[1]!);
      else path.lineTo(item.points[i]!, item.points[i + 1]!);
    }
    return <Path path={path} color={item.color} style="stroke" strokeWidth={item.width} strokeCap="round" strokeJoin="round" />;
  }
  const transform = [{ translateX: item.x }, { translateY: item.y }, { rotate: item.rotation }];
  if (item.kind === 'sticker') {
    const image = stickerImages[item.image];
    if (!image) return null;
    const s = item.size;
    return (
      <Group transform={transform}>
        <Image image={image} x={-s / 2} y={-s / 2} width={s} height={s} fit="contain" />
      </Group>
    );
  }
  if (!fonts) return null;
  const para = textParagraph(item.text, item.size, item.color, fonts);
  const box = measure(para);
  return (
    <Group transform={transform}>
      <Paragraph paragraph={para} x={-box.width / 2} y={-box.height / 2} width={box.width + 2} />
    </Group>
  );
}

export function textParagraph(text: string, size: number, color: string, fonts: SkTypefaceFontProvider, align = TextAlign.Center) {
  return Skia.ParagraphBuilder.Make({ textAlign: align }, fonts)
    .pushStyle({ fontFamilies: ['BeVietnamPro', 'Prompt'], fontSize: size, fontStyle: { weight: 700 }, color: Skia.Color(color) })
    .addText(text)
    .build();
}

/** Natural one-line size of a paragraph in canvas units. */
export function measure(para: ReturnType<typeof textParagraph>) {
  para.layout(CANVAS.w * 2);
  const width = Math.ceil(para.getLongestLine());
  para.layout(width + 2);
  return { width, height: para.getHeight() };
}

/** Date stamp in the caption area on a light pill so it reads on dark frames too. */
function DateStamp({ text, fonts }: { text: string; fonts: SkTypefaceFontProvider }) {
  const para = textParagraph(text, 52, C.ink, fonts, TextAlign.Left);
  const box = measure(para);
  const pad = 18;
  return (
    <Group>
      <RoundedRect
        x={DATE_STAMP.x - pad}
        y={DATE_STAMP.y - pad / 2}
        width={box.width + pad * 2}
        height={box.height + pad}
        r={(box.height + pad) / 2}
        color={C.surface0}
        opacity={0.7}
      />
      <Paragraph paragraph={para} x={DATE_STAMP.x} y={DATE_STAMP.y} width={box.width + 2} />
    </Group>
  );
}

/** Free strips: “Fourpop” above the caption, right-aligned, `mascot-face` at 70% (frame README). */
function Watermark({ text, fonts }: { text: string; fonts: SkTypefaceFontProvider }) {
  const para = Skia.ParagraphBuilder.Make({ textAlign: TextAlign.Right }, fonts)
    .pushStyle({ fontFamilies: ['BeVietnamPro'], fontSize: WATERMARK.h * 0.8, fontStyle: { weight: 700 }, color: Skia.Color(C.mascotFace) })
    .addText(text)
    .build();
  const width = 600;
  return (
    <Group opacity={WATERMARK.opacity}>
      <Paragraph paragraph={para} x={WATERMARK.right - width} y={WATERMARK.y} width={width} />
    </Group>
  );
}
