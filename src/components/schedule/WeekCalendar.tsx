import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewToken,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useTheme } from '@/lib/theme/ThemeProvider';
import type { Theme } from '@/lib/theme/tokens';
import { typography } from '@/lib/theme/typography';
import {
  addDays,
  formatCurrencyDisplay,
  formatWeekRangeLabel,
  getWeekDays,
  shortWeekdayLabel,
  startOfWeekForDate,
  toDateKey,
} from '@/lib/utils/date';
import type { WeekStart } from '@/types/domain';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const WEEKS = 52;
const CENTER = 26;

type Breakdown = { netCents: number; incomeCents: number; expenseCents: number };

type Props = {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  weekStartsOn: WeekStart;
  breakdownByDay: Record<string, Breakdown>;
  expenseActivity: Record<string, boolean>;
  currency: string;
  localeTag: string;
  /** Larger cells / type for expanded modal */
  expanded?: boolean;
  onExpandPress?: () => void;
};

export function WeekCalendar({
  selectedDate,
  onSelectDate,
  weekStartsOn,
  breakdownByDay,
  expenseActivity,
  currency,
  localeTag,
  expanded = false,
  onExpandPress,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const W = windowWidth;
  const { colors, radii, spacing } = useTheme();
  const listRef = useRef<FlatList<Date>>(null);

  const todayWeekStart = useMemo(
    () => startOfWeekForDate(new Date(), weekStartsOn),
    [weekStartsOn],
  );

  const weekStarts = useMemo(
    () =>
      Array.from({ length: WEEKS }, (_, i) => addDays(todayWeekStart, (i - CENTER) * 7)),
    [todayWeekStart],
  );

  const indexForDate = useCallback(
    (d: Date) => {
      const sel = startOfWeekForDate(d, weekStartsOn);
      const idx = weekStarts.findIndex((w) => toDateKey(w) === toDateKey(sel));
      return idx >= 0 ? idx : CENTER;
    },
    [weekStarts, weekStartsOn],
  );

  const [viewIndex, setViewIndex] = useState(() => indexForDate(selectedDate));
  const lastSyncedWeek = useRef<string | null>(null);

  useEffect(() => {
    const wk = toDateKey(startOfWeekForDate(selectedDate, weekStartsOn));
    if (lastSyncedWeek.current === wk) return;
    lastSyncedWeek.current = wk;
    const idx = indexForDate(selectedDate);
    setViewIndex(idx);
    listRef.current?.scrollToIndex({ index: idx, animated: true });
  }, [selectedDate, weekStartsOn, indexForDate]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const i = viewableItems[0]?.index;
      if (typeof i === 'number') setViewIndex(i);
    },
    [],
  );

  const viewConfig = useRef({ itemVisiblePercentThreshold: 55 }).current;

  const visibleWeekStart = weekStarts[viewIndex] ?? todayWeekStart;
  const visibleWeekEnd = addDays(visibleWeekStart, 6);
  const isCurrentWeek =
    toDateKey(visibleWeekStart) === toDateKey(todayWeekStart);

  const weekTitle = isCurrentWeek
    ? 'Current week'
    : formatWeekRangeLabel(visibleWeekStart, visibleWeekEnd, localeTag);

  const todayIdx = indexForDate(new Date());
  const needsTodayCta = viewIndex !== todayIdx;

  const goToToday = useCallback(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    onSelectDate(t);
    listRef.current?.scrollToIndex({ index: todayIdx, animated: true });
  }, [onSelectDate, todayIdx]);

  const gap = expanded ? spacing.sm : spacing.xs;
  const rowPad = expanded ? spacing.md : spacing.xs;

  const renderWeek = useCallback(
    ({ item: weekStart }: { item: Date }) => {
      const days = getWeekDays(weekStart, weekStartsOn);
      const selectedKey = toDateKey(selectedDate);

      return (
        <View style={{ width: W, paddingHorizontal: rowPad }}>
          <View style={[styles.dayRow, { gap }]}>
            {days.map((d) => {
              const key = toDateKey(d);
              const b = breakdownByDay[key];
              const net = b?.netCents ?? 0;
              const hasExp = expenseActivity[key] ?? false;
              const isSelected = key === selectedKey;
              return (
                <DayCell
                  key={key}
                  date={d}
                  selected={isSelected}
                  netCents={net}
                  hasExpenseMarker={hasExp}
                  currency={currency}
                  localeTag={localeTag}
                  onPress={() => onSelectDate(d)}
                  colors={colors}
                  radii={radii}
                  expanded={expanded}
                />
              );
            })}
          </View>
        </View>
      );
    },
    [
      W,
      rowPad,
      gap,
      selectedDate,
      onSelectDate,
      weekStartsOn,
      breakdownByDay,
      expenseActivity,
      currency,
      localeTag,
      colors,
      radii,
      expanded,
    ],
  );

  return (
    <View style={styles.outer}>
      <View style={[styles.weekNav, { paddingHorizontal: rowPad }]}>
        <Pressable
          accessibilityLabel="Previous week"
          onPress={() => {
            const next = Math.max(0, viewIndex - 1);
            listRef.current?.scrollToIndex({ index: next, animated: true });
          }}
          style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.6 : 1 }]}>
          <Text style={[typography.caption, { color: colors.accentPrimary }]}>‹</Text>
        </Pressable>
        <Text
          style={[
            typography.caption,
            {
              color: colors.textSecondary,
              textAlign: 'center',
              flex: 1,
              paddingHorizontal: spacing.sm,
            },
          ]}
          numberOfLines={1}>
          {weekTitle}
        </Text>
        <Pressable
          accessibilityLabel="Next week"
          onPress={() => {
            const next = Math.min(WEEKS - 1, viewIndex + 1);
            listRef.current?.scrollToIndex({ index: next, animated: true });
          }}
          style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.6 : 1 }]}>
          <Text style={[typography.caption, { color: colors.accentPrimary }]}>›</Text>
        </Pressable>
      </View>

      <View style={[styles.actionsRow, { paddingHorizontal: rowPad }]}>
        {needsTodayCta ? (
          <Pressable
            onPress={goToToday}
            style={({ pressed }) => [
              styles.smallChip,
              {
                borderColor: colors.border,
                backgroundColor: colors.backgroundElevated,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <Ionicons name="today-outline" size={14} color={colors.accentPrimary} />
            <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 6 }]}>
              Today
            </Text>
          </Pressable>
        ) : (
          <View />
        )}
        {onExpandPress ? (
          <Pressable
            onPress={onExpandPress}
            style={({ pressed }) => [
              styles.smallChip,
              {
                borderColor: colors.border,
                backgroundColor: colors.backgroundElevated,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <Ionicons name="expand-outline" size={14} color={colors.accentPrimary} />
            <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 6 }]}>
              Expand
            </Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      <FlatList
        ref={listRef}
        data={weekStarts}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => toDateKey(item)}
        getItemLayout={(_, index) => ({
          length: W,
          offset: W * index,
          index,
        })}
        initialScrollIndex={indexForDate(selectedDate)}
        renderItem={renderWeek}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfig}
        onScrollToIndexFailed={({ index }) => {
          listRef.current?.scrollToOffset({ offset: W * index, animated: true });
        }}
      />
    </View>
  );
}

function DayCell({
  date,
  selected,
  netCents,
  hasExpenseMarker,
  currency,
  localeTag,
  onPress,
  colors,
  radii,
  expanded,
}: {
  date: Date;
  selected: boolean;
  netCents: number;
  hasExpenseMarker: boolean;
  currency: string;
  localeTag: string;
  onPress: () => void;
  colors: Theme['colors'];
  radii: Theme['radii'];
  expanded: boolean;
}) {
  const scale = useSharedValue(selected ? 1.02 : 1);
  React.useEffect(() => {
    scale.value = withSpring(selected ? 1.02 : 1, { damping: 18, stiffness: 220 });
  }, [selected, scale]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const label = shortWeekdayLabel(date, localeTag);
  const dayNum = date.getDate();
  const absLabel = formatCurrencyDisplay(Math.abs(netCents), currency, localeTag);
  const netLine =
    netCents === 0 ? '—' : `${netCents > 0 ? '+' : '−'}${absLabel}`;

  const fs = expanded ? 12 : 10;
  const dayFs = expanded ? 18 : 16;
  const netFs = expanded ? 10 : 9;
  const py = expanded ? 12 : 8;

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[
        styles.cell,
        anim,
        {
          borderRadius: radii.md,
          borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
          borderColor: selected ? colors.accentPrimary : colors.border,
          backgroundColor: selected ? colors.surface : colors.backgroundElevated,
          flex: 1,
          minWidth: 0,
          paddingVertical: py,
          paddingHorizontal: 2,
        },
      ]}>
      <Text
        style={[typography.caption, { color: colors.textMuted, fontSize: fs }]}
        numberOfLines={1}>
        {label}
      </Text>
      <Text style={[typography.title, { fontSize: dayFs, marginTop: 2, textAlign: 'center' }]}>
        {dayNum}
      </Text>
      <View style={styles.cellFoot}>
        {hasExpenseMarker ? (
          <Ionicons name="wallet-outline" size={expanded ? 13 : 11} color={colors.expense} />
        ) : (
          <View style={{ width: expanded ? 13 : 11, height: expanded ? 13 : 11 }} />
        )}
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          style={[
            typography.caption,
            {
              color: colors.textSecondary,
              fontSize: netFs,
              marginTop: 2,
              textAlign: 'center',
            },
          ]}>
          {netLine}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  outer: { gap: 8 },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  smallChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  navBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  cellFoot: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    width: '100%',
  },
});
