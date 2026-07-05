import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

interface PopProps {
  children: React.ReactNode;
  /** Stagger start (ms) — pass `index * 60` for list entrances. */
  delay?: number;
  /** Distance the content rises from (dp). */
  dy?: number;
  /** Initial scale before the spring settles. */
  scaleFrom?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Springy mount transition (fade + rise + gentle overshoot) used to give
 * lists and cards a playful staggered entrance.
 */
export function Pop({ children, delay = 0, dy = 14, scaleFrom = 0.94, style }: PopProps) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.spring(t, {
      toValue: 1,
      delay,
      friction: 7,
      tension: 70,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [t, delay]);

  return (
    <Animated.View
      style={[
        {
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
          transform: [
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [dy, 0] }) },
            { scale: t.interpolate({ inputRange: [0, 1], outputRange: [scaleFrom, 1] }) },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
