import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { GlassCard } from '@/components/ui/GlassCard';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthContext';
import { settingsRepository } from '@/features/settings/settingsRepository';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { typography } from '@/lib/theme/typography';

export function EntryScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors, spacing } = useTheme();
  const {
    cloudConfigured,
    signInWithPassword,
    signUpWithPassword,
    signInWithGoogle,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'google' | 'signin' | 'signup' | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const afterCloudAuth = async () => {
    await settingsRepository.setEntryMode(db, 'pending_cloud');
    const done = await settingsRepository.isOnboardingComplete(db);
    router.replace(done ? '/(tabs)/home' : '/(onboarding)/preferences');
  };

  const onGoogle = async () => {
    if (!cloudConfigured) {
      Alert.alert('Not configured', 'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env');
      return;
    }
    setFieldError(null);
    setBusy('google');
    const { error, cancelled } = await signInWithGoogle();
    setBusy(null);
    if (error) {
      Alert.alert('Google sign-in', error.message);
      return;
    }
    if (cancelled) return;
    await afterCloudAuth();
  };

  const onSignIn = async () => {
    if (!email.trim() || !password) {
      setFieldError('Enter email and password');
      return;
    }
    setFieldError(null);
    setBusy('signin');
    const { error } = await signInWithPassword(email, password);
    setBusy(null);
    if (error) {
      Alert.alert('Sign in', error.message);
      return;
    }
    await afterCloudAuth();
  };

  const onSignUp = async () => {
    if (!email.trim() || password.length < 6) {
      setFieldError('Email required; password at least 6 characters');
      return;
    }
    setFieldError(null);
    setBusy('signup');
    const { error, hasSession } = await signUpWithPassword(email, password);
    setBusy(null);
    if (error) {
      Alert.alert('Sign up', error.message);
      return;
    }
    if (hasSession) {
      await afterCloudAuth();
      return;
    }
    Alert.alert(
      'Check your email',
      'If email confirmation is enabled in Supabase, open the link we sent you, then sign in here.',
    );
  };

  return (
    <Screen scroll={false} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}>
          <Text style={[typography.hero, { fontSize: 26 }]}>How do you want to start?</Text>
          <Text style={[typography.bodyMuted, { marginTop: spacing.sm, marginBottom: spacing.lg }]}>
            Sign in to sync with the cloud, or keep everything on this device only.
          </Text>

          {!cloudConfigured ? (
            <Text style={[typography.caption, { color: colors.expense, marginBottom: spacing.md }]}>
              Cloud sign-in is disabled until EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in
              .env.
            </Text>
          ) : null}

          <GlassCard>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              error={fieldError ?? undefined}
            />
            <View style={{ height: spacing.md }} />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
            <View style={{ height: spacing.md }} />
            <Button
              title="Sign in with email"
              onPress={() => void onSignIn()}
              loading={busy === 'signin'}
              disabled={busy !== null}
            />
            <View style={{ height: spacing.sm }} />
            <Button
              variant="secondary"
              title="Create account"
              onPress={() => void onSignUp()}
              loading={busy === 'signup'}
              disabled={busy !== null}
            />
            <View style={{ height: spacing.lg }} />
            <Button
              variant="secondary"
              title="Continue with Google"
              leftIcon={<Ionicons name="logo-google" size={18} color={colors.textPrimary} />}
              onPress={() => void onGoogle()}
              loading={busy === 'google'}
              disabled={busy !== null || !cloudConfigured}
            />
          </GlassCard>

          <View style={{ height: spacing.lg }} />

          <Button
            title="Continue locally"
            onPress={async () => {
              await settingsRepository.setEntryMode(db, 'local');
              router.push('/(onboarding)/preferences');
            }}
            disabled={busy !== null}
          />

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xxl, textAlign: 'center' }]}>
            You can add an account later without losing on-device data.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
