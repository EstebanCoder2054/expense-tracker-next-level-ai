import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
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

const TRACK_PADDING_H = 6;
const BUBBLE_INSET_H = 5;
const BUBBLE_TIMING_MS = 220;
const BUBBLE_EASING = Easing.out(Easing.cubic);

function TabItem({
  routeName,
  isFocused,
  onPress,
  colors,
}: {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const label = TAB_LABELS[routeName] ?? routeName;
  const iconName = TAB_ICONS[routeName] ?? 'ellipse-outline';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      style={({ pressed }) => [styles.tabCell, { opacity: pressed ? 0.92 : 1 }]}>
      <View style={styles.iconSlot}>
        <Ionicons
          name={iconName}
          size={22}
          color={isFocused ? colors.accentPrimary : colors.textMuted}
        />
      </View>
      <View style={styles.labelSlot}>
        <Text
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
          style={[
            typography.tabLabel,
            {
              color: isFocused ? colors.textPrimary : colors.textMuted,
              textAlign: 'center',
              fontSize: 10,
              lineHeight: 12,
            },
          ]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, radii } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 12);

  const [trackW, setTrackW] = useState(0);
  const tabCount = state.routes.length;

  const bubbleX = useSharedValue(0);
  const bubbleW = useSharedValue(0);

  useEffect(() => {
    if (trackW <= 0 || tabCount === 0) return;
    const innerW = trackW - TRACK_PADDING_H * 2;
    const slotW = innerW / tabCount;
    const w = Math.max(0, slotW - BUBBLE_INSET_H * 2);
    const x = TRACK_PADDING_H + state.index * slotW + BUBBLE_INSET_H;
    bubbleW.value = w;
    bubbleX.value = withTiming(x, {
      duration: BUBBLE_TIMING_MS,
      easing: BUBBLE_EASING,
    });
  }, [state.index, trackW, tabCount, bubbleX, bubbleW]);

  const bubbleStyle = useAnimatedStyle(() => ({
    width: bubbleW.value,
    transform: [{ translateX: bubbleX.value }],
  }));

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
        <View
          style={styles.track}
          onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.bubble,
              {
                backgroundColor: 'rgba(93, 107, 255, 0.22)',
                borderRadius: radii.lg,
              },
              bubbleStyle,
            ]}
          />
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
  track: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 10,
    paddingHorizontal: TRACK_PADDING_H,
    minHeight: 56,
  },
  bubble: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    zIndex: 0,
  },
  tabCell: {
    flex: 1,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  iconSlot: {
    height: 28,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelSlot: {
    marginTop: 2,
    width: '100%',
    minHeight: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
});
