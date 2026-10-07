import { Redirect, Stack } from 'expo-router';

/** Dev-only screens (S1 dummy app). Unreachable in production builds. */
export default function DevLayout() {
  if (process.env.EXPO_PUBLIC_ENV === 'production') return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
