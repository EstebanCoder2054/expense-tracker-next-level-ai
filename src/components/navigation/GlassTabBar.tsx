import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme/ThemeProvider';
import { typography } from '@/lib/theme/typography';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  home: 'home-outline',
  expenses: 'list-outline',
  reports: 'bar-chart-outline',
  spaces: 'people-outline',
};

const TAB_LABELS: Record<string, string> = {
  home: 'Home',
  expenses: 'Expenses',
  reports: 'Reports',
  spaces: 'Spaces',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TabItem({
  routeName,
  isFocused,
  onPress,
  colors,
  radii,
}: {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  radii: ReturnType<typeof useTheme>['radii'];
}) {
  const label =
    TAB_LABELS[routeName] ?? routeName;
  const iconName = TAB_ICONS[routeName] ?? 'ellipse-outline';

  const scale = useSharedValue(isFocused ? 1 : 0.94);
  useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0.94, { damping: 16, stiffness: 220 });
  }, [isFocused, scale]);

  const iconAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tab,
        {
          opacity: pressed ? 0.88 : 1,
          backgroundColor: isFocused ? 'rgba(93, 107, 255, 0.14)' : 'transparent',
          borderRadius: radii.lg,
        },
      ]}>
      <Animated.View style={iconAnim}>
        <Ionicons
          name={iconName}
          size={22}
          color={isFocused ? colors.accentPrimary : colors.textMuted}
        />
      </Animated.View>
      <Text
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.82}
        style={[
          typography.tabLabel,
          {
            color: isFocused ? colors.textPrimary : colors.textMuted,
            marginTop: 4,
            textAlign: 'center',
            fontSize: 10,
            lineHeight: 12,
          },
        ]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, radii } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 12);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: bottom, paddingHorizontal: 12 }]}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 88 : 56}
        tint="dark"
        style={[
          styles.bar,
          {
            borderRadius: radii.xxl,
            borderColor: 'rgba(255, 255, 255, 0.08)',
            backgroundColor: Platform.OS === 'android' ? 'rgba(15, 20, 36, 0.72)' : undefined,
          },
        ]}>
        <View style={styles.inner}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <TabItem
                key={route.key}
                routeName={route.name}
                isFocused={isFocused}
                onPress={onPress}
                colors={colors}
                radii={radii}
              />
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
});
