import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SwipeableExpenseRow } from '@/components/expenses/SwipeableExpenseRow';
import { HeroAccent } from '@/components/home/HeroAccent';
import { GlassCard } from '@/components/ui/GlassCard';
import { Screen } from '@/components/ui/Screen';
import { WeekCalendar } from '@/components/schedule/WeekCalendar';
import { useSelectedDate } from '@/features/home/selectedDateContext';
import { settingsRepository } from '@/features/settings/settingsRepository';
import {
  useCategories,
  useDayBreakdown,
  useDeleteExpense,
  useExpenseActivity,
  useExpensesForDay,
  usePeriodIncomeExpense,
  usePreferences,
  useSetExpensePinned,
} from '@/hooks/useExpenseQueries';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { typography } from '@/lib/theme/typography';
import {
  addDays,
  formatCurrencyDisplay,
  type BalancePeriod,
  toDateKey,
} from '@/lib/utils/date';
import type { Category } from '@/types/domain';

const TAB_BAR_FLOAT = 88;

const PERIOD_OPTIONS: { key: BalancePeriod; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

export function HomeScreen() {
  const { colors, spacing, radii } = useTheme();
  const router = useRouter();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const hPad = Math.max(insets.left, insets.right, 12) + 4;
  const [balancePeriod, setBalancePeriod] = useState<BalancePeriod>('monthly');
  const { selectedDate, setSelectedDate, selectedDateKey } = useSelectedDate();
  const prefs = usePreferences();
  const categoriesQ = useCategories();
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
  const periodTotalsQ = usePeriodIncomeExpense(new Date(), balancePeriod, weekStartsOn);

  const expensesQ = useExpensesForDay(selectedDateKey);
  const del = useDeleteExpense();
  const pin = useSetExpensePinned();

  const categoryMap = useMemo(() => {
    const m = new Map<string, Category>();
    for (const c of categoriesQ.data ?? []) m.set(c.id, c);
    return m;
  }, [categoriesQ.data]);

  const dayBreakdown = breakdownQ.data?.[selectedDateKey];
  const dayNet = dayBreakdown?.netCents ?? 0;

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const netLabel =
    dayNet === 0
      ? formatCurrencyDisplay(0, currency, localeTag)
      : `${dayNet > 0 ? '+' : '−'}${formatCurrencyDisplay(Math.abs(dayNet), currency, localeTag)}`;

  const inc = periodTotalsQ.data?.incomeCents ?? 0;
  const exp = periodTotalsQ.data?.expenseCents ?? 0;
  const netPeriod = inc - exp;
  const periodLabel = PERIOD_OPTIONS.find((p) => p.key === balancePeriod)?.label ?? 'Monthly';

  if (prefs.isLoading || !prefs.data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accentPrimary} />
      </View>
    );
  }

  return (
    <Screen
      scroll
      contentStyle={{
        paddingBottom: TAB_BAR_FLOAT + insets.bottom,
      }}>
      <View style={styles.heroWrap}>
        <HeroAccent />
        <View style={{ paddingTop: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={[typography.title, { fontSize: 20, fontWeight: '600' }]}>{greeting}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: spacing.sm, gap: 6 }}>
              {PERIOD_OPTIONS.map((p) => {
                const on = balancePeriod === p.key;
                return (
                  <Pressable
                    key={p.key}
                    onPress={() => setBalancePeriod(p.key)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: radii.full,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: on ? colors.accentPrimary : colors.borderSubtle,
                      backgroundColor: on ? 'rgba(93, 107, 255, 0.15)' : 'transparent',
                    }}>
                    <Text
                      style={[
                        typography.caption,
                        { color: on ? colors.accentPrimary : colors.textMuted, fontSize: 11 },
                      ]}>
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
              Income & expenses · {periodLabel}
            </Text>
            <View style={{ marginTop: spacing.xs, gap: 4 }}>
              <Text style={[typography.bodyMuted, { fontSize: 13 }]}>
                <Text style={{ color: colors.accentPrimary }}>+{formatCurrencyDisplay(inc, currency, localeTag)}</Text>
                {'  '}
                <Text style={{ color: colors.expense }}>
                  −{formatCurrencyDisplay(exp, currency, localeTag)}
                </Text>
              </Text>
              <Text style={[typography.hero, { fontSize: 32, marginTop: 2 }]}>
                <Text style={{ color: netPeriod >= 0 ? colors.accentPrimary : colors.expense }}>
                  {netPeriod === 0
                    ? formatCurrencyDisplay(0, currency, localeTag)
                    : `${netPeriod > 0 ? '+' : '−'}${formatCurrencyDisplay(Math.abs(netPeriod), currency, localeTag)}`}
                </Text>
              </Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>Net ({periodLabel.toLowerCase()})</Text>
            </View>
            <Text style={[typography.bodyMuted, { marginTop: spacing.md }]}>
              <Text style={{ color: dayNet >= 0 ? colors.accentPrimary : colors.expense }}>{netLabel}</Text>
              {' '}selected day (net)
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Account"
            onPress={() => router.push('/modals/account' as Href)}
            hitSlop={12}>
            <Ionicons name="person-circle-outline" size={34} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <Pressable
        style={styles.replayHint}
        onPress={async () => {
          await settingsRepository.setOnboardingComplete(db, false);
          router.replace('/(onboarding)/slides');
        }}
        accessibilityLabel="Replay onboarding"
        accessibilityHint="Restarts the onboarding flow on next step">
        <Text style={[typography.caption, { color: colors.textMuted, fontSize: 11 }]}>
          Replay onboarding
        </Text>
      </Pressable>

      <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>QUICK ACTIONS</Text>
        <View style={styles.actionsRow}>
          <QuickAction
            icon="add-circle-outline"
            label="Add"
            onPress={() =>
              router.push({ pathname: '/expense/add', params: { date: selectedDateKey } })
            }
          />
          <QuickAction
            icon="chatbubble-ellipses-outline"
            label="Memo"
            onPress={() => router.push('/modals/capture')}
          />
          <QuickAction
            icon="document-text-outline"
            label="Import"
            onPress={() => router.push('/modals/capture')}
          />
          <QuickAction
            icon="people-outline"
            label="Split"
            onPress={() => router.push('/modals/capture')}
          />
        </View>
      </View>

      <View style={{ marginTop: spacing.xxl, marginHorizontal: -hPad }}>
        <WeekCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          weekStartsOn={weekStartsOn}
          breakdownByDay={breakdownQ.data ?? {}}
          expenseActivity={activityQ.data ?? {}}
          currency={currency}
          localeTag={localeTag}
          onExpandPress={() => router.push('/modals/calendar' as Href)}
        />
      </View>

      <View style={{ marginTop: spacing.xxl, gap: spacing.md }}>
        <View style={styles.sectionHead}>
          <Text style={typography.title}>Day</Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>{selectedDateKey}</Text>
        </View>

        <GlassCard>
          {expensesQ.isLoading ? (
            <ActivityIndicator color={colors.accentPrimary} />
          ) : (expensesQ.data?.length ?? 0) === 0 ? (
            <Text style={[typography.bodyMuted, { textAlign: 'center', paddingVertical: 8 }]}>
              No transactions this day. Tap Add or the floating button.
            </Text>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {expensesQ.data?.map((e) => (
                <SwipeableExpenseRow
                  key={e.id}
                  expense={e}
                  category={categoryMap.get(e.categoryId)}
                  localeTag={localeTag}
                  onPress={() => router.push(`/expense/${e.id}` as Href)}
                  onDelete={() => void del.mutateAsync({ id: e.id, occurredOn: e.occurredOn })}
                  onPinToggle={() =>
                    void pin.mutateAsync({
                      id: e.id,
                      pinned: !e.pinned,
                      occurredOn: e.occurredOn,
                    })
                  }
                />
              ))}
            </View>
          )}
        </GlassCard>
      </View>
    </Screen>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const { colors, radii } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.qa,
        {
          borderRadius: radii.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.borderSubtle,
          opacity: pressed ? 0.88 : 1,
          overflow: 'hidden',
        },
      ]}>
      <LinearGradient
        colors={['rgba(93, 107, 255, 0.22)', 'rgba(130, 96, 255, 0.12)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Ionicons name={icon} size={22} color={colors.accentPrimary} style={{ zIndex: 1 }} />
      <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 6, zIndex: 1 }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroWrap: { marginHorizontal: -8, paddingHorizontal: 4, minHeight: 120 },
  replayHint: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  qa: {
    flex: 1,
    minWidth: '22%',
    maxWidth: '25%',
    alignItems: 'center',
    paddingVertical: 14,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
});
