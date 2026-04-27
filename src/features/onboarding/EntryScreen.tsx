import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Screen } from '@/components/ui/Screen';
import { settingsRepository } from '@/features/settings/settingsRepository';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { typography } from '@/lib/theme/typography';

export function EntryScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors, spacing } = useTheme();

  return (
    <Screen scroll contentStyle={{ paddingBottom: 40 }}>
      <Text style={[typography.hero, { fontSize: 26 }]}>How do you want to start?</Text>
      <Text style={[typography.bodyMuted, { marginTop: spacing.sm, marginBottom: spacing.xxl }]}>
        Cloud sign-in arrives next phase. Local mode is full-featured for tracking.
      </Text>

      <View style={{ gap: spacing.md }}>
        <GlassCard>
          <Button
            variant="secondary"
            title="Continue with Google"
            leftIcon={<Ionicons name="logo-google" size={18} color={colors.textPrimary} />}
            onPress={() =>
              Alert.alert('Coming in Phase 2', 'Google sign-in will connect to Supabase.', [
                { text: 'OK' },
              ])
            }
          />
          <View style={{ height: spacing.md }} />
          <Button
            variant="ghost"
            title="Sign in or sign up with email"
            onPress={() =>
              Alert.alert('Coming in Phase 2', 'Email and password auth will use Supabase.', [
                { text: 'OK' },
              ])
            }
          />
        </GlassCard>

        <Button
          title="Continue locally"
          onPress={async () => {
            await settingsRepository.setEntryMode(db, 'local');
            router.push('/(onboarding)/preferences');
          }}
        />
      </View>

      <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xxl, textAlign: 'center' }]}>
        You can add an account later without losing on-device data.
      </Text>
    </Screen>
  );
}
