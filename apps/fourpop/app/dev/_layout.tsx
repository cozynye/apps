import { Redirect, Stack } from 'expo-router';

/** Dev-only screens (like Nuni's). Unreachable in production builds. */
export default function DevLayout() {
  if (process.env.EXPO_PUBLIC_ENV === 'production') return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
