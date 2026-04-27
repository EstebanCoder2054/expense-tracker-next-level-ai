import { Stack } from 'expo-router';

import { palette } from '@/lib/theme/tokens';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.textPrimary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: palette.background },
      }}>
      <Stack.Screen name="slides" options={{ title: '', headerShown: false }} />
      <Stack.Screen name="entry" options={{ title: 'Account' }} />
      <Stack.Screen name="preferences" options={{ title: 'Preferences' }} />
    </Stack>
  );
}
