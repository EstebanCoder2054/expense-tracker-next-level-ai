import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { settingsRepository } from '@/features/settings/settingsRepository';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { typography } from '@/lib/theme/typography';

export default function AccountModal() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors, spacing } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <View style={{ padding: spacing.lg }}>
        <Text style={typography.hero}>Account</Text>
        <Text style={[typography.bodyMuted, { marginTop: spacing.sm, marginBottom: spacing.xl }]}>
          You are using local-only mode. Sign-in and sync will be available in Phase 2 (Supabase).
        </Text>

        <GlassCard>
          <Text style={[typography.subtitle, { marginBottom: spacing.sm }]}>Status</Text>
          <Text style={typography.bodyMuted}>Data stored on this device (SQLite).</Text>
        </GlassCard>

        <View style={{ marginTop: spacing.xl }}>
          <Button
            title="Sign up or sign in (soon)"
            onPress={() =>
              Alert.alert(
                'Coming in Phase 2',
                'Email/password and Google sign-in will connect to Supabase with optional sync.',
              )
            }
          />
        </View>

        <View style={{ marginTop: spacing.md }}>
          <Button
            variant="ghost"
            title="Replay onboarding"
            onPress={async () => {
              await settingsRepository.setOnboardingComplete(db, false);
              router.replace('/(onboarding)/slides');
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
