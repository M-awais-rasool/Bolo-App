import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../../constants/colors';

interface ProgressBarProps {
  /** 0..1 fill fraction. */
  progress: number;
  height?: number;
  trackColor?: string;
  /** Solid fill colour (ignored if `gradient` given). */
  fillColor?: string;
  gradient?: readonly [string, string];
  style?: StyleProp<ViewStyle>;
  borderColor?: string;
}

/** Rounded track + fill bar (streaks, milestones, growth stages). */
export function ProgressBar({
  progress,
  height = 12,
  trackColor = colors.white,
  fillColor = colors.purple,
  gradient,
  style,
  borderColor,
}: ProgressBarProps) {
  const pct = `${Math.max(0, Math.min(1, progress)) * 100}%` as const;
  const radius = height / 2;

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: radius,
          backgroundColor: trackColor,
          borderWidth: borderColor ? 1 : 0,
          borderColor,
        },
        style,
      ]}
    >
      {gradient ? (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ width: pct, height: '100%', borderRadius: radius }}
        />
      ) : (
        <View style={{ width: pct, height: '100%', backgroundColor: fillColor, borderRadius: radius }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
});
