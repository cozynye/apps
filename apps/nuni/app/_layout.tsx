import { AppProviders, useTheme } from '@nf/ui';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <AppProviders app="nuni">
      <RootStack />
    </AppProviders>
  );
}

function RootStack() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface1 },
      }}
    />
  );
}
