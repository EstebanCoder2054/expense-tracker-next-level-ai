import { LinearGradient } from 'expo-linear-gradient';
import React, { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/lib/theme/ThemeProvider';
import { typography } from '@/lib/theme/typography';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  style?: ViewStyle;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  leftIcon,
  style,
}: Props) {
  const { colors, radii } = useTheme();

  const fg =
    variant === 'primary' ? '#f8f9ff' : variant === 'secondary' ? colors.textPrimary : colors.textPrimary;
  const border = variant === 'ghost' ? colors.border : 'transparent';

  if (variant === 'primary') {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={disabled || loading}
        onPress={onPress}
        style={({ pressed }) => [
          styles.shadowPrimary,
          {
            borderRadius: radii.md,
            opacity: pressed ? 0.94 : 1,
          },
          (disabled || loading) && { opacity: 0.5 },
          style,
        ]}>
        <LinearGradient
          colors={[colors.accentPrimary, colors.accentPrimaryEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.base, { borderRadius: radii.md }]}>
          {loading ? (
            <ActivityIndicator color="#f8f9ff" />
          ) : (
            <>
              {leftIcon}
              <Text style={[typography.body, { color: fg, fontWeight: '600' }]}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  const bg = variant === 'secondary' ? colors.surface : 'transparent';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderRadius: radii.md,
          opacity: pressed ? 0.92 : 1,
          borderWidth: variant === 'ghost' ? StyleSheet.hairlineWidth : 0,
          borderColor: border,
        },
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={colors.textPrimary} />
      ) : (
        <>
          {leftIcon}
          <Text style={[typography.body, { color: fg, fontWeight: '600' }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    minHeight: 48,
  },
  shadowPrimary: {
    shadowColor: '#5D6BFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});
