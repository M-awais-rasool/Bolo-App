import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../constants/colors';

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

export function Screen({
  children,
  background,
  backgroundColor = colors.surface,
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
              paddingTop: insets.top - 20,
              paddingBottom: bottomInset ? insets.bottom : 0,
            },
            style,
          ]}
        >
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
