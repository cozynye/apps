import { formatMonth, formatMonthYear, type Language } from '@nf/i18n';
import {
  Group,
  ImageSVG,
  Paragraph,
  Rect,
  RoundedRect,
  Skia,
  TextAlign,
  type SkSVG,
  type SkTypefaceFontProvider,
} from '@shopify/react-native-skia';
import { colors as palette, svgs, type Colors, type Mood, type SvgName } from '@nf/ui';
import type { TFunction } from 'i18next';

import { monthGrid } from '../dates';
import { dayMoods, moodDistribution, monthSummaries, type StatEntry } from '../stats';

/** Output size (PLAN 규칙 › 공유 카드: Skia 오프스크린 1080×1920). */
export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1920;

/** Shared images look the same whatever the app theme: always the light palette. */
const C: Colors = palette.light;
const MOODS: Mood[] = [1, 2, 3, 4, 5];
const MARGIN = 72;
const INNER = CARD_WIDTH - MARGIN * 2;

export interface ShareCardProps {
  period: 'month' | 'year';
  /** Any date inside the month / year shown. */
  anchor: Date;
  entries: readonly StatEntry[];
  watermark: boolean;
  fonts: SkTypefaceFontProvider;
  language: Language;
  t: TFunction;
}

const svgCache = new Map<SvgName, SkSVG | null>();
function svg(name: SvgName): SkSVG | null {
  if (!svgCache.has(name)) svgCache.set(name, Skia.SVG.MakeFromString(svgs[name](C)));
  return svgCache.get(name) ?? null;
}

/** Mascot SVGs are drawn on a 1024 canvas; ImageSVG keeps that size, so scale the group instead. */
function Cloud({ mood, x, y, size }: { mood: Mood; x: number; y: number; size: number }) {
  const art = svg(`nuni-mood-${mood}-sm`);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale: size / 1024 }]}>
      <ImageSVG svg={art} x={0} y={0} width={1024} height={1024} />
    </Group>
  );
}

function text(
  fonts: SkTypefaceFontProvider,
  language: Language,
  value: string,
  size: number,
  color: string,
  weight: 400 | 600 | 700,
  align: TextAlign = TextAlign.Center,
) {
  return Skia.ParagraphBuilder.Make({ textAlign: align }, fonts)
    .pushStyle({
      // Thai uses Prompt; Latin and Vietnamese use Be Vietnam Pro (DESIGN_SYSTEM 타이포그래피).
      fontFamilies: [language === 'th' ? 'Prompt' : 'BeVietnamPro'],
      fontSize: size,
      fontStyle: { weight },
      color: Skia.Color(color),
    })
    .addText(value)
    .build();
}

/** A7 share card as Skia elements (drawn on screen for the preview and offscreen for export). */
export function ShareCard(props: ShareCardProps) {
  const { period, anchor, fonts, language, t, watermark } = props;
  const title = period === 'month' ? formatMonthYear(language, anchor) : String(anchor.getFullYear());
  const { counts, days } = moodDistribution(props.entries);
  const bodyBottom = period === 'month' ? <MonthBody {...props} /> : <YearBody {...props} />;
  const distributionTop = 1360;

  return (
    <Group>
      <Rect x={0} y={0} width={CARD_WIDTH} height={CARD_HEIGHT} color={C.surface1} />
      <Paragraph paragraph={text(fonts, language, title, 84, C.ink, 700)} x={0} y={150} width={CARD_WIDTH} />
      {bodyBottom}

      {/* Distribution bar with `line` separators, then the counts under -sm clouds. */}
      <RoundedRect x={MARGIN} y={distributionTop} width={INNER} height={40} r={20} color={C.line} />
      <Group clip={Skia.RRectXY(Skia.XYWHRect(MARGIN, distributionTop, INNER, 40), 20, 20)}>
        {distributionSegments(counts, days).map((s) => (
          <Rect key={s.mood} x={s.x} y={distributionTop} width={s.width} height={40} color={C[`mood${s.mood}`]} />
        ))}
      </Group>
      {MOODS.map((m, i) => {
        const cx = MARGIN + (INNER / 5) * (i + 0.5);
        return (
          <Group key={m}>
            <Cloud mood={m} x={cx - 40} y={distributionTop + 80} size={80} />
            <Paragraph
              paragraph={text(fonts, language, String(counts[m]), 44, C.ink, 700)}
              x={cx - 80}
              y={distributionTop + 170}
              width={160}
            />
          </Group>
        );
      })}
      {dominantMood(counts) && (
        <Group transform={[{ translateX: CARD_WIDTH / 2 - 80 }, { translateY: 1600 }, { scale: 160 / 1024 }]}>
          <ImageSVG svg={svg(`nuni-mood-${dominantMood(counts)!}`)} x={0} y={0} width={1024} height={1024} />
        </Group>
      )}
      <Paragraph
        paragraph={text(fonts, language, t('stats.daysLogged', { count: days }), 36, C.inkMuted, 400)}
        x={0}
        y={1770}
        width={CARD_WIDTH}
      />

      {watermark && <Watermark fonts={fonts} label={t('app.name')} />}
    </Group>
  );
}

/** The period's most frequent day mood (ties → higher), or null without entries. */
function dominantMood(counts: Record<Mood, number>): Mood | null {
  let best: Mood | null = null;
  for (const m of MOODS) if (counts[m] > 0 && (best === null || counts[m] >= counts[best])) best = m;
  return best;
}

function distributionSegments(counts: Record<Mood, number>, days: number) {
  const GAP = 6;
  const present = MOODS.filter((m) => counts[m] > 0);
  const usable = INNER - GAP * Math.max(present.length - 1, 0);
  let x = MARGIN;
  return present.map((mood) => {
    const width = days ? (usable * counts[mood]) / days : 0;
    const segment = { mood, x, width };
    x += width + GAP;
    return segment;
  });
}

function MonthBody({ anchor, entries, fonts, language, t }: ShareCardProps) {
  const weeks = monthGrid(anchor);
  const moods = dayMoods(entries);
  const weekdays = t('home.weekdays', { returnObjects: true }) as string[];
  const col = (INNER - 48) / 7;
  const rowH = 140;
  const top = 300;
  const height = 110 + weeks.length * rowH;
  return (
    <Group>
      <RoundedRect x={MARGIN} y={top} width={INNER} height={height} r={48} color={C.surface0} />
      <RoundedRect
        x={MARGIN}
        y={top}
        width={INNER}
        height={height}
        r={48}
        color={C.line}
        style="stroke"
        strokeWidth={3}
      />
      {weekdays.map((name, i) => (
        <Paragraph
          key={name}
          paragraph={text(fonts, language, name, 30, C.inkMuted, 400)}
          x={MARGIN + 24 + col * i}
          y={top + 36}
          width={col}
        />
      ))}
      {weeks.flatMap((week, r) =>
        week.map((date, c) => {
          if (!date) return null;
          const x = MARGIN + 24 + col * c;
          const y = top + 100 + r * rowH;
          const mood = moods.get(date);
          return (
            <Group key={date}>
              {mood && <Cloud mood={mood} x={x + col / 2 - 40} y={y} size={80} />}
              <Paragraph
                paragraph={text(
                  fonts,
                  language,
                  String(Number(date.slice(8))),
                  28,
                  mood ? C.inkMuted : C.inkDisabled,
                  400,
                )}
                x={x}
                y={y + 86}
                width={col}
              />
            </Group>
          );
        }),
      )}
    </Group>
  );
}

function YearBody({ anchor, entries, fonts, language, t }: ShareCardProps) {
  const months = monthSummaries(entries);
  const colW = INNER / 3;
  const rowH = 250;
  const top = 300;
  return (
    <Group>
      {months.map((m, i) => {
        const x = MARGIN + colW * (i % 3);
        const y = top + rowH * Math.floor(i / 3);
        const name = formatMonth(language, new Date(anchor.getFullYear(), i, 1));
        return (
          <Group key={i}>
            <RoundedRect x={x + 8} y={y} width={colW - 16} height={rowH - 16} r={32} color={C.surface0} />
            <Paragraph paragraph={text(fonts, language, name, 32, C.ink, 600)} x={x} y={y + 20} width={colW} />
            {m.mood ? <Cloud mood={m.mood} x={x + colW / 2 - 56} y={y + 70} size={112} /> : null}
            <Paragraph
              paragraph={text(fonts, language, t('stats.daysLogged', { count: m.days }), 24, C.inkMuted, 400)}
              x={x}
              y={y + 186}
              width={colW}
            />
          </Group>
        );
      })}
    </Group>
  );
}

/** Free cards: "Nuni" bottom-right, 18% wide, `mascot-face` at 70% (PLAN A7, 규칙 › 공유 카드). */
function Watermark({ fonts, label }: { fonts: SkTypefaceFontProvider; label: string }) {
  const width = CARD_WIDTH * 0.18;
  const margin = 32; // space-4 × 2
  const paragraph = Skia.ParagraphBuilder.Make({ textAlign: TextAlign.Right }, fonts)
    .pushStyle({
      fontFamilies: ['BeVietnamPro'],
      fontSize: 80,
      fontStyle: { weight: 700 },
      color: Skia.Color(C.mascotFace),
    })
    .addText(label)
    .build();
  return (
    <Group opacity={0.7}>
      <Paragraph paragraph={paragraph} x={CARD_WIDTH - margin - width} y={CARD_HEIGHT - margin - 104} width={width} />
    </Group>
  );
}
