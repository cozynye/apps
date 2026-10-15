import { MONETIZATION } from '@nf/purchases';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { useAppState } from '../../src/app-state';

/** Deep link `nuni://premium/<source>` (the locked medium widget): A3 with A9 on top. */
export default function PremiumLink() {
  const { source } = useLocalSearchParams<{ source: string }>();
  useEffect(() => {
    if (!useAppState.getState().onboarded) return router.replace('/a2-onboarding');
    router.navigate('/a3-home');
    if (MONETIZATION) router.push({ pathname: '/a9-paywall', params: { source } });
  }, [source]);
  return null;
}
