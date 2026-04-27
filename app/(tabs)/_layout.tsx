import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassTabBar } from '@/components/navigation/GlassTabBar';
import { useTheme } from '@/lib/theme/ThemeProvider';

export default function TabLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
          tabBar={(props) => <GlassTabBar {...props} />}
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.accentPrimary,
            tabBarInactiveTintColor: colors.textMuted,
          }}>
          <Tabs.Screen
            name="home"
            options={{
              title: 'Home',
              tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="expenses"
            options={{
              title: 'Expenses',
              tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="reports"
            options={{
              title: 'Reports',
              tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="spaces"
            options={{
              title: 'Spaces',
              tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
            }}
          />
        </Tabs>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Capture"
          onPress={() => router.push('/modals/capture')}
          style={[
            styles.fabOuter,
            {
              bottom: Math.max(insets.bottom, 16) + 72,
            },
          ]}>
          <BlurView intensity={32} tint="dark" style={styles.fabBlur}>
            <LinearGradient
              colors={[`${colors.accentPrimary}e6`, `${colors.accentPrimaryEnd}dd`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabInner}>
              <View style={styles.fabRing}>
                <Ionicons name="add" size={28} color="#f8f9ff" />
              </View>
            </LinearGradient>
          </BlurView>
        </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fabOuter: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'visible',
    shadowColor: '#5D6BFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 14,
  },
  fabBlur: {
    flex: 1,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  fabInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabRing: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
