import { MONETIZATION } from '@nf/purchases';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { useAppState } from '../../src/app-state';

/** Deep link `fourpop://shop/<packId>` (PLAN 딥링크): B10 with that pack's B11 card on top. */
export default function ShopLink() {
  const { packId } = useLocalSearchParams<{ packId: string }>();
  useEffect(() => {
    if (!useAppState.getState().onboarded) return router.replace('/b2-onboarding');
    router.navigate('/b10-shop');
    if (MONETIZATION) router.push({ pathname: '/b11-paywall', params: { source: 'banner', packId } });
  }, [packId]);
  return null;
}
