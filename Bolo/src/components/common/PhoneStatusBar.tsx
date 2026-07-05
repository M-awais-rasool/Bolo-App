import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { colors } from '../../constants/colors';
import { fonts, fontSizes } from '../../constants/fonts';
import { spacing } from '../../constants/spacing';

interface PhoneStatusBarProps {
  /** Ink colour for the time + signal/battery glyphs. */
  color?: string;
  style?: StyleProp<ViewStyle>;
  time?: string;
}

/**
 * The faux iOS status row ("9:41" + signal + battery) baked into every
 * artboard. Recreated from the source inline SVGs so it tints cleanly on
 * both light and dark screens.
 */
export function PhoneStatusBar({
  color = colors.ink,
  style,
  time = '9:41',
}: PhoneStatusBarProps) {
  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.time, { color }]}>{time}</Text>
      <View style={styles.right}>
        {/* signal bars */}
        <Svg width={17} height={11} viewBox="0 0 17 11">
          <Rect x={0} y={6} width={3} height={5} rx={1} fill={color} />
          <Rect x={4.5} y={4} width={3} height={7} rx={1} fill={color} />
          <Rect x={9} y={2} width={3} height={9} rx={1} fill={color} />
          <Rect x={13.5} y={0} width={3} height={11} rx={1} fill={color} />
        </Svg>
        {/* battery */}
        <Svg width={24} height={12} viewBox="0 0 24 12">
          <Rect x={1} y={1} width={19} height={10} rx={3} stroke={color} fill="none" />
          <Rect x={3} y={3} width={13} height={6} rx={1.5} fill={color} />
          <Rect x={21.5} y={4} width={2} height={4} rx={1} fill={color} />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.md,
  },
  time: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: fontSizes.base,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
});
