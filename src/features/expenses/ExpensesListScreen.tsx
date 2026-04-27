import { type Href, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SwipeableExpenseRow } from '@/components/expenses/SwipeableExpenseRow';
import { Screen } from '@/components/ui/Screen';
import {
  useAllExpenses,
  useCategories,
  useDeleteExpense,
  usePreferences,
  useSetExpensePinned,
} from '@/hooks/useExpenseQueries';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { typography } from '@/lib/theme/typography';
import type { Category, Expense } from '@/types/domain';

const TAB_BAR_FLOAT = 88;

type Section = { title: string; data: Expense[] };

export function ExpensesListScreen() {
  const router = useRouter();
  const { colors, spacing, radii } = useTheme();
  const insets = useSafeAreaInsets();
  const prefs = usePreferences();
  const exQ = useAllExpenses();
  const catQ = useCategories();
  const del = useDeleteExpense();
  const pin = useSetExpensePinned();
  const [q, setQ] = useState('');

  const localeTag = prefs.data?.localeTag ?? 'en-US';

  const categoryMap = useMemo(() => {
    const m = new Map<string, Category>();
    for (const c of catQ.data ?? []) m.set(c.id, c);
    return m;
  }, [catQ.data]);

  const sections = useMemo(() => {
    const list = exQ.data ?? [];
    const filtered = q.trim()
      ? list.filter((e) => {
          const note = e.note?.toLowerCase() ?? '';
          const cat = categoryMap.get(e.categoryId)?.name.toLowerCase() ?? '';
          return note.includes(q.toLowerCase()) || cat.includes(q.toLowerCase());
        })
      : list;

    const byDay = new Map<string, Expense[]>();
    for (const e of filtered) {
      const arr = byDay.get(e.occurredOn) ?? [];
      arr.push(e);
      byDay.set(e.occurredOn, arr);
    }
    const titles = [...byDay.keys()].sort((a, b) => (a < b ? 1 : -1));
    return titles.map((title) => {
      const data = [...(byDay.get(title) ?? [])].sort((a, b) => {
        if (a.pinned === b.pinned) return 0;
        return a.pinned ? -1 : 1;
      });
      return { title, data };
    });
  }, [exQ.data, q, categoryMap]);

  return (
    <Screen scroll={false} edges={['top', 'left', 'right']}>
      <Text style={[typography.hero, { fontSize: 26, marginBottom: spacing.md }]}>Expenses</Text>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search memo or category"
        placeholderTextColor={colors.textMuted}
        style={[
          styles.search,
          {
            color: colors.textPrimary,
            borderColor: colors.border,
            borderRadius: radii.md,
            backgroundColor: colors.surface,
            marginBottom: spacing.lg,
          },
        ]}
      />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 8, marginTop: 12 }]}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <View style={{ marginBottom: spacing.sm }}>
            <SwipeableExpenseRow
              expense={item}
              category={categoryMap.get(item.categoryId)}
              localeTag={localeTag}
              onPress={() => router.push(`/expense/${item.id}` as Href)}
              onDelete={() => void del.mutateAsync({ id: item.id, occurredOn: item.occurredOn })}
              onPinToggle={() =>
                void pin.mutateAsync({
                  id: item.id,
                  pinned: !item.pinned,
                  occurredOn: item.occurredOn,
                })
              }
            />
          </View>
        )}
        ListEmptyComponent={
          <Text style={[typography.bodyMuted, { textAlign: 'center', marginTop: 40 }]}>
            {exQ.isLoading ? 'Loading…' : 'No transactions yet.'}
          </Text>
        }
        contentContainerStyle={{ paddingBottom: TAB_BAR_FLOAT + insets.bottom }}
        style={{ flex: 1 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    ...typography.body,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
