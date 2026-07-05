import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, gradients } from '../../constants/colors';
import { fonts, fontSizes } from '../../constants/fonts';
import { radii, spacing } from '../../constants/spacing';
import { shadow } from '../../constants/shadows';

type Variant = 'coral' | 'purple';

interface PrimaryButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  /** Optional leading glyph (e.g. a mic icon). */
  icon?: React.ReactNode;
  fontSize?: number;
  style?: StyleProp<ViewStyle>;
}

const VARIANTS: Record<Variant, { colors: readonly [string, string]; text: string; shadow: string }> = {
  coral: { colors: gradients.coralButton, text: colors.coralText, shadow: colors.coral },
  purple: { colors: gradients.purpleButton, text: colors.white, shadow: colors.purple },
};

/**
 * The chunky rounded CTA used across the app. A soft inner top-highlight and
 * coloured drop shadow reproduce the "candy" button look from the source.
 */
export function PrimaryButton({
  label,
  onPress,
  variant = 'coral',
  icon,
  fontSize = fontSizes.xl3,
  style,
}: PrimaryButtonProps) {
  const v = VARIANTS[variant];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <LinearGradient
        colors={v.colors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.button, shadow(v.shadow, 0.6, 20, 11, 7)]}
      >
        {/* inner top highlight */}
        <View style={styles.highlight} pointerEvents="none" />
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <Text style={[styles.label, { color: v.text, fontSize }]}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl2,
    borderRadius: radii.xl3,
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  icon: {
    marginRight: spacing.md,
  },
  label: {
    fontFamily: fonts.displaySemiBold,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});
