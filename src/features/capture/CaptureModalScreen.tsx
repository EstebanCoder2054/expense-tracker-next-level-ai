import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { typography } from '@/lib/theme/typography';
import { toDateKey } from '@/lib/utils/date';

const OPTIONS: {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  href?: '/expense/add';
}[] = [
  {
    key: 'manual',
    title: 'Add expense',
    subtitle: 'Amount, category, note',
    icon: 'create-outline',
    href: '/expense/add',
  },
  {
    key: 'memo',
    title: 'Quick memo',
    subtitle: 'Natural language — Phase 6',
    icon: 'chatbubble-outline',
  },
  {
    key: 'scan',
    title: 'Scan or import',
    subtitle: 'Receipts & statements — Phase 7',
    icon: 'scan-outline',
  },
  {
    key: 'split',
    title: 'Split expense',
    subtitle: 'Groups & balances — Phase 5',
    icon: 'git-network-outline',
  },
];

export function CaptureModalScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const today = toDateKey(new Date());

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <Text style={typography.hero}>Capture</Text>
        <Text style={[typography.bodyMuted, { marginTop: spacing.xs }]}>
          Fast paths to log spending. Manual entry works offline today.
        </Text>
      </View>

      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        {OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => {
              if (opt.href) {
                router.replace({ pathname: opt.href, params: { date: today } });
                return;
              }
            }}>
            <GlassCard contentPadding={16}>
              <View style={styles.row}>
                <View style={[styles.iconWrap, { backgroundColor: colors.backgroundElevated }]}>
                  <Ionicons name={opt.icon} size={22} color={colors.accentPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { fontWeight: '600' }]}>{opt.title}</Text>
                  <Text style={[typography.bodyMuted, { marginTop: 4 }]}>{opt.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            </GlassCard>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
