import React from 'react';
import { Pressable, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';

import { colors } from '../../constants/colors';
import { fonts, fontSizes } from '../../constants/fonts';
import { radii } from '../../constants/spacing';

interface ChipProps {
  label: string;
  onPress?: () => void;
  /** Filled/active look (solid background). */
  active?: boolean;
  backgroundColor?: string;
  textColor?: string;
  /** Draw an inset hairline border (inactive filter look). */
  outlined?: boolean;
  fontSize?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Small pill used for filters, suggested-sentence tokens and status badges.
 * Defaults to the active purple look; pass colours for the many tinted variants.
 */
export function Chip({
  label,
  onPress,
  active = false,
  backgroundColor,
  textColor,
  outlined = false,
  fontSize = fontSizes.smd,
  style,
}: ChipProps) {
  const bg = backgroundColor ?? (active ? colors.purple : colors.white);
  const fg = textColor ?? (active ? colors.white : colors.textMuted);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.chip,
        { backgroundColor: bg },
        outlined && { borderWidth: 1, borderColor: colors.border2 },
        style,
      ]}
    >
      <Text style={[styles.label, { color: fg, fontSize }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: fonts.bodyExtraBold,
  },
});
