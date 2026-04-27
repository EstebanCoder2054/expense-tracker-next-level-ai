import React, { type ReactNode } from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme/ThemeProvider';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Extra horizontal inset so content clears rounded device corners */
  padHorizontal?: number;
};

export function Screen({
  children,
  scroll,
  contentStyle,
  edges = ['top', 'left', 'right'],
  padHorizontal = 4,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const base = { flex: 1, backgroundColor: colors.background };
  const hPad = Math.max(insets.left, insets.right, 12) + padHorizontal;

  if (scroll) {
    return (
      <SafeAreaView style={base} edges={edges}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            {
              paddingBottom: 32,
              flexGrow: 1,
              paddingHorizontal: hPad,
            },
            contentStyle,
          ]}
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[base, { paddingHorizontal: hPad }, contentStyle]} edges={edges}>
      <View style={{ flex: 1 }}>{children}</View>
    </SafeAreaView>
  );
}
