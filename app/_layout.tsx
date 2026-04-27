import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SelectedDateProvider } from '@/features/home/selectedDateContext';
import { runMigrations } from '@/lib/db/migrations';
import { seedCategoriesIfEmpty } from '@/lib/db/seedCategories';
import { queryClient } from '@/lib/query/queryClient';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { palette } from '@/lib/theme/tokens';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SQLiteProvider
          databaseName="expense_tracker.db"
          onInit={async (db) => {
            await runMigrations(db);
            await seedCategoriesIfEmpty(db);
          }}>
          <ThemeProvider>
            <StatusBar style="light" />
            <SelectedDateProvider>
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: palette.background },
                  headerTintColor: palette.textPrimary,
                  headerTitleStyle: { fontWeight: '600' },
                  contentStyle: { backgroundColor: palette.background },
                }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="modals/capture"
                  options={{
                    presentation: 'modal',
                    headerShown: false,
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen
                  name="modals/calendar"
                  options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }}
                />
              <Stack.Screen name="expense" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen
                name="modals/account"
                options={{ presentation: 'modal', title: 'Account', headerShown: true }}
              />
                <Stack.Screen
                  name="modals/add-category"
                  options={{ presentation: 'modal', title: 'Category', headerShown: true }}
                />
              </Stack>
            </SelectedDateProvider>
          </ThemeProvider>
        </SQLiteProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
