import { recordError, track } from '@nf/analytics';
import { getProducts, purchaseProduct, useEntitlement } from '@nf/purchases';
import {
  Button,
  CaretLeftIcon,
  ChatCircleIcon,
  CheckIcon,
  DownloadSimpleIcon,
  IconButton,
  InstagramLogoIcon,
  LockSimpleIcon,
  MessengerLogoIcon,
  radius,
  ShareNetworkIcon,
  space,
  Text,
  useTheme,
  useLayout,
  useToast,
  XIcon,
  type Icon,
} from '@nf/ui';
import { AlphaType, ColorType, type SkImage } from '@shopify/react-native-skia';
import { BlurView } from 'expo-blur';
import { File, Paths } from 'expo-file-system';
// SDK 57 moved saveToLibraryAsync to the legacy entry (the root export throws).
import * as MediaLibrary from 'expo-media-library/legacy';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { GIFEncoder, applyPalette, quantize } from 'gifenc';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DEFAULT_FRAME, useFrameChoice } from '../../src/booth';
import { findFrame, imageSource, PREMIUM, useCanUse, useCatalog } from '../../src/catalog';
import { renderStrip, saveToGallery } from '../../src/compose';
import { useDecorate } from '../../src/decorate';
import { useStripFonts } from '../../src/fonts';
import { HD_SCALE, STANDARD_SCALE } from '../../src/geometry';
import { clearSessionFiles, useSession } from '../../src/session';
import { useBoothSettings } from '../../src/settings';
import { loadSkImage, useSkImages } from '../../src/skia-images';
import { formatStamp } from './b7-decorate';

type Channel = 'zalo' | 'messenger' | 'line' | 'instagram';
/** Locale share rows (PLAN 규칙 › 공유 행); each app shows only if installed. */
const CHANNELS: Record<string, Channel[]> = { vi: ['zalo', 'messenger', 'instagram'], th: ['line', 'instagram'], en: ['instagram'] };
const SCHEMES: Record<Channel, string> = { zalo: 'zalo://', messenger: 'fb-messenger://', line: 'line://', instagram: 'instagram://' };
const CHANNEL_ICON: Record<Channel, Icon> = { zalo: ChatCircleIcon, messenger: MessengerLogoIcon, line: ChatCircleIcon, instagram: InstagramLogoIcon };
const GIF_WIDTH = 480;
/** Header + chips + share row + Save + note + gaps on B8. */
const ACTIONS_HEIGHT = 380;

/** B8 result: render, keep a gallery copy, then save / share / HD / GIF. Locked frames show a blur. */
export default function ResultScreen() {
  const { t, i18n } = useTranslation();
  const { colors, accent } = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { height, isTablet } = useLayout();
  // Keep chips, share row and Save on screen without scrolling (PLAN B8: one-tap save).
  const previewH = Math.max(300, Math.min(isTablet ? 900 : 540, height - insets.top - insets.bottom - ACTIONS_HEIGHT));
  const premium = useEntitlement(PREMIUM);
  const hdSetting = useBoothSettings((s) => s.hd);
  const fonts = useStripFonts();
  const packs = useCatalog((s) => s.packs);
  const frameId = useFrameChoice((s) => s.frameId);
  const setFrame = useFrameChoice((s) => s.setFrame);
  const frame = findFrame(packs, frameId);
  const canUseFrame = useCanUse(frame?.pack ?? { free: true, entitlementId: null });
  const shots = useSession((s) => s.shots);
  const picked = useSession((s) => s.picked);
  const { filter, items, dateFormat } = useDecorate();
  const language = (['vi', 'th'].includes(i18n.language) ? i18n.language : 'en') as 'en' | 'vi' | 'th';

  const [frameImage, ...pickedImages] = useSkImages([
    frame ? imageSource(frame.item.image) : null,
    ...picked.map((i) => shots[i]?.uri ?? null),
  ]);
  const [stickerImages, setStickerImages] = useState<Record<string, SkImage | null>>({});
  const [standardUri, setStandardUri] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState<'save' | 'gif' | 'unlock' | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const savedToGallery = useRef(false);
  const hd = premium && hdSetting;

  // Sticker images for the offscreen render.
  useEffect(() => {
    const paths = [...new Set(items.flatMap((i) => (i.kind === 'sticker' ? [i.image] : [])))];
    void Promise.all(paths.map(async (p) => [p, await loadSkImage(imageSource(p))] as const)).then((pairs) =>
      setStickerImages(Object.fromEntries(pairs)),
    );
  }, [items]);

  useEffect(() => {
    const list = CHANNELS[language] ?? CHANNELS.en!;
    void Promise.all(list.map(async (c) => ((await Linking.canOpenURL(SCHEMES[c]).catch(() => false)) ? c : null))).then((r) =>
      setChannels(r.filter((c): c is Channel => c !== null)),
    );
  }, [language]);

  const ready = Boolean(frame && fonts && frameImage && pickedImages.every(Boolean) && Object.keys(stickerImages).length >= 0);
  const sceneProps = useCallback(
    (watermark: boolean) => ({
      frame: frame!.item,
      frameImage: frameImage ?? null,
      shots: pickedImages,
      filter,
      items,
      stickerImages,
      dateText: dateFormat === null ? null : formatStamp(dateFormat, language),
      watermark: watermark ? t('app.name') : null,
      fonts,
    }),
    [frame, frameImage, pickedImages, filter, items, stickerImages, dateFormat, language, t, fonts],
  );

  // Standard render (watermarked for free users) → preview + automatic gallery copy (PLAN 사용자 플로우 6).
  useEffect(() => {
    if (!ready || !frame) return;
    let alive = true;
    const began = performance.now();
    void renderStrip(sceneProps(!premium), STANDARD_SCALE)
      .then(async (uri) => {
        if (!alive) return;
        setStandardUri(uri);
        if (!canUseFrame || savedToGallery.current) return;
        savedToGallery.current = true;
        await saveToGallery(uri, { frameId: frame.item.id, packId: frame.pack.id, filter, hd });
        track('booth_complete', { frame_id: frame.item.id, filter, hd, duration_ms: Math.round(performance.now() - began) });
      })
      .catch((error: Error) => {
        recordError(error, 'renderStrip');
        toast(t('error.generic'), 'error');
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, premium, canUseFrame, frameId]);

  async function saveToPhotos() {
    setBusy('save');
    try {
      const uri = hd ? await renderStrip(sceneProps(false), HD_SCALE) : standardUri;
      if (!uri) return;
      const permission = await MediaLibrary.requestPermissionsAsync(true);
      if (!permission.granted) {
        track('permission_denied', { type: 'photos' });
        Alert.alert(t('permission.photosTitle'), `${t('permission.photosBody')}\n${t('result.savedToGallery')}`, [
          { text: t('action.cancel'), style: 'cancel' },
          { text: t('action.openSettings'), onPress: () => void Linking.openSettings() },
        ]);
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      setSaved(true);
      toast(t('result.savedToPhotos'), 'success');
      track('booth_share', { channel: 'photos' });
    } catch (error) {
      recordError(error as Error, 'saveToPhotos');
      toast(t('error.generic'), 'error');
    } finally {
      setBusy(null);
    }
  }

  async function share(channel: Channel | 'system') {
    if (!standardUri) return;
    const uri = hd ? await renderStrip(sceneProps(false), HD_SCALE).catch(() => standardUri) : standardUri;
    // Zalo / Messenger / LINE / Instagram receive the image through the share sheet (no SDKs).
    await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', UTI: 'public.jpeg' }).catch(() => undefined);
    track('booth_share', { channel });
  }

  async function makeGif() {
    if (!premium) return router.push({ pathname: '/b11-paywall', params: { source: 'gif' } });
    setBusy('gif');
    try {
      const encoder = GIFEncoder();
      for (const shot of shots) {
        if (!shot) continue;
        const image = await loadSkImage(shot.thumbUri);
        if (!image) continue;
        const scale = GIF_WIDTH / image.width();
        const w = GIF_WIDTH;
        const h = Math.round(image.height() * scale);
        const pixels = image.readPixels(0, 0, { width: image.width(), height: image.height(), alphaType: AlphaType.Unpremul, colorType: ColorType.RGBA_8888 });
        if (!pixels) continue;
        const rgba = resize(pixels as Uint8Array, image.width(), image.height(), w, h);
        const palette = quantize(rgba, 256);
        encoder.writeFrame(applyPalette(rgba, palette), w, h, { palette, delay: 400, repeat: 0 });
      }
      encoder.finish();
      const file = new File(Paths.cache, `fourpop-${Date.now()}.gif`);
      file.write(encoder.bytes());
      const permission = await MediaLibrary.requestPermissionsAsync(true);
      if (!permission.granted) throw new Error('photos permission');
      await MediaLibrary.saveToLibraryAsync(file.uri);
      toast(t('result.savedToPhotos'), 'success');
      track('booth_share', { channel: 'gif' });
    } catch (error) {
      recordError(error as Error, 'gif');
      toast(t('error.generic'), 'error');
    } finally {
      setBusy(null);
    }
  }

  async function unlockPack() {
    if (!frame?.pack.productId) return;
    setBusy('unlock');
    const [product] = await getProducts([frame.pack.productId]).catch(() => []);
    if (product) {
      const outcome = await purchaseProduct(product);
      if (outcome.status === 'success') toast(t('paywall.purchaseSuccess'), 'success');
      else if (outcome.status === 'failed') toast(t('paywall.purchaseFailed'), 'error');
    } else toast(t('error.purchaseOffline'), 'error');
    setBusy(null);
  }

  function finish() {
    clearSessionFiles();
    useDecorate.getState().reset();
    router.dismissTo('/b3-home');
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.surface1, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <IconButton testID="b8.back" accessibilityLabel={t('action.back')} onPress={() => router.back()} renderIcon={(c) => <CaretLeftIcon size={24} color={c} />} />
        <Text variant="title" align="center" style={styles.title} testID="b8.title">
          {t('result.title')}
        </Text>
        <IconButton testID="b8.close" accessibilityLabel={t('a11y.close')} onPress={finish} renderIcon={(c) => <XIcon size={24} color={c} />} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space[6] }]}>
        <View style={[styles.preview, { borderColor: colors.line, width: previewH / 3, height: previewH }]} testID="b8.preview">
          {standardUri ? (
            <Image source={{ uri: standardUri }} style={StyleSheet.absoluteFill} />
          ) : (
            <ActivityIndicator style={StyleSheet.absoluteFill} color={colors.inkMuted} />
          )}
          {!canUseFrame && standardUri && (
            <>
              <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
              <View style={styles.lockOverlay} testID="b8.locked">
                <LockSimpleIcon size={28} color={colors.ink} />
                <Text variant="bodyStrong" align="center">
                  {t('result.unlockToSave')}
                </Text>
              </View>
            </>
          )}
        </View>

        {!canUseFrame ? (
          <View style={styles.actions}>
            <Button testID="b8.unlockPack" label={t('paywall.unlockPack', { price: '' }).replace(/\s·\s$/, '')} loading={busy === 'unlock'} onPress={() => void unlockPack()} />
            <Button
              testID="b8.orPremium"
              variant="secondary"
              label={t('paywall.orPremium')}
              onPress={() => router.push({ pathname: '/b11-paywall', params: { source: 'pack', packId: frame?.pack.id ?? '' } })}
            />
            <Pressable testID="b8.useFreeFrame" accessibilityRole="button" onPress={() => setFrame(DEFAULT_FRAME)} hitSlop={space[3]}>
              <Text variant="bodySm" align="center" style={{ color: accent.deep }}>
                {t('result.useFreeFrame')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.chips}>
              <Chip testID="b8.standard" label={t('result.standard', { size: '600×1800' })} selected={!hd} />
              <Chip
                testID="b8.hd"
                label={t('result.hdUpsell')}
                locked={!premium}
                selected={hd}
                onPress={() => (premium ? useBoothSettings.getState().set({ hd: !hdSetting }) : router.push({ pathname: '/b11-paywall', params: { source: 'hd' } }))}
              />
              <Chip testID="b8.gif" label={t('result.gif')} locked={!premium} busy={busy === 'gif'} onPress={() => void makeGif()} />
            </View>
            <View style={styles.shareRow}>
              {channels.map((c) => (
                <ShareButton key={c} testID={`b8.share.${c}`} label={t(`result.${c}`)} Icon={CHANNEL_ICON[c]} onPress={() => void share(c)} />
              ))}
              <ShareButton testID="b8.share.system" label={t('result.share')} Icon={ShareNetworkIcon} onPress={() => void share('system')} />
            </View>
            <Button
              testID="b8.saveToPhotos"
              label={saved ? t('result.saved') : t('result.saveToPhotos')}
              icon={saved ? <CheckIcon size={20} color={colors.onAccent} /> : <DownloadSimpleIcon size={20} color={colors.onAccent} />}
              loading={busy === 'save'}
              disabled={!standardUri}
              onPress={() => void saveToPhotos()}
            />
            <Text variant="bodySm" color="inkMuted" align="center" testID="b8.inGallery">
              {t('result.inGallery')}
            </Text>
          </>
        )}
        <Pressable testID="b8.shootAnother" accessibilityRole="button" onPress={finish} hitSlop={space[3]}>
          <Text variant="bodyStrong" align="center" style={{ color: accent.deep }}>
            {t('result.shootAnother')}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Chip({ label, selected, locked, busy, onPress, testID }: { label: string; selected?: boolean; locked?: boolean; busy?: boolean; onPress?: () => void; testID: string }) {
  const { colors, accent } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: selected ? accent.soft : locked ? accent.soft : colors.surface2 }]}
    >
      {busy ? <ActivityIndicator color={accent.deep} /> : locked ? <LockSimpleIcon size={14} color={accent.deep} /> : null}
      <Text variant="bodySm" style={{ color: selected || locked ? accent.deep : colors.ink }}>
        {label}
      </Text>
    </Pressable>
  );
}

function ShareButton({ label, Icon, onPress, testID }: { label: string; Icon: Icon; onPress: () => void; testID: string }) {
  const { colors } = useTheme();
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.share}>
      <View style={[styles.shareIcon, { backgroundColor: colors.surface0, borderColor: colors.line }]}>
        <Icon size={24} color={colors.ink} />
      </View>
      <Text variant="caption" color="inkMuted">
        {label}
      </Text>
    </Pressable>
  );
}

/** Nearest-neighbour RGBA resize (GIF frames are small; speed over quality). */
function resize(src: Uint8Array, sw: number, sh: number, dw: number, dh: number): Uint8Array {
  const out = new Uint8Array(dw * dh * 4);
  for (let y = 0; y < dh; y++) {
    const sy = Math.min(sh - 1, Math.floor((y * sh) / dh));
    for (let x = 0; x < dw; x++) {
      const sx = Math.min(sw - 1, Math.floor((x * sw) / dw));
      const si = (sy * sw + sx) * 4;
      const di = (y * dw + x) * 4;
      out[di] = src[si]!;
      out[di + 1] = src[si + 1]!;
      out[di + 2] = src[si + 2]!;
      out[di + 3] = 255;
    }
  }
  return out;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space[2] },
  title: { flex: 1 },
  // Same 520pt action column as Nuni A7 on iPad.
  content: { alignItems: 'stretch', gap: space[4], padding: space[4], width: '100%', maxWidth: 520, alignSelf: 'center' },
  preview: { alignSelf: 'center', borderRadius: radius.md, overflow: 'hidden', borderWidth: 1 },
  lockOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: space[2], padding: space[3] },
  actions: { gap: space[3] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space[2] },
  chip: { flexDirection: 'row', alignItems: 'center', gap: space[1], minHeight: 36, paddingHorizontal: space[3], borderRadius: radius.pill },
  shareRow: { flexDirection: 'row', justifyContent: 'center', gap: space[5] },
  share: { alignItems: 'center', gap: space[1] },
  shareIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
