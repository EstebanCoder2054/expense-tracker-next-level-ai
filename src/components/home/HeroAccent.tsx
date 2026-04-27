import React from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import { Canvas, Fill, LinearGradient, vec } from '@shopify/react-native-skia';

const W = Dimensions.get('window').width;

/** Blue → violet hero wash (reference gradient). */
export function HeroAccent() {
  if (Platform.OS === 'web') {
    return <View style={styles.fallback} />;
  }

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Canvas style={{ width: W, height: 140 }}>
        <Fill>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(W, 140)}
            colors={[
              'rgba(93, 107, 255, 0.45)',
              'rgba(130, 96, 255, 0.22)',
              'rgba(8, 12, 24, 0)',
            ]}
            positions={[0, 0.42, 1]}
          />
        </Fill>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    height: 120,
    backgroundColor: 'rgba(93, 107, 255, 0.1)',
  },
});
