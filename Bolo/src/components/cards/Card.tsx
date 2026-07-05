import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import { shadow } from '../../constants/shadows';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Draw an inset hairline border instead of a drop shadow. */
  outlined?: boolean;
  padded?: boolean;
}

/** Generic white rounded surface — the base for most list rows and tiles. */
export function Card({ children, style, outlined = false, padded = true }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        outlined
          ? { borderWidth: 1, borderColor: colors.border2 }
          : shadow(colors.ink, 0.16, 14, 8, 3),
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
  },
  padded: {
    padding: spacing.md,
  },
});
