import { Redirect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { settingsRepository } from '@/features/settings/settingsRepository';
import { useTheme } from '@/lib/theme/ThemeProvider';

export default function Index() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const [target, setTarget] = useState<'/(onboarding)/slides' | '/(tabs)/home' | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const done = await settingsRepository.isOnboardingComplete(db);
      if (!alive) return;
      setTarget(done ? '/(tabs)/home' : '/(onboarding)/slides');
    })();
    return () => {
      alive = false;
    };
  }, [db]);

  if (!target) {
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
