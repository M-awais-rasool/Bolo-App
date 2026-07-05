import React from 'react';
import { Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';

import { colors } from '../../constants/colors';
import { radii } from '../../constants/spacing';
import { Icon, IconName } from '../common/Icon';

interface IconButtonProps {
  icon: IconName;
  onPress?: () => void;
  size?: number;
  iconSize?: number;
  iconColor?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * The small white rounded-square control seen in headers (back chevron,
 * parent lock, etc.) — white surface with a soft inset hairline.
 */
export function IconButton({
  icon,
  onPress,
  size = 34,
  iconSize = 16,
  iconColor = colors.textMuted,
  strokeWidth = 2,
  style,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: radii.sm },
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
    >
      <Icon name={icon} size={iconSize} color={iconColor} strokeWidth={strokeWidth} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border2,
  },
  pressed: {
    opacity: 0.7,
  },
});
