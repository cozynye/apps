import { useCallback, useEffect, useState } from 'react';
import { PACKAGE_TYPE, type PurchasesPackage } from 'react-native-purchases';

import { getCurrentOffering, getTrialEligibility } from './client';
import { savePercent, trialDays } from './pricing';
import { useEntitlementStore } from './store';

export interface SubscriptionPlans {
  annual: PurchasesPackage | null;
  monthly: PurchasesPackage | null;
  /** Free-trial length of the annual plan when this Apple ID is eligible, else null. */
  annualTrialDays: number | null;
  /** Yearly saving vs 12 × monthly, whole percent; null when not computable or ≤ 0. */
  savePercent: number | null;
}

export type OfferingState =
  | { status: 'loading' }
  | { status: 'disabled' } // no API key
  | { status: 'error' }
  | { status: 'ready'; plans: SubscriptionPlans };

/** Loads the `default` offering's annual and monthly packages plus trial eligibility. */
export function useSubscriptionOffering(): OfferingState & { reload: () => void } {
  const enabled = useEntitlementStore((s) => s.enabled);
  const [state, setState] = useState<OfferingState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loadPlans()
      .then((plans) => !cancelled && setState({ status: 'ready', plans }))
      .catch(() => !cancelled && setState({ status: 'error' }));
    return () => {
      cancelled = true;
    };
  }, [enabled, attempt]);

  if (!enabled) return { status: 'disabled', reload };
  return { ...state, reload };
}

async function loadPlans(): Promise<SubscriptionPlans> {
  const offering = await getCurrentOffering();
  const pick = (type: PACKAGE_TYPE) =>
    offering?.availablePackages.find((p) => p.packageType === type) ?? null;
  const annual = pick(PACKAGE_TYPE.ANNUAL);
  const monthly = pick(PACKAGE_TYPE.MONTHLY);
  if (!annual && !monthly) throw new Error('Offering has no annual or monthly package');

  let annualTrialDays: number | null = null;
  const days = trialDays(annual?.product.introPrice ?? null);
  if (annual && days) {
    const eligibility = await getTrialEligibility([annual.product.identifier]);
    annualTrialDays = eligibility[annual.product.identifier] === false ? null : days;
  }
  return {
    annual,
    monthly,
    annualTrialDays,
    savePercent: annual && monthly ? savePercent(annual.product.price, monthly.product.price) : null,
  };
}
