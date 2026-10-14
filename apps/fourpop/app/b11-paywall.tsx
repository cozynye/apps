import type { FourpopPaywallSource } from '@nf/analytics';
import { Paywall, type PaywallPerk } from '@nf/purchases';
import { CameraIcon, ImageIcon, SparkleIcon } from '@nf/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

const SOURCES: FourpopPaywallSource[] = ['hd', 'gif', 'filter', 'pack', 'banner', 'settings', 'shop'];

/** B11 paywall: A9's structure with Fourpop perks (PLAN B11). ?source= for analytics. */
export default function PaywallScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ source?: string; packId?: string }>();
  const source = SOURCES.find((s) => s === params.source) ?? 'settings';

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
      onClose={() => router.back()}
      onOpenTerms={() => router.push('/b13-legal/terms')}
      onOpenPrivacy={() => router.push('/b13-legal/privacy')}
    />
  );
}
