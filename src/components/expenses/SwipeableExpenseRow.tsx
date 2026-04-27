import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Alert, Animated, StyleSheet, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { ExpenseRow } from '@/components/expenses/ExpenseRow';
import { useTheme } from '@/lib/theme/ThemeProvider';
import type { Category, Expense } from '@/types/domain';

type Props = {
  expense: Expense;
  category?: Category;
  localeTag: string;
  onPress: () => void;
  onDelete: () => void;
  onPinToggle: () => void;
};

export function SwipeableExpenseRow({
  expense,
  category,
  localeTag,
  onPress,
  onDelete,
  onPinToggle,
}: Props) {
  const { colors } = useTheme();
  const swipeRef = useRef<Swipeable>(null);

  const renderLeftActions = () => (
    <View style={[styles.side, styles.sideLeft]}>
      <View style={[styles.actionBtn, { backgroundColor: colors.danger }]}>
        <Ionicons name="trash-outline" size={22} color="#fff" />
      </View>
    </View>
  );

  const renderRightActions = () => (
    <View style={[styles.side, styles.sideRight]}>
      <View style={[styles.actionBtn, { backgroundColor: '#d4a017' }]}>
        <Ionicons name={expense.pinned ? 'pin' : 'pin-outline'} size={22} color="#0c0c0f" />
      </View>
    </View>
  );

  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      onSwipeableOpen={(direction) => {
        swipeRef.current?.close();
        if (direction === 'left') {
          Alert.alert('Delete transaction?', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: onDelete },
          ]);
        } else if (direction === 'right') {
          onPinToggle();
        }
      }}>
      <ExpenseRow expense={expense} category={category} localeTag={localeTag} onPress={onPress} />
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  side: {
    justifyContent: 'center',
    marginVertical: 4,
  },
  sideLeft: {
    paddingLeft: 8,
  },
  sideRight: {
    paddingRight: 8,
  },
  actionBtn: {
    width: 56,
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
