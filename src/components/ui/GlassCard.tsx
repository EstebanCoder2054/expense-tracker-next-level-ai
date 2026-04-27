import React, { type ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

import { useTheme } from '@/lib/theme/ThemeProvider';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  /** Override inner padding (default 16). */
  contentPadding?: number;
};

/** Blur-backed surface; falls back to translucent fill on web where blur is limited. */
export function GlassCard({ children, style, contentPadding = 16 }: Props) {
  const { colors, radii } = useTheme();

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.wrap,
          { borderRadius: radii.lg, backgroundColor: colors.glass, padding: contentPadding },
          style,
        ]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { borderRadius: radii.lg, overflow: 'hidden' }, style]}>
      <BlurView intensity={48} tint="dark" style={StyleSheet.absoluteFill} />
      <View
        style={[styles.inner, { borderColor: colors.borderSubtle, padding: contentPadding }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    backgroundColor: 'rgba(12, 12, 15, 0.35)',
  },
});
