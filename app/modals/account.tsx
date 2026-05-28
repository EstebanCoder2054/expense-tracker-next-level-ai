import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/features/auth/AuthContext';
import { settingsRepository } from '@/features/settings/settingsRepository';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { typography } from '@/lib/theme/typography';

export default function AccountModal() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors, spacing } = useTheme();
  const { user, cloudConfigured, signOut } = useAuth();
  const signedIn = Boolean(user);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <View style={{ padding: spacing.lg }}>
        <Text style={typography.hero}>Account</Text>
        <Text style={[typography.bodyMuted, { marginTop: spacing.sm, marginBottom: spacing.xl }]}>
          {signedIn
            ? 'You are signed in. Cloud sync of expenses will arrive in a later step.'
            : cloudConfigured
              ? 'You are in local-only mode. Sign in below to link this device to your Supabase account.'
              : 'Add Supabase keys to .env to enable cloud sign-in.'}
        </Text>

        <GlassCard>
          <Text style={[typography.subtitle, { marginBottom: spacing.sm }]}>Status</Text>
          <Text style={typography.bodyMuted}>
            {signedIn
              ? `Signed in as ${user?.email ?? user?.id}`
              : 'Data stored on this device (SQLite).'}
          </Text>
        </GlassCard>

        {signedIn ? (
          <View style={{ marginTop: spacing.xl }}>
            <Button
              title="Sign out"
              variant="secondary"
              onPress={async () => {
                await signOut();
                router.back();
              }}
            />
          </View>
        ) : (
          <View style={{ marginTop: spacing.xl }}>
            <Button
              title="Sign in or sign up"
              onPress={() => {
                router.back();
                router.push('/(onboarding)/entry');
              }}
            />
          </View>
        )}

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
