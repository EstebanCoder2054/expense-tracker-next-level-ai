import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme/ThemeProvider';
import { typography } from '@/lib/theme/typography';
import { formatCurrencyDisplay } from '@/lib/utils/date';
import type { Category, Expense } from '@/types/domain';

type Props = {
  expense: Expense;
  category?: Category;
  localeTag: string;
  onPress?: () => void;
};

export function ExpenseRow({ expense, category, localeTag, onPress }: Props) {
  const { colors, radii } = useTheme();
  const isIncome = expense.kind === 'income';
  const amount = formatCurrencyDisplay(expense.amountCents, expense.currency, localeTag);
  const displayAmount = `${isIncome ? '+' : '−'}${amount}`;
  const amountColor = isIncome ? colors.accentPrimary : colors.expense;

  const iconName = (category?.icon ?? 'pricetag-outline') as keyof typeof Ionicons.glyphMap;

  const inner = (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.backgroundElevated,
          borderRadius: radii.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: expense.pinned ? colors.accentPrimary : colors.borderSubtle,
        },
      ]}>
      <View style={[styles.iconBubble, { backgroundColor: `${category?.color ?? colors.textMuted}33` }]}>
        <Ionicons name={iconName} size={18} color={category?.color ?? colors.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { fontWeight: '600' }]} numberOfLines={1}>
          {category?.name ?? 'Uncategorized'}
        </Text>
        {expense.note ? (
          <Text style={[typography.bodyMuted, { marginTop: 2 }]} numberOfLines={1}>
            {expense.note}
          </Text>
        ) : null}
      </View>
      <Text style={[typography.subtitle, { color: amountColor, fontWeight: '700' }]}>{displayAmount}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {inner}
      </Pressable>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
