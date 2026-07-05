import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

import { colors } from '../../constants/colors';

const BARS = [
  { color: '#C9B7EC', delay: 0 },
  { color: colors.purpleLight, delay: 150 },
  { color: colors.purple, delay: 300 },
  { color: colors.purpleLight, delay: 450 },
  { color: '#C9B7EC', delay: 600 },
];

function Bar({ color, delay, height }: { color: string; delay: number; height: number }) {
  const t = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
        Animated.timing(t, { toValue: 0.35, duration: 500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, delay]);

  return (
    <Animated.View
      style={[
        styles.bar,
        { height, backgroundColor: color, transform: [{ scaleY: t }] },
      ]}
    />
  );
}

/** Five bouncing bars — the `@keyframes wave` "I'm listening" indicator. */
export function SoundWave({ height = 20, style }: { height?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.row, style]}>
      {BARS.map((b, i) => (
        <Bar key={i} color={b.color} delay={b.delay} height={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 26,
  },
  bar: {
    width: 4,
    borderRadius: 3,
  },
});
