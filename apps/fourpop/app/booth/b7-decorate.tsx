/* eslint-disable react-hooks/refs -- PanResponder callbacks read refs during gestures only; the compiler cannot see that. */
import { formatDateNumeric, intlLocale, isLanguage } from '@nf/i18n';
import { useEntitlement } from '@nf/purchases';
import {
  ArrowCounterClockwiseIcon,
  Button,
  CalendarBlankIcon,
  CaretLeftIcon,
  colors as palette,
  IconButton,
  ImageIcon,
  LockSimpleIcon,
  PencilSimpleIcon,
  radius,
  space,
  SparkleIcon,
  Text,
  TextTIcon,
  useLayout,
  useTheme,
  XIcon,
  type Icon,
} from '@nf/ui';
import { Canvas, ColorMatrix, Image as SkiaImage } from '@shopify/react-native-skia';
import { router } from 'expo-router';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, PanResponder, Pressable, ScrollView, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFrameChoice } from '../../src/booth';
import { findFrame, imageSource, stickerPacks, useCanUse, useCatalog, PREMIUM } from '../../src/catalog';
import { measure, StripScene, textParagraph } from '../../src/components/StripScene';
import { newKey, useDecorate, type Decoration, type Placed } from '../../src/decorate';
import { FILTER_SPECS, FILTERS, PREMIUM_FILTERS, type FilterId } from '../../src/filters';
import { useStripFonts } from '../../src/fonts';
import { CANVAS, STICKER, toCanvas } from '../../src/geometry';
import { useSession } from '../../src/session';
import { frameEdgeColor, loadSkImage, useSkImages } from '../../src/skia-images';

const C = palette.light;
type Tool = 'filter' | 'stickers' | 'draw' | 'text' | 'date';
const PEN_COLORS = [C.ink, C.surface0, C.fourpopPrimary, C.fourpopMint, C.mood4];
const PEN_WIDTH = 14;
const TEXT_SIZE = 120;
const HANDLE = 32;

/** Formats the date stamp (decorate.dateFormats order: dd/MM/yyyy, dd.MM.yy, medium), Gregorian. */
export function formatStamp(format: number, language: Parameters<typeof intlLocale>[0], date = new Date()) {
  if (format === 0) return formatDateNumeric(date);
  if (format === 1) return formatDateNumeric(date).replace(/\//g, '.').replace(/\.(\d{2})(\d{2})$/, '.$2');
  return new Intl.DateTimeFormat(intlLocale(language), { day: 'numeric', month: 'short', year: 'numeric', calendar: 'gregory' }).format(date);
}

/**
 * B7 decorate: filter, stickers, pen, text, date. Preview = the same Skia scene as the output,
 * scaled; edits are kept in canvas space. Back → B6, Done → B8.
 */
export default function DecorateScreen() {
  const { t, i18n } = useTranslation();
  const { colors, accent } = useTheme();
  const { width } = useLayout();
  const insets = useSafeAreaInsets();
  const premium = useEntitlement(PREMIUM);
  const fonts = useStripFonts();
  const language = isLanguage(i18n.language) ? i18n.language : 'en';

  const packs = useCatalog((s) => s.packs);
  const frameId = useFrameChoice((s) => s.frameId);
  const frame = findFrame(packs, frameId);
  const shots = useSession((s) => s.shots);
  const picked = useSession((s) => s.picked);
  const { filter, items, history, dateFormat, selected, setFilter, commit, undo, setDate, select } = useDecorate();

  const [tool, setTool] = useState<Tool>('filter');
  const [penColor, setPenColor] = useState(PEN_COLORS[0]!);
  const [draft, setDraft] = useState<Decoration | null>(null);
  const [stickerImages, setStickerImages] = useState<Record<string, import('@shopify/react-native-skia').SkImage | null>>({});

  // The strip (1:3) fits the space left between the header and the tool panel.
  const [area, setArea] = useState({ w: width, h: 0 });
  const previewW = Math.max(1, Math.min(area.w - space[4] * 2, (area.h - space[3] * 2) / 3));
  const k = previewW / CANVAS.w;
  const [frameImage, ...pickedImages] = useSkImages([
    frame ? imageSource(frame.item.image) : null,
    ...picked.map((i) => shots[i]?.uri ?? null),
  ]);
  const background = useMemo(() => (frameImage ? (frameEdgeColor(frameImage) ?? undefined) : undefined), [frameImage]);

  // Decode sticker images as they are placed.
  useEffect(() => {
    for (const item of items) {
      if (item.kind !== 'sticker' || item.image in stickerImages) continue;
      void loadSkImage(imageSource(item.image)).then((img) => setStickerImages((m) => ({ ...m, [item.image]: img })));
    }
  }, [items, stickerImages]);

  const shown = useMemo(
    () => (draft ? items.map((i) => (i.key === draft.key ? draft : i)).concat(items.some((i) => i.key === draft.key) ? [] : [draft]) : items),
    [items, draft],
  );
  const selectedItem = shown.find((i): i is Placed => i.key === selected && i.kind !== 'pen');

  function bbox(item: Placed) {
    if (item.kind === 'sticker') return { w: item.size, h: item.size };
    if (!fonts) return { w: item.size * item.text.length * 0.6, h: item.size * 1.3 };
    const m = measure(textParagraph(item.text, item.size, item.color, fonts));
    return { w: m.width, h: m.height };
  }

  function hit(x: number, y: number): Placed | null {
    for (let i = shown.length - 1; i >= 0; i--) {
      const item = shown[i]!;
      if (item.kind === 'pen') continue;
      const b = bbox(item);
      if (Math.abs(x - item.x) <= b.w / 2 && Math.abs(y - item.y) <= b.h / 2) return item;
    }
    return null;
  }

  // Canvas gestures: draw with the pen, or select and drag a sticker/text.
  const gesture = useRef({ mode: 'none' as 'none' | 'draw' | 'drag', start: { x: 0, y: 0 }, origin: { x: 0, y: 0 } });
  const toCanvasPoint = (e: GestureResponderEvent) => toCanvas(e.nativeEvent.locationX, e.nativeEvent.locationY, previewW);
  // Gesture handlers read the latest render values through this ref (synced after each render).
  const previewOrigin = useRef({ x: 0, y: 0 });
  const latest = useRef({ tool, shown, selectedItem, penColor, draft, items, k });
  useLayoutEffect(() => {
    latest.current = { tool, shown, selectedItem, penColor, draft, items, k };
  });

  const canvasResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const p = toCanvasPoint(e);
      const { tool: currentTool, penColor: color } = latest.current;
      if (currentTool === 'draw') {
        gesture.current.mode = 'draw';
        select(null);
        setDraft({ kind: 'pen', key: newKey(), points: [p.x, p.y], color, width: PEN_WIDTH });
        return;
      }
      const target = hit(p.x, p.y);
      if (!target) {
        select(null);
        gesture.current.mode = 'none';
        return;
      }
      select(target.key);
      gesture.current = { mode: 'drag', start: p, origin: { x: target.x, y: target.y } };
      setDraft(target);
    },
    onPanResponderMove: (e) => {
      const p = toCanvasPoint(e);
      const d = latest.current.draft;
      if (!d) return;
      if (gesture.current.mode === 'draw' && d.kind === 'pen') setDraft({ ...d, points: [...d.points, p.x, p.y] });
      if (gesture.current.mode === 'drag' && d.kind !== 'pen') {
        const g = gesture.current;
        setDraft({ ...d, x: g.origin.x + p.x - g.start.x, y: g.origin.y + p.y - g.start.y });
      }
    },
    onPanResponderRelease: () => finishGesture(),
    onPanResponderTerminate: () => finishGesture(),
  });

  function finishGesture() {
    const { draft: d, items: current } = latest.current;
    if (d && gesture.current.mode !== 'none') {
      const moved = d.kind === 'pen' ? d.points.length > 2 : current.find((i) => i.key === d.key) !== d;
      if (moved) commit(current.some((i) => i.key === d.key) ? current.map((i) => (i.key === d.key ? d : i)) : [...current, d]);
    }
    gesture.current.mode = 'none';
    setDraft(null);
  }

  // Handles: rotate (top-right) and resize (bottom-right) around the element centre.
  function handleResponder(kind: 'rotate' | 'size') {
    const state = { startAngle: 0, startDist: 1, origin: null as Placed | null, center: { x: 0, y: 0 } };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const item = latest.current.selectedItem;
        if (!item) return;
        const p = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
        const scale = latest.current.k;
        const center = { x: previewOrigin.current.x + item.x * scale, y: previewOrigin.current.y + item.y * scale };
        state.origin = item;
        state.center = center;
        state.startAngle = Math.atan2(p.y - center.y, p.x - center.x) - item.rotation;
        state.startDist = Math.max(1, Math.hypot(p.x - center.x, p.y - center.y));
        setDraft(item);
      },
      onPanResponderMove: (e) => {
        const o = state.origin;
        if (!o) return;
        const p = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
        const center = state.center;
        if (kind === 'rotate') {
          setDraft({ ...o, rotation: Math.atan2(p.y - center.y, p.x - center.x) - state.startAngle });
        } else {
          const ratio = Math.hypot(p.x - center.x, p.y - center.y) / state.startDist;
          const size =
            o.kind === 'sticker'
              ? Math.min(STICKER.max, Math.max(STICKER.min, o.size * ratio))
              : Math.min(400, Math.max(40, o.size * ratio));
          setDraft({ ...o, size });
        }
      },
      onPanResponderRelease: () => {
        const { draft: d, items: current } = latest.current;
        if (d) commit(current.map((i) => (i.key === d.key ? d : i)));
        setDraft(null);
      },
    });
  }
  const previewRef = useRef<View>(null);
  const [rotateResponder] = useState(() => handleResponder('rotate'));
  const [sizeResponder] = useState(() => handleResponder('size'));

  function addSticker(image: string) {
    const item: Decoration = { kind: 'sticker', key: newKey(), image, x: CANVAS.w / 2, y: CANVAS.h / 2, size: STICKER.base, rotation: 0 };
    commit([...items, item]);
    select(item.key);
  }

  function addText() {
    Alert.prompt(t('decorate.text'), t('decorate.textPlaceholder'), [
      { text: t('action.cancel'), style: 'cancel' },
      {
        text: t('action.done'),
        onPress: (value?: string) => {
          const text = value?.trim();
          if (!text) return;
          const item: Decoration = {
            kind: 'text',
            key: newKey(),
            text,
            x: CANVAS.w / 2,
            y: CANVAS.h / 2,
            size: TEXT_SIZE,
            rotation: 0,
            color: C.fourpopDeep,
          };
          commit([...items, item]);
          select(item.key);
        },
      },
    ], 'plain-text');
  }

  function chooseFilter(id: FilterId) {
    if (PREMIUM_FILTERS.has(id) && !premium) {
      router.push({ pathname: '/b11-paywall', params: { source: 'filter' } });
      return;
    }
    setFilter(id);
  }

  if (!frame) return null;
  const dateText = dateFormat === null ? null : formatStamp(dateFormat, language);
  const selBox = selectedItem ? bbox(selectedItem) : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.surface1, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <IconButton testID="b7.back" accessibilityLabel={t('action.back')} onPress={() => router.back()} renderIcon={(c) => <CaretLeftIcon size={24} color={c} />} />
        <Text variant="title" style={styles.title} align="center">
          {t('decorate.title')}
        </Text>
        <IconButton
          testID="b7.undo"
          accessibilityLabel={t('decorate.undo')}
          disabled={history.length === 0}
          onPress={undo}
          renderIcon={(c) => <ArrowCounterClockwiseIcon size={24} color={c} />}
        />
        <View style={styles.done}>
          <Button testID="b7.done" label={t('action.done')} onPress={() => router.push('/booth/b8-result')} />
        </View>
      </View>

      <View style={styles.previewWrap} onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        <View
          ref={previewRef}
          onLayout={() => previewRef.current?.measureInWindow((x, y) => (previewOrigin.current = { x, y }))}
          style={[styles.preview, { width: previewW, height: previewW * 3 }]}
          testID="b7.preview"
        >
          <Canvas style={StyleSheet.absoluteFill}>
            <StripScene
              frame={frame.item}
              frameImage={frameImage ?? null}
              shots={pickedImages}
              filter={filter}
              items={shown}
              stickerImages={stickerImages}
              dateText={dateText}
              watermark={null}
              fonts={fonts}
              scale={k}
              background={background}
            />
          </Canvas>
          <View style={StyleSheet.absoluteFill} {...canvasResponder.panHandlers} />
          {selectedItem && selBox && (
            <View
              pointerEvents="box-none"
              style={[
                styles.selection,
                {
                  left: selectedItem.x * k - (selBox.w * k) / 2,
                  top: selectedItem.y * k - (selBox.h * k) / 2,
                  width: selBox.w * k,
                  height: selBox.h * k,
                  borderColor: accent.deep,
                  transform: [{ rotate: `${selectedItem.rotation}rad` }],
                },
              ]}
            >
              <Pressable
                testID="b7.deleteItem"
                accessibilityRole="button"
                accessibilityLabel={t('decorate.deleteItem')}
                onPress={() => {
                  commit(items.filter((i) => i.key !== selectedItem.key));
                  select(null);
                }}
                style={[styles.handle, styles.handleTopLeft, { backgroundColor: colors.ink }]}
              >
                <XIcon size={14} color={colors.surface0} />
              </Pressable>
              <View {...rotateResponder.panHandlers} style={[styles.handle, styles.handleTopRight, { backgroundColor: colors.surface0, borderColor: accent.deep }]}>
                <ArrowCounterClockwiseIcon size={14} color={accent.deep} />
              </View>
              <View {...sizeResponder.panHandlers} style={[styles.handle, styles.handleBottomRight, { backgroundColor: accent.primary }]} />
            </View>
          )}
        </View>
      </View>

      <View style={[styles.panel, { borderTopColor: colors.line }]}>
        {tool === 'filter' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.panelRow}>
            {FILTERS.map((id) => (
              <FilterChip
                key={id}
                id={id}
                label={t(`decorate.filters.${id}`)}
                selected={filter === id}
                locked={PREMIUM_FILTERS.has(id) && !premium}
                sample={pickedImages[0] ?? null}
                onPress={() => chooseFilter(id)}
              />
            ))}
          </ScrollView>
        )}
        {tool === 'stickers' && <StickerTray onPick={addSticker} />}
        {tool === 'draw' && (
          <View style={styles.panelRow}>
            {PEN_COLORS.map((c) => (
              <Pressable
                key={c}
                testID={`b7.pen.${c}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: penColor === c }}
                accessibilityLabel={t('decorate.draw')}
                onPress={() => setPenColor(c)}
                style={[styles.swatch, { backgroundColor: c, borderColor: penColor === c ? accent.deep : colors.line }]}
              />
            ))}
          </View>
        )}
        {tool === 'text' && (
          <View style={styles.panelRow}>
            <Button testID="b7.addText" variant="secondary" label={t('decorate.textPlaceholder')} onPress={addText} />
          </View>
        )}
        {tool === 'date' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.panelRow}>
            {[null, 0, 1, 2].map((f) => (
              <Pressable
                key={String(f)}
                testID={`b7.date.${f ?? 'off'}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: dateFormat === f }}
                onPress={() => setDate(f)}
                style={[styles.dateChip, { backgroundColor: dateFormat === f ? accent.soft : colors.surface2 }]}
              >
                {f === null ? (
                  <XIcon size={18} color={colors.inkMuted} />
                ) : (
                  <Text variant="bodySm" style={{ color: dateFormat === f ? accent.deep : colors.ink }}>
                    {formatStamp(f, language)}
                  </Text>
                )}
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={[styles.tools, { borderTopColor: colors.line, backgroundColor: colors.surface0 }]} accessibilityRole="tablist">
        <ToolTab id="filter" label={t('decorate.filter')} Icon={ImageIcon} active={tool} onPress={setTool} />
        <ToolTab id="stickers" label={t('decorate.stickers')} Icon={SparkleIcon} active={tool} onPress={setTool} />
        <ToolTab id="draw" label={t('decorate.draw')} Icon={PencilSimpleIcon} active={tool} onPress={setTool} />
        <ToolTab
          id="text"
          label={t('decorate.text')}
          Icon={TextTIcon}
          active={tool}
          onPress={(id) => {
            setTool(id);
            addText();
          }}
        />
        <ToolTab id="date" label={t('decorate.date')} Icon={CalendarBlankIcon} active={tool} onPress={setTool} />
      </View>
    </View>
  );
}

function ToolTab({ id, label, Icon, active, onPress }: { id: Tool; label: string; Icon: Icon; active: Tool; onPress: (id: Tool) => void }) {
  const { colors, accent } = useTheme();
  const on = id === active;
  return (
    <Pressable
      testID={`b7.tool.${id}`}
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
      onPress={() => onPress(id)}
      style={styles.tool}
    >
      <Icon size={24} color={on ? accent.deep : colors.inkMuted} />
      <Text variant="caption" style={{ color: on ? accent.deep : colors.inkMuted }}>
        {label}
      </Text>
    </Pressable>
  );
}

function FilterChip({
  id,
  label,
  selected,
  locked,
  sample,
  onPress,
}: {
  id: FilterId;
  label: string;
  selected: boolean;
  locked: boolean;
  sample: import('@shopify/react-native-skia').SkImage | null;
  onPress: () => void;
}) {
  const { colors, accent } = useTheme();
  return (
    <Pressable testID={`b7.filter.${id}`} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={label} onPress={onPress} style={styles.filter}>
      <View style={[styles.filterThumb, { borderColor: selected ? accent.primary : 'transparent' }]}>
        <Canvas style={StyleSheet.absoluteFill}>
          {sample && (
            <SkiaImage image={sample} x={0} y={0} width={60} height={60} fit="cover">
              <ColorMatrix matrix={FILTER_SPECS[id].matrix} />
            </SkiaImage>
          )}
        </Canvas>
        {locked && (
          <View style={[styles.filterLock, { backgroundColor: colors.surface0 }]}>
            <LockSimpleIcon size={12} color={colors.ink} />
          </View>
        )}
      </View>
      <Text variant="caption" style={{ color: selected ? accent.deep : colors.inkMuted }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Stickers from usable sticker packs (base 22 free; locked packs open the pack paywall). */
function StickerTray({ onPick }: { onPick: (image: string) => void }) {
  const packs = stickerPacks(useCatalog((s) => s.packs));
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.panelRow}>
      {packs.map((pack) => (
        <StickerPackItems key={pack.id} pack={pack} onPick={onPick} />
      ))}
    </ScrollView>
  );
}

function StickerPackItems({ pack, onPick }: { pack: ReturnType<typeof stickerPacks>[number]; onPick: (image: string) => void }) {
  const canUse = useCanUse(pack);
  return (
    <>
      {pack.items.map((item) => (
        <Pressable
          key={item.id}
          testID={`b7.sticker.${item.id}`}
          accessibilityRole="button"
          accessibilityLabel={item.id}
          onPress={() =>
            canUse ? onPick(item.image) : router.push({ pathname: '/b11-paywall', params: { source: 'pack', packId: pack.id } })
          }
          style={styles.sticker}
        >
          <Image source={imageSource(item.image)} style={styles.stickerImage} resizeMode="contain" />
        </Pressable>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space[2], gap: space[1] },
  title: { flex: 1 },
  done: { minWidth: 88 },
  previewWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  preview: { borderRadius: radius.md, overflow: 'visible' },
  selection: { position: 'absolute', borderWidth: 1.5, borderStyle: 'dashed' },
  handle: { position: 'absolute', width: HANDLE, height: HANDLE, borderRadius: HANDLE / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  handleTopLeft: { left: -HANDLE / 2, top: -HANDLE / 2 },
  handleTopRight: { right: -HANDLE / 2, top: -HANDLE / 2 },
  handleBottomRight: { right: -HANDLE / 2, bottom: -HANDLE / 2 },
  panel: { minHeight: 104, borderTopWidth: StyleSheet.hairlineWidth, justifyContent: 'center' },
  panelRow: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingHorizontal: space[4], paddingVertical: space[2] },
  filter: { alignItems: 'center', gap: space[1] },
  filterThumb: { width: 60, height: 60, borderRadius: radius.sm, overflow: 'hidden', borderWidth: 2 },
  filterLock: { position: 'absolute', top: 4, right: 4, borderRadius: radius.pill, padding: 2 },
  sticker: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  stickerImage: { width: 56, height: 56 },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 3 },
  dateChip: { minHeight: 40, minWidth: 44, paddingHorizontal: space[3], borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  tools: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  tool: { flex: 1, alignItems: 'center', gap: space[1], paddingVertical: space[2], minHeight: 56 },
});
