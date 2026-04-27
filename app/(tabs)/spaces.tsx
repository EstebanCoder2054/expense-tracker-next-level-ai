import React from 'react';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/ui/GlassCard';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { typography } from '@/lib/theme/typography';

const TAB_BAR_FLOAT = 88;

export default function SpacesPlaceholder() {
  const { spacing } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Screen scroll contentStyle={{ paddingBottom: TAB_BAR_FLOAT + insets.bottom }}>
      <Text style={typography.hero}>Spaces</Text>
      <Text style={[typography.bodyMuted, { marginTop: spacing.sm, marginBottom: spacing.xl }]}>
        Personal, trips, roommates, and shared ledgers arrive in Phase 4 with Supabase-backed sync.
      </Text>
      <GlassCard>
        <Text style={typography.bodyMuted}>
          For now, expenses are stored in your personal local space. The domain model already includes{' '}
          <Text style={{ fontWeight: '600' }}>spaceId</Text> on expenses for a smooth migration.
        </Text>
      </GlassCard>
    </Screen>
  );
}
