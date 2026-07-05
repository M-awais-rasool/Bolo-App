import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import { shadow } from '../../constants/shadows';

type Tail = 'bottom' | 'top' | 'none';

interface SpeechBubbleProps {
  children: React.ReactNode;
  tail?: Tail;
  /** Horizontal position of the tail (default centred). */
  tailLeft?: number | string;
  style?: StyleProp<ViewStyle>;
  radius?: number;
}

/**
 * White rounded speech bubble with an optional diamond tail — used for every
 * companion line. The tail is a 45°-rotated square, exactly as in the source.
 */
export function SpeechBubble({
  children,
  tail = 'none',
  tailLeft = '50%',
  style,
  radius = radii.xl,
}: SpeechBubbleProps) {
  return (
    <View style={[styles.bubble, { borderRadius: radius }, shadow(colors.ink, 0.28, 12, 6, 3), style]}>
      {children}
      {tail !== 'none' && (
        <View
          style={[
            styles.tail,
            tail === 'bottom' ? { bottom: -7 } : { top: -7 },
            typeof tailLeft === 'number'
              ? { left: tailLeft }
              : { left: '50%', marginLeft: -7 },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignSelf: 'flex-start',
  },
  tail: {
    position: 'absolute',
    width: 14,
    height: 14,
    backgroundColor: colors.white,
    transform: [{ rotate: '45deg' }],
  },
});
