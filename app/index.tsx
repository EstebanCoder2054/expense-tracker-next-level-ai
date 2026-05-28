import { Redirect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/features/auth/AuthContext';
import { settingsRepository } from '@/features/settings/settingsRepository';
import { useTheme } from '@/lib/theme/ThemeProvider';

type Target = '/(onboarding)/slides' | '/(onboarding)/preferences' | '/(tabs)/home' | null;

export default function Index() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const { session, initialized } = useAuth();
  const [target, setTarget] = useState<Target>(null);

  useEffect(() => {
    if (!initialized) return;
    let alive = true;
    void (async () => {
      const done = await settingsRepository.isOnboardingComplete(db);
      if (!alive) return;
      if (session?.user) {
        setTarget(done ? '/(tabs)/home' : '/(onboarding)/preferences');
      } else {
        setTarget(done ? '/(tabs)/home' : '/(onboarding)/slides');
      }
    })();
    return () => {
      alive = false;
    };
  }, [db, initialized, session]);

  if (!initialized || !target) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <ActivityIndicator color={colors.accentPrimary} />
      </View>
    );
  }

  return <Redirect href={target} />;
}
