import type { FourpopPaywallSource } from '@nf/analytics';
import { canUsePack, Paywall, useEntitlementStore, type PaywallPerk, type PaywallSingle } from '@nf/purchases';
import { isLanguage } from '@nf/i18n';
import { CameraIcon, ImageIcon, SparkleIcon, useIsOffline, useToast } from '@nf/ui';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PREMIUM, useCatalog } from '../src/catalog';
import { purchasePack } from '../src/packs';
import { useProductPrice } from '../src/prices';

const SOURCES: FourpopPaywallSource[] = ['hd', 'gif', 'filter', 'pack', 'banner', 'settings', 'shop'];

/** B11 paywall: A9's structure with Fourpop perks. `?packId=` puts that pack's one-time card first (PLAN B11). */
export default function PaywallScreen() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const offline = useIsOffline();
  const params = useLocalSearchParams<{ source?: string; packId?: string }>();
  const source = SOURCES.find((s) => s === params.source) ?? 'settings';
  const language = isLanguage(i18n.language) ? i18n.language : 'en';

  const packs = useCatalog((s) => s.packs);
  const pack = params.packId ? (packs.find((p) => p.id === params.packId) ?? null) : null;
  const usable = useEntitlementStore((s) => (pack ? canUsePack(s, pack, PREMIUM, Date.now()) : true));
  const price = useProductPrice(pack?.productId ?? null);
  const [busy, setBusy] = useState(false);

  async function buyPack() {
    if (!pack) return;
    setBusy(true);
    const outcome = await purchasePack(pack);
    setBusy(false);
    if (outcome === 'success') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast(t('paywall.purchaseSuccess'), 'success');
      router.back();
    } else if (outcome === 'failed') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast(t('paywall.purchaseFailed'), 'error');
    } else if (outcome === 'unavailable') {
      toast(t(offline ? 'error.purchaseOffline' : 'error.generic'), 'error');
    }
  }

  const single: PaywallSingle | undefined =
    pack && !usable
      ? {
          title: pack.title[language],
          subtitle: t(pack.type === 'frame' ? 'shop.frames' : 'shop.stickers', { count: pack.items.length }),
          cta: price ? t('paywall.unlockPack', { price }) : t('paywall.unlockPack', { price: '' }).replace(/\s·\s*$/, ''),
          onPress: () => void buyPack(),
          busy,
          disabled: !price,
        }
      : undefined;

  const perks: PaywallPerk[] = [
    { icon: (c) => <SparkleIcon size={24} color={c} />, text: t('paywall.perk1') },
    { icon: (c) => <ImageIcon size={24} color={c} />, text: t('paywall.perk2') },
    { icon: (c) => <CameraIcon size={24} color={c} />, text: t('paywall.perk3') },
  ];

  return (
    <Paywall
      screenId="b11"
      source={source}
      headline={t('paywall.title')}
      subtitle={t('paywall.subtitle')}
      perks={perks}
      single={single}
      onClose={() => router.back()}
      onOpenTerms={() => router.push('/b13-legal/terms')}
      onOpenPrivacy={() => router.push('/b13-legal/privacy')}
    />
  );
}
