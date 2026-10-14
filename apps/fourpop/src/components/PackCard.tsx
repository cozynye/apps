import type { Pack } from '@nf/content';
import { formatDateNumeric, fromLocalDateString, isLanguage } from '@nf/i18n';
import { isEntitled, useEntitlement, useEntitlementStore } from '@nf/purchases';
import { Button, LockSimpleIcon, PressableSurface, radius, space, Text, useIsOffline, useTheme, useToast } from '@nf/ui';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

import { imageSource, PREMIUM, useCatalog } from '../catalog';
import { downloadForPremium, retryInstall, useInstalls } from '../packs';

export interface PackCardProps {
  pack: Pack;
  /** Localized price of `pack.productId`, or null while unknown (offline / purchases disabled). */
  price: string | null;
  /** Locked pack tapped: `pack_view` + B11 with the pack card. */
  onOpen: () => void;
}

/**
 * B10 shop card: thumbnail, title, item count, season end, and one of Free / Owned / Included in
 * Premium / Unlock. Owned-but-not-downloaded packs (Premium, restored purchase, failed download)
 * offer Download / Try again (PLAN 예외 › 팩 다운로드 중 실패).
 */
export function PackCard({ pack, price, onOpen }: PackCardProps) {
  const { t, i18n } = useTranslation();
  const { colors, accent } = useTheme();
  const toast = useToast();
  const offline = useIsOffline();
  const language = isLanguage(i18n.language) ? i18n.language : 'en';
  const premium = useEntitlement(PREMIUM);
  const own = useEntitlementStore((s) => (pack.entitlementId ? isEntitled(s, pack.entitlementId, Date.now()) : false));
  const installed = useCatalog((s) => s.installedIds.has(pack.id));
  const install = useInstalls((s) => s[pack.id]);

  const entitled = pack.free || own || premium;
  const needsDownload = entitled && !pack.free && !pack.bundled && !installed;
  const thumbnail = pack.thumbnail ?? (pack.type === 'frame' ? pack.items[0]?.thumbnail : pack.items[0]?.image);
  const count = t(pack.type === 'frame' ? 'shop.frames' : 'shop.stickers', { count: pack.items.length });
  const until = pack.availableUntil
    ? t('shop.seasonEnds', { date: formatDateNumeric(fromLocalDateString(pack.availableUntil.slice(0, 10))) })
    : null;

  async function download() {
    try {
      await (own || install?.status === 'failed' ? retryInstall(pack) : downloadForPremium(pack));
    } catch {
      toast(t('error.generic'), 'error');
    }
  }

  // Access follows entitlements, not files: a pack a lapsed subscriber downloaded shows locked again
  // (its files stay, PLAN 예외 › 구독 만료).
  const status = pack.free
    ? { key: 'free', text: t('shop.free') }
    : own
      ? { key: 'owned', text: t('shop.owned') }
      : premium
        ? { key: 'premium', text: t('shop.includedInPremium') }
        : null;

  let action: React.ReactNode = null;
  if (install?.status === 'downloading') {
    action = (
      <View style={styles.progress} testID={`b10.downloading.${pack.id}`}>
        <ActivityIndicator color={accent.deep} />
        <Text variant="caption" color="inkMuted">{`${install.done}/${install.total}`}</Text>
      </View>
    );
  } else if (install?.status === 'failed') {
    action = <Button testID={`b10.retry.${pack.id}`} variant="secondary" label={t('action.retry')} disabled={offline} onPress={() => void download()} />;
  } else if (needsDownload) {
    action = <Button testID={`b10.download.${pack.id}`} variant="secondary" label={t('shop.download')} disabled={offline} onPress={() => void download()} />;
  } else if (!entitled && price) {
    action = <Button testID={`b10.unlock.${pack.id}`} variant="secondary" label={t('shop.unlock', { price })} disabled={offline} onPress={onOpen} />;
  }

  const onPress = !entitled ? onOpen : pack.type === 'frame' ? () => router.push('/b4-frames') : undefined;

  return (
    <PressableSurface
      testID={`b10.pack.${pack.id}`}
      accessibilityLabel={[pack.title[language], count, status?.text].filter(Boolean).join(', ')}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.card, { backgroundColor: colors.surface0, borderColor: colors.line }]}
    >
      <View style={[styles.thumbWrap, pack.type === 'sticker' && styles.thumbWrapSquare, { backgroundColor: colors.surface2 }]}>
        {thumbnail ? <Image source={imageSource(thumbnail)} style={styles.thumb} resizeMode="contain" /> : null}
        {!entitled && (
          <View style={[styles.lock, { backgroundColor: colors.surface0 }]}>
            <LockSimpleIcon size={14} color={colors.ink} />
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text variant="bodyStrong">{pack.title[language]}</Text>
        <Text variant="bodySm" color="inkMuted">
          {until ? `${count} · ${until}` : count}
        </Text>
        {status ? (
          <Text variant="bodySm" testID={`b10.${status.key}.${pack.id}`} style={{ color: status.key === 'free' ? colors.inkMuted : accent.deep }}>
            {status.text}
          </Text>
        ) : null}
        {action ? <View style={styles.action}>{action}</View> : null}
      </View>
    </PressableSurface>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: space[3], padding: space[3], borderWidth: 1, borderRadius: radius.md },
  thumbWrap: { width: 56, height: 168, borderRadius: radius.sm, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  thumbWrapSquare: { height: 56, alignSelf: 'flex-start' },
  thumb: { width: '100%', height: '100%' },
  lock: { position: 'absolute', top: space[1], right: space[1], borderRadius: radius.pill, padding: 3 },
  body: { flex: 1, gap: space[1], justifyContent: 'center' },
  action: { marginTop: space[2], alignSelf: 'flex-start', minWidth: 160 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
});
