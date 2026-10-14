import { isLanguage, toLocalDateString } from '@nf/i18n';
import { seasonBannerPack } from '@nf/content';
import {
  Button,
  CameraIcon,
  CaretRightIcon,
  GearSixIcon,
  IconButton,
  ImageIcon,
  PressableSurface,
  radius,
  Screen,
  space,
  SparkleIcon,
  Text,
  useLayout,
  useTheme,
} from '@nf/ui';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFrameChoice } from '../../src/booth';
import { framePacks, useCatalog } from '../../src/catalog';
import { FrameGrid } from '../../src/components/FrameGrid';
import { useProductPrice } from '../../src/prices';
import { startFromAlbum, startShooting } from '../../src/start';

/** B3 home: season banner, base frames (5 columns, 8 on iPad), Let's shoot / From album. */
export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isTablet } = useLayout();
  const insets = useSafeAreaInsets();
  const packs = useCatalog((s) => s.packs);
  const base = framePacks(packs).find((p) => p.id === 'base');
  const { frameId, setFrame } = useFrameChoice();

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Text variant="displayLg" testID="b3.title" style={styles.title}>
          {t('app.name')}
        </Text>
        <IconButton
          testID="b3.settings"
          accessibilityLabel={t('settings.title')}
          onPress={() => router.push('/b12-settings')}
          renderIcon={(c) => <GearSixIcon size={24} color={c} />}
        />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SeasonBanner />
        <View style={styles.sectionRow}>
          <Text variant="bodySm" color="inkMuted">
            {t('home.frame')}
          </Text>
          <Pressable testID="b3.allFrames" accessibilityRole="button" onPress={() => router.push('/b4-frames')} hitSlop={space[3]}>
            <Text variant="bodySm" color="inkMuted" style={{ color: colors.fourpopDeep }}>
              {t('home.allFrames')}
            </Text>
          </Pressable>
        </View>
        {base && (
          <FrameGrid
            pack={base}
            columns={isTablet ? 8 : 5}
            selectedId={frameId}
            onSelect={(item) => setFrame(item.id)}
            screenId="b3"
          />
        )}
      </ScrollView>
      {/* Above the floating native tab bar (part of the bottom safe area). */}
      <View style={[styles.ctas, { paddingBottom: insets.bottom + space[3] }]}>
        <View style={styles.cta}>
          <Button
            testID="b3.startShooting"
            label={t('home.startShooting')}
            icon={<CameraIcon size={20} color={colors.onAccent} />}
            onPress={() => void startShooting()}
          />
        </View>
        <View style={styles.cta}>
          <Button
            testID="b3.fromAlbum"
            variant="secondary"
            label={t('home.fromAlbum')}
            icon={<ImageIcon size={20} color={colors.ink} />}
            onPress={() => void startFromAlbum()}
          />
        </View>
      </View>
    </Screen>
  );
}

/** Latest in-window season pack (PLAN 규칙 › 시즌 배너); hidden when there is none. */
function SeasonBanner() {
  const { t, i18n } = useTranslation();
  const { colors, accent } = useTheme();
  const packs = useCatalog((s) => s.packs);
  const pack = seasonBannerPack({ packs, updateRequired: false }, toLocalDateString(new Date()));
  const price = useProductPrice(pack?.productId ?? null);
  if (!pack) return null;
  const language = isLanguage(i18n.language) ? i18n.language : 'en';
  return (
    <PressableSurface
      testID="b3.seasonBanner"
      onPress={() =>
        router.push({ pathname: '/b11-paywall', params: { source: 'banner', packId: pack.id } })
      }
      style={[styles.banner, { backgroundColor: accent.soft }]}
    >
      <SparkleIcon size={28} color={accent.deep} />
      <View style={styles.bannerText}>
        <Text variant="bodyStrong">{t('home.newPack', { name: pack.title[language] })}</Text>
        {price && (
          <Text variant="bodySm" color="inkMuted">
            {t('home.packMeta', { count: pack.items.length, price })}
          </Text>
        )}
      </View>
      <CaretRightIcon size={20} color={colors.inkMuted} />
    </PressableSurface>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: space[2] },
  title: { flex: 1 },
  content: { gap: space[4], paddingTop: space[4], paddingBottom: space[6] },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[4], borderRadius: radius.md },
  bannerText: { flex: 1, gap: space[1] },
  ctas: { flexDirection: 'row', gap: space[3], paddingTop: space[3] },
  cta: { flex: 1 },
});
