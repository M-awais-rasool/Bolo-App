import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, gradients } from '../../constants/colors';
import { shadow } from '../../constants/shadows';
import { Icon } from '../common/Icon';

interface MicButtonProps {
  /** Diameter of the solid mic circle in dp. */
  size?: number;
  onPress?: () => void;
  /** Number of expanding pulse rings (1 or 2). */
  rings?: number;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
}

function PulseRing({ size, delay }: { size: number; delay: number }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: 2100,
        delay,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [t, delay]);

  const scale = t.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.82, 1.35, 1.5] });
  const opacity = t.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.55, 0.12, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
}

/**
 * The signature "hold & speak" microphone — a coral gradient disc sitting
 * inside one or two softly pulsing rings (`@keyframes pulse` in the source).
 */
export function MicButton({
  size = 82,
  onPress,
  rings = 1,
  iconSize,
  style,
}: MicButtonProps) {
  const glyph = iconSize ?? size * 0.42;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrap,
        { width: size, height: size },
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Speak"
    >
      <PulseRing size={size} delay={0} />
      {rings > 1 ? <PulseRing size={size} delay={1000} /> : null}
      <LinearGradient
        colors={gradients.coralMic}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[
          styles.disc,
          { width: size, height: size, borderRadius: size / 2 },
          shadow(colors.coralDeep, 0.6, 20, 8, 7),
        ]}
      >
        <View style={styles.topGlow} pointerEvents="none" />
        <Icon name="mic" size={glyph} color={colors.white} strokeWidth={2.2} />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    backgroundColor: colors.coral,
  },
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
});
