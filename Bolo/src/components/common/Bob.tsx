import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';

interface BobProps {
  children: React.ReactNode;
  /** Vertical travel in dp (default 7, matching the source keyframes). */
  distance?: number;
  /** Full cycle duration in ms. */
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Gentle up/down float — the `@keyframes bob` used on every companion in the
 * source. Purely decorative; respects the original 3.6s-ish rhythm.
 */
export function Bob({ children, distance = 7, duration = 3600, style }: BobProps) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, duration]);

  const translateY = t.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -distance],
  });

  return <Animated.View style={[style, { transform: [{ translateY }] }]}>{children}</Animated.View>;
}
