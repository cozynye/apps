import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

/** Deep link `nuni://premium/<source>` (the locked medium widget): A3 with A9 on top. */
export default function PremiumLink() {
  const { source } = useLocalSearchParams<{ source: string }>();
  useEffect(() => {
    router.navigate('/a3-home');
    router.push({ pathname: '/a9-paywall', params: { source } });
  }, [source]);
  return null;
}
