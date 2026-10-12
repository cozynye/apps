import type { NuniPaywallSource } from '@nf/analytics';
import { Paywall, type PaywallPerk } from '@nf/purchases';
import { ChartBarIcon, CameraIcon, CloudIcon, Mascot } from '@nf/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

const SOURCES: NuniPaywallSource[] = ['year', 'lifts', 'backup', 'widget', 'tag', 'photo', 'note', 'share', 'settings'];

/** A9 Paywall (modal, swipe down to close). ?source= picks the headline and the analytics source. */
export default function PaywallScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ source?: string }>();
  const source = SOURCES.find((s) => s === params.source) ?? 'settings';

  const perks: PaywallPerk[] = [
    { icon: (c) => <ChartBarIcon size={24} color={c} />, text: t('paywall.perk1') },
    { icon: (c) => <CloudIcon size={24} color={c} />, text: t('paywall.perk2') },
    { icon: (c) => <CameraIcon size={24} color={c} />, text: t('paywall.perk3') },
  ];

  return (
    <Paywall
      screenId="a9"
      source={source}
      headline={source === 'settings' ? t('paywall.title') : t(`paywall.headline.${source}`)}
      subtitle={t('paywall.subtitle')}
      perks={perks}
      art={<Mascot mood={4} size={96} />}
      onClose={() => router.back()}
      onOpenTerms={() => router.push('/a13-legal/terms')}
      onOpenPrivacy={() => router.push('/a13-legal/privacy')}
    />
  );
}
