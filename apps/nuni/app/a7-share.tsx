import { track } from '@nf/analytics';
import { fromLocalDateString, isLanguage } from '@nf/i18n';
import { useEntitlement } from '@nf/purchases';
import { Button, IconButton, radius, Segment, space, Text, useTheme, useToast, XIcon } from '@nf/ui';
import { Canvas, drawAsImage, Group, ImageFormat, useFonts } from '@shopify/react-native-skia';
import { File, Paths } from 'expo-file-system';
// SDK 57 moved saveToLibraryAsync to the legacy entry (the root export now throws).
import * as MediaLibrary from 'expo-media-library/legacy';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { CARD_HEIGHT, CARD_WIDTH, ShareCard, type ShareCardProps } from '../src/components/ShareCard';
import { usePeriodData } from '../src/queries';
import { periodRange } from '../src/stats';
import { useToday } from '../src/today';

// Skia loads the bundled TTFs as asset modules.
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
const PREVIEW_MAX = 360;
/** Header, segment, hint and two buttons around the preview. */
const CHROME_HEIGHT = 380;

/** A7 share card: 9:16 image of this month or year; free cards carry the watermark. */
export default function ShareScreen() {
  const params = useLocalSearchParams<{ period?: string }>();
  const { t, i18n } = useTranslation();
  const { colors, accent } = useTheme();
  const toast = useToast();
  const premium = useEntitlement('mood_premium');
  const today = useToday();
  const fonts = useFonts(FONTS);
  const { width } = useWindowDimensions();
  // The sheet's own height (on iPad the modal is shorter than the window).
  const [available, setAvailable] = useState(0);
  const [period, setPeriod] = useState<'month' | 'year'>(params.period === 'year' ? 'year' : 'month');
  const [busy, setBusy] = useState(false);
  const { from, to } = periodRange(period, today);
  const data = usePeriodData(from, to);
  const language = isLanguage(i18n.language) ? i18n.language : 'en';
  // Fit the 9:16 preview so the save/share buttons stay on screen.
  const previewWidth = Math.min(
    width - space[4] * 2,
    PREVIEW_MAX,
    ((available - CHROME_HEIGHT) * CARD_WIDTH) / CARD_HEIGHT,
  );

  const card: Omit<ShareCardProps, 'fonts'> = {
    period,
    anchor: fromLocalDateString(today),
    entries: data.entries,
    watermark: !premium,
    language,
    t,
  };

  async function exportImage(): Promise<string | null> {
    if (!fonts) return null;
    const image = await drawAsImage(<ShareCard {...card} fonts={fonts} />, { width: CARD_WIDTH, height: CARD_HEIGHT });
    if (!image) return null;
    const file = new File(Paths.cache, `nuni-${period}-${today}.png`);
    file.write(image.encodeToBase64(ImageFormat.PNG), { encoding: 'base64' });
    return file.uri;
  }

  async function run(action: 'save' | 'share') {
    setBusy(true);
    try {
      const uri = await exportImage();
      if (!uri) throw new Error('share card render failed');
      if (action === 'save') {
        // Write-only access (`addOnly`); the library is never read (PLAN 기술 스택 › 미디어).
        const permission = await MediaLibrary.requestPermissionsAsync(true);
        if (!permission.granted) {
          track('permission_denied', { type: 'photos' });
          Alert.alert(t('permission.photosTitle'), t('permission.photosBody'), [
            { text: t('action.cancel'), style: 'cancel' },
            { text: t('action.openSettings'), onPress: () => void Linking.openSettings() },
          ]);
          return;
        }
        await MediaLibrary.saveToLibraryAsync(uri);
        toast(t('entry.saved'), 'success');
      } else {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' });
      }
      track('share_card', { period });
    } catch {
      toast(t('error.generic'), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.surface1 }}
      contentContainerStyle={styles.content}
      onLayout={(e) => setAvailable(e.nativeEvent.layout.height)}
    >
      <View style={styles.header}>
        <Text variant="title" style={styles.title}>
          {t('share.title')}
        </Text>
        <IconButton
          testID="a7.close"
          accessibilityLabel={t('a11y.close')}
          onPress={() => router.back()}
          renderIcon={(c) => <XIcon size={24} color={c} />}
        />
      </View>
      <Segment
        testID="a7.period"
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'month', label: t('share.monthly') },
          { value: 'year', label: t('share.yearly') },
        ]}
      />
      {/* `line` border: the card's surface-1 matches this screen's background. */}
      <View
        style={[
          styles.preview,
          { width: previewWidth, height: (previewWidth * CARD_HEIGHT) / CARD_WIDTH, borderColor: colors.line },
        ]}
      >
        {fonts ? (
          <Canvas style={StyleSheet.absoluteFill} testID="a7.preview">
            <Group transform={[{ scale: previewWidth / CARD_WIDTH }]}>
              <ShareCard {...card} fonts={fonts} />
            </Group>
          </Canvas>
        ) : (
          <ActivityIndicator style={StyleSheet.absoluteFill} color={colors.inkMuted} />
        )}
      </View>
      {!premium && (
        <Pressable
          testID="a7.removeWatermark"
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/a9-paywall', params: { source: 'share' } })}
          hitSlop={space[2]}
        >
          <Text variant="bodySm" align="center" style={{ color: accent.deep }}>
            {t('share.watermarkHint')}
          </Text>
        </Pressable>
      )}
      <View style={styles.buttons}>
        <Button
          testID="a7.save"
          label={t('share.saveImage')}
          loading={busy}
          disabled={!fonts}
          onPress={() => void run('save')}
        />
        <Button
          testID="a7.share"
          variant="secondary"
          label={t('action.share')}
          disabled={!fonts || busy}
          onPress={() => void run('share')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space[4], gap: space[4], alignItems: 'stretch', paddingBottom: space[8] },
  header: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1 },
  preview: { alignSelf: 'center', borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1 },
  buttons: { gap: space[3], width: '100%', maxWidth: 520, alignSelf: 'center' },
});
