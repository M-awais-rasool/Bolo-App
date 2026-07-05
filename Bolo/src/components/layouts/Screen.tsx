import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../constants/colors';
import { PhoneStatusBar } from '../common/PhoneStatusBar';

interface ScreenProps {
  children: React.ReactNode;
  /** Absolutely-filled background layer(s) (gradient / radial wash). */
  background?: React.ReactNode;
  /** Solid background fallback. */
  backgroundColor?: string;
  /** Tint of the faux status bar glyphs. */
  statusBarColor?: string;
  showStatusBar?: boolean;
  /** Apply the bottom safe-area inset (disable when a tab bar owns it). */
  bottomInset?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * The device canvas every screen sits inside.
 *
 * - Fills the phone edge-to-edge; on tablets it caps at a comfortable phone
 *   width and floats on the warm cream backdrop (mirrors the HTML, where the
 *   320px device floats on a cream body).
 * - Handles safe-area insets and renders the faux status bar at the top.
 */
export function Screen({
  children,
  background,
  backgroundColor = colors.surface,
  statusBarColor,
  showStatusBar = true,
  bottomInset = true,
  style,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.outer}>
      <View style={[styles.device, { backgroundColor }]}>
        {background}
        <View
          style={[
            styles.content,
            {
              paddingTop: insets.top,
              paddingBottom: bottomInset ? insets.bottom : 0,
            },
            style,
          ]}
        >
          {showStatusBar && <PhoneStatusBar color={statusBarColor} />}
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.creamDeep,
    alignItems: 'center',
  },
  device: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
});
