import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { typography } from '@/lib/theme/typography';

const SLIDES = [
  {
    icon: 'flash-outline' as const,
    title: 'Track in seconds',
    body: 'Log expenses the moment they happen — tuned for speed, not busywork.',
  },
  {
    icon: 'sparkles-outline' as const,
    title: 'AI that assists',
    body: 'Natural memos, smart categories, and imports you confirm — never blind trust.',
  },
  {
    icon: 'people-outline' as const,
    title: 'Share & split',
    body: 'Spaces for trips, roommates, and couples with fair balances when you need them.',
  },
  {
    icon: 'phone-portrait-outline' as const,
    title: 'Offline-first',
    body: 'Your data lives on-device with SQLite. Cloud sync layers on when you sign in.',
  },
] as const;

export function OnboardingSlidesScreen() {
  const router = useRouter();
  const { width: pageWidth } = useWindowDimensions();
  const { colors, spacing } = useTheme();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<(typeof SLIDES)[number]>>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / pageWidth);
    if (i !== index && i >= 0 && i < SLIDES.length) setIndex(i);
  };

  const renderItem: ListRenderItem<(typeof SLIDES)[number]> = ({ item, index: i }) => (
    <View style={{ width: pageWidth, paddingHorizontal: spacing.lg, justifyContent: 'center' }}>
      <Animated.View entering={FadeInDown.duration(420).delay(i * 40)}>
        <Animated.View entering={FadeIn.duration(500).delay(80)} style={styles.iconWrap}>
          <Ionicons name={item.icon} size={52} color={colors.accentPrimary} />
        </Animated.View>
        <Text style={[typography.hero, { fontSize: 26, marginTop: spacing.xl }]}>{item.title}</Text>
        <Text style={[typography.bodyMuted, { marginTop: spacing.lg, lineHeight: 22 }]}>{item.body}</Text>
      </Animated.View>
    </View>
  );

  const last = index === SLIDES.length - 1;

  return (
    <Screen scroll={false} edges={['top', 'bottom']}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <FlatList
          ref={listRef}
          data={[...SLIDES]}
          renderItem={renderItem}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          bounces={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          snapToInterval={pageWidth}
          decelerationRate="fast"
          getItemLayout={(_, idx) => ({
            length: pageWidth,
            offset: pageWidth * idx,
            index: idx,
          })}
          onScrollToIndexFailed={(info) => {
            listRef.current?.scrollToOffset({
              offset: info.averageItemLength * info.index,
              animated: true,
            });
          }}
        />
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === index ? colors.accentPrimary : colors.border,
                  width: i === index ? 22 : 6,
                },
              ]}
            />
          ))}
        </View>
      </View>
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}>
        <Button
          title={last ? 'Continue' : 'Next'}
          onPress={() => {
            if (last) {
              router.push('/(onboarding)/entry');
              return;
            }
            listRef.current?.scrollToIndex({ index: index + 1, animated: true });
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignSelf: 'flex-start',
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(93, 107, 255, 0.12)',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
