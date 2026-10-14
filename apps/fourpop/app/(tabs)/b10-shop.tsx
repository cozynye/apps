import { track } from '@nf/analytics';
import { shopPacks, type Pack } from '@nf/content';
import { toLocalDateString } from '@nf/i18n';
import { useEntitlement } from '@nf/purchases';
import { CaretRightIcon, PressableSurface, radius, Screen, space, SparkleIcon, Text, useIsOffline, useTheme } from '@nf/ui';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { framePacks, PREMIUM, stickerPacks, useCatalog } from '../../src/catalog';
import { PackCard } from '../../src/components/PackCard';
import { useProductPrices } from '../../src/prices';

/** B10 shop: frame packs, sticker packs, Premium banner. Offline → cached manifest, installed/bundled packs only (PLAN B10 · 예외 › 오프라인). */
export default function ShopScreen() {
  const { t } = useTranslation();
  const { colors, accent } = useTheme();
  const offline = useIsOffline();
  const premium = useEntitlement(PREMIUM);
  const { packs, updateRequired, installedIds } = useCatalog();
  const today = toLocalDateString(new Date());

  const listed = shopPacks({ packs, updateRequired }, today, installedIds).filter(
    (p) => !offline || p.bundled || installedIds.has(p.id),
  );
  const prices = useProductPrices(listed.flatMap((p) => (p.productId && !p.free ? [p.productId] : [])));

  function open(pack: Pack) {
    track('pack_view', { pack_id: pack.id });
    router.push({ pathname: '/b11-paywall', params: { source: 'shop', packId: pack.id } });
  }

  const section = (title: string, items: Pack[], testID: string) =>
    items.length > 0 ? (
      <View style={styles.section} testID={testID}>
        <Text variant="bodySm" color="inkMuted">
          {title}
        </Text>
        {items.map((pack) => (
          <PackCard key={pack.id} pack={pack} price={pack.productId ? (prices[pack.productId] ?? null) : null} onOpen={() => open(pack)} />
        ))}
      </View>
    ) : null;

  return (
    <Screen edges={['top']}>
      <Text variant="displayLg" testID="b10.title" style={styles.title}>
        {t('shop.title')}
      </Text>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
        {offline ? (
          <Text variant="bodySm" color="inkMuted" testID="b10.offline" style={[styles.notice, { backgroundColor: colors.surface2 }]}>
            {t('shop.offline')}
          </Text>
        ) : null}
        {updateRequired ? (
          <Text variant="bodySm" color="inkMuted" testID="b10.updateApp" style={[styles.notice, { backgroundColor: colors.surface2 }]}>
            {t('shop.updateApp')}
          </Text>
        ) : null}
        {!premium ? (
          <PressableSurface
            testID="b10.premium"
            accessibilityLabel={`${t('paywall.title')}. ${t('paywall.subtitle')}`}
            onPress={() => router.push({ pathname: '/b11-paywall', params: { source: 'shop' } })}
            style={[styles.banner, { backgroundColor: accent.soft }]}
          >
            <SparkleIcon size={28} color={accent.deep} />
            <View style={styles.bannerText}>
              <Text variant="bodyStrong">{t('paywall.title')}</Text>
              <Text variant="bodySm" color="inkMuted">
                {t('paywall.subtitle')}
              </Text>
            </View>
            <CaretRightIcon size={20} color={colors.inkMuted} />
          </PressableSurface>
        ) : null}
        {section(t('shop.framePacks'), framePacks(listed), 'b10.framePacks')}
        {section(t('shop.stickerPacks'), stickerPacks(listed), 'b10.stickerPacks')}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { paddingTop: space[2] },
  content: { gap: space[5], paddingTop: space[4], paddingBottom: space[8] },
  notice: { padding: space[3], borderRadius: radius.sm, overflow: 'hidden' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[4], borderRadius: radius.md },
  bannerText: { flex: 1, gap: space[1] },
  section: { gap: space[2] },
});
