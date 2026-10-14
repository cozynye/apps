import { colors } from '@nf/ui';
import { Stack } from 'expo-router';

/** Booth session stack (B5–B8), full screen. B5/B6 use the fixed dark camera palette (DESIGN_SYSTEM 촬영 화면 전용). */
export default function BoothLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        contentStyle: { backgroundColor: colors.light.cameraSurface },
      }}
    />
  );
}
