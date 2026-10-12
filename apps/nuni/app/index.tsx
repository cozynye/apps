import { Redirect } from 'expo-router';

import { useAppState } from '../src/app-state';

/** First launch → A2 onboarding (once), otherwise A3 home. Dev screens: nuni://dev. */
export default function Index() {
  const onboarded = useAppState((s) => s.onboarded);
  return <Redirect href={onboarded ? '/a3-home' : '/a2-onboarding'} />;
}
