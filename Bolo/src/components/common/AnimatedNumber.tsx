import { useEffect, useRef, useState } from 'react';
import React from 'react';
import { Animated, Easing, StyleProp, Text, TextStyle } from 'react-native';

/**
 * Tween a plain number toward `target` (eased), re-rendering as it moves.
 * Drives count-ups and progress fills that can't take an Animated value.
 */
export function useTween(target: number, duration = 900): number {
  const anim = useRef(new Animated.Value(0)).current;
  const [value, setValue] = useState(0);

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setValue(v));
    const run = Animated.timing(anim, {
      toValue: target,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    run.start();
    return () => {
      run.stop();
      anim.removeListener(id);
    };
  }, [anim, target, duration]);

  return value;
}

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
}

/** A Text that counts up to `value` when it mounts or changes. */
export function AnimatedNumber({ value, duration = 900, prefix = '', suffix = '', style }: AnimatedNumberProps) {
  const n = Math.round(useTween(value, duration));
  return (
    <Text style={style}>
      {prefix}
      {n}
      {suffix}
    </Text>
  );
}
