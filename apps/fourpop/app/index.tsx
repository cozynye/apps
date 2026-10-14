import { Redirect } from 'expo-router';

import { useAppState } from '../src/app-state';

/** First launch → B2 onboarding (once), otherwise B3 home. */
export default function Index() {
  const onboarded = useAppState((s) => s.onboarded);
  return <Redirect href={onboarded ? '/b3-home' : '/b2-onboarding'} />;
}
