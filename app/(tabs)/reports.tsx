import React from 'react';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/ui/GlassCard';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { typography } from '@/lib/theme/typography';

const TAB_BAR_FLOAT = 88;

export default function ReportsPlaceholder() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Screen scroll contentStyle={{ paddingBottom: TAB_BAR_FLOAT + insets.bottom }}>
      <Text style={typography.hero}>Reports</Text>
      <Text style={[typography.bodyMuted, { marginTop: spacing.sm, marginBottom: spacing.xl }]}>
        Day, week, month, and year breakdowns with charts land in Phase 3.
      </Text>
      <GlassCard>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          You already have structured local data in SQLite — we will aggregate it here with polished Skia
          charts and comparisons.
        </Text>
      </GlassCard>
    </Screen>
  );
}
