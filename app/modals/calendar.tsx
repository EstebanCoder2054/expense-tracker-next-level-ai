import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WeekCalendar } from '@/components/schedule/WeekCalendar';
import { useSelectedDate } from '@/features/home/selectedDateContext';
import { useDayBreakdown, useExpenseActivity, usePreferences } from '@/hooks/useExpenseQueries';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { typography } from '@/lib/theme/typography';
import { addDays, toDateKey } from '@/lib/utils/date';

export default function CalendarModalRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const prefs = usePreferences();
  const { selectedDate, setSelectedDate } = useSelectedDate();

  const weekStartsOn = prefs.data?.weekStartsOn ?? 'monday';
  const currency = prefs.data?.currency ?? 'USD';
  const localeTag = prefs.data?.localeTag ?? 'en-US';

  const rollingDayKeys = useMemo(() => {
    const out: string[] = [];
    const t = new Date();
    for (let i = -45; i <= 45; i++) {
      out.push(toDateKey(addDays(t, i)));
    }
    return out;
  }, []);

  const breakdownQ = useDayBreakdown(rollingDayKeys);
  const activityQ = useExpenseActivity(rollingDayKeys);

  if (prefs.isLoading || !prefs.data) {
    return null;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, marginBottom: spacing.md }]}>
        <Text style={typography.title}>Calendar</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <Ionicons name="close" size={28} color={colors.textSecondary} />
        </Pressable>
      </View>
      <View style={{ flex: 1, paddingBottom: insets.bottom }}>
        <WeekCalendar
          selectedDate={selectedDate}
          onSelectDate={(d) => {
            setSelectedDate(d);
            router.back();
          }}
          weekStartsOn={weekStartsOn}
          breakdownByDay={breakdownQ.data ?? {}}
          expenseActivity={activityQ.data ?? {}}
          currency={currency}
          localeTag={localeTag}
          expanded
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
