import type { PaywallSource } from '@nf/analytics';
import { track } from '@nf/analytics';
import {
  Button,
  IconButton,
  PlanCard,
  Screen,
  space,
  Text,
  useIsOffline,
  useTheme,
  useToast,
  XIcon,
} from '@nf/ui';
import * as Haptics from 'expo-haptics';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';

import { purchasePackage, restorePurchases } from './client';
import { useSubscriptionOffering, type SubscriptionPlans } from './offering';

export interface PaywallPerk {
  icon: (color: string) => ReactNode;
  text: string;
}

export interface PaywallProps {
  /** Screen id for testIDs: 'a9' (Nuni) or 'b11' (Fourpop). */
  screenId: string;
  source: PaywallSource;
  headline: string;
  subtitle: string;
  perks: PaywallPerk[];
  art?: ReactNode;
  onClose: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

type Plan = 'annual' | 'monthly';

/**
 * Subscription paywall shared by A9 and B11. Prices, periods and auto-renew terms are shown in the
 * app (App Review 3.1.2); prices always come from RevenueCat, never hardcoded.
 */
export function Paywall(props: PaywallProps) {
  const { screenId, source, headline, subtitle, perks, art, onClose } = props;
  const { t } = useTranslation();
  const { colors, accent } = useTheme();
  const offering = useSubscriptionOffering();

  useEffect(() => {
    track('paywall_view', { source });
  }, [source]);

  return (
    <Screen scroll testID={`${screenId}.root`}>
      <View style={styles.header}>
        <IconButton
          testID={`${screenId}.close`}
          accessibilityLabel={t('a11y.close')}
          onPress={onClose}
          renderIcon={(c) => <XIcon size={24} color={c} />}
        />
      </View>
      <View style={styles.hero}>
        {art}
        <Text variant="displayXl" align="center">
          {headline}
        </Text>
        <Text variant="body" color="inkMuted" align="center">
          {subtitle}
        </Text>
      </View>
      <View style={styles.perks}>
        {perks.map((perk) => (
          <View key={perk.text} style={styles.perk}>
            {perk.icon(accent.deep)}
            <Text variant="body" style={styles.perkText}>
              {perk.text}
            </Text>
          </View>
        ))}
      </View>

      {offering.status === 'ready' ? (
        <Plans {...props} plans={offering.plans} />
      ) : offering.status === 'loading' ? (
        <ActivityIndicator style={styles.loading} color={colors.inkMuted} testID={`${screenId}.loading`} />
      ) : (
        <View style={styles.error} testID={`${screenId}.error`}>
          <Text variant="body" color="inkMuted" align="center">
            {t('error.generic')}
          </Text>
          {offering.status === 'error' ? (
            <Button testID={`${screenId}.retry`} variant="secondary" label={t('action.retry')} onPress={offering.reload} />
          ) : null}
        </View>
      )}
    </Screen>
  );
}

function Plans({ screenId, onClose, onOpenTerms, onOpenPrivacy, plans }: PaywallProps & { plans: SubscriptionPlans }) {
  const { t } = useTranslation();
  const toast = useToast();
  const offline = useIsOffline();
  const [plan, setPlan] = useState<Plan>(plans.annual ? 'annual' : 'monthly');
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);

  const year = t('paywall.periodYear');
  const month = t('paywall.periodMonth');
  const trial = plan === 'annual' ? plans.annualTrialDays : null;
  const selected: PurchasesPackage | null = plan === 'annual' ? plans.annual : plans.monthly;
  const selectedPrice = selected?.product.priceString ?? '';
  const selectedPeriod = plan === 'annual' ? year : month;

  const cta = trial
    ? t('paywall.startTrial', { days: trial })
    : plan === 'monthly'
      ? t('paywall.monthlyCta')
      : t('paywall.subscribe');

  async function buy() {
    if (!selected) return;
    setBusy('buy');
    const result = await purchasePackage(selected);
    setBusy(null);
    if (result.status === 'success') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast(t('paywall.purchaseSuccess'), 'success');
      onClose();
    } else if (result.status === 'failed') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast(t('paywall.purchaseFailed'), 'error');
    }
  }

  async function restore() {
    setBusy('restore');
    const result = await restorePurchases();
    setBusy(null);
    if (result === 'restored') {
      toast(t('settings.restoreSuccess'), 'success');
      onClose();
    } else if (result === 'none') {
      toast(t('settings.restoreNone'));
    } else {
      toast(t('error.generic'), 'error');
    }
  }

  return (
    <View style={styles.plans}>
      {plans.annual ? (
        <PlanCard
          testID={`${screenId}.planYearly`}
          title={t('paywall.yearly')}
          subtitle={
            plans.annualTrialDays
              ? t('paywall.trialThen', { days: plans.annualTrialDays, price: plans.annual.product.priceString, period: year })
              : t('paywall.perYear', { price: plans.annual.product.priceString })
          }
          badge={plans.savePercent ? t('paywall.savePercent', { percent: plans.savePercent }) : undefined}
          trailing={
            plans.annual.product.pricePerMonthString
              ? t('paywall.perMonthEquivalent', { price: plans.annual.product.pricePerMonthString })
              : undefined
          }
          selected={plan === 'annual'}
          onPress={() => setPlan('annual')}
        />
      ) : null}
      {plans.monthly ? (
        <PlanCard
          testID={`${screenId}.planMonthly`}
          title={t('paywall.monthly')}
          subtitle={t('paywall.perMonth', { price: plans.monthly.product.priceString })}
          selected={plan === 'monthly'}
          onPress={() => setPlan('monthly')}
        />
      ) : null}

      <View style={styles.cta}>
        {offline ? (
          <Text variant="bodySm" color="statusError" align="center" testID={`${screenId}.offline`}>
            {t('error.purchaseOffline')}
          </Text>
        ) : null}
        <Button
          testID={`${screenId}.cta`}
          label={cta}
          loading={busy === 'buy'}
          disabled={offline || busy !== null || !selected}
          onPress={buy}
        />
        <Text variant="bodyStrong" align="center" testID={`${screenId}.terms`}>
          {trial
            ? t('paywall.afterTrial', { price: selectedPrice, period: selectedPeriod })
            : t('paywall.noTrial', { price: selectedPrice, period: selectedPeriod })}
        </Text>
        <Text variant="bodySm" color="inkMuted" align="center">
          {t('paywall.legal')}
        </Text>
      </View>

      <View style={styles.links}>
        <Link testID={`${screenId}.restore`} label={t('paywall.restore')} onPress={restore} disabled={offline || busy !== null} />
        <Link testID={`${screenId}.termsLink`} label={t('paywall.terms')} onPress={onOpenTerms} />
        <Link testID={`${screenId}.privacyLink`} label={t('paywall.privacy')} onPress={onOpenPrivacy} />
      </View>
      <View style={styles.notNow}>
        <Link testID={`${screenId}.notNow`} label={t('paywall.notNow')} onPress={onClose} muted />
      </View>
    </View>
  );
}

function Link({
  label,
  onPress,
  testID,
  disabled,
  muted,
}: {
  label: string;
  onPress: () => void;
  testID: string;
  disabled?: boolean;
  muted?: boolean;
}) {
  const { accent } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      hitSlop={{ top: 12, bottom: 12, left: 4, right: 4 }}
      style={({ pressed }) => ({ opacity: disabled ? 0.5 : pressed ? 0.85 : 1 })}
    >
      <Text
        variant={muted ? 'bodyStrong' : 'bodySm'}
        color={muted ? 'inkMuted' : undefined}
        style={muted ? undefined : { color: accent.deep, textDecorationLine: 'underline' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'flex-end', marginRight: -space[2] },
  hero: { alignItems: 'center', gap: space[2] },
  perks: { gap: space[3], marginTop: space[6] },
  perk: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  perkText: { flex: 1 },
  loading: { marginTop: space[8] },
  error: { marginTop: space[8], gap: space[3] },
  plans: { gap: space[3], marginTop: space[6], paddingBottom: space[6] },
  cta: { gap: space[2], marginTop: space[3] },
  notNow: { alignItems: 'center', marginTop: space[2] },
  links: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: space[4], marginTop: space[2] },
});
