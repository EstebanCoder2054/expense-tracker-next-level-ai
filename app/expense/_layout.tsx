import { Stack } from 'expo-router';

import { palette } from '@/lib/theme/tokens';

export default function ExpenseLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.textPrimary,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: palette.background },
      }}>
      <Stack.Screen name="add" options={{ title: 'New transaction' }} />
      <Stack.Screen name="[id]" options={{ title: 'Edit transaction' }} />
    </Stack>
  );
}
