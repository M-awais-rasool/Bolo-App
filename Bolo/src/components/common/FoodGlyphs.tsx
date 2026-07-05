import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';

/**
 * The diagonally-striped "photo placeholder" used behind lesson words —
 * a repeating 45° stripe recreated with an SVG pattern (RN has no
 * repeating-linear-gradient).
 */
export function StripedTile({
  height = 120,
  radius = 20,
  showLabel = true,
  children,
  style,
}: {
  height?: number;
  radius?: number;
  showLabel?: boolean;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.tile, { height, borderRadius: radius }, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <Pattern
            id="stripes"
            width={18}
            height={18}
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
          >
            <Rect width={18} height={18} fill="#F6EFE4" />
            <Rect width={9} height={18} fill="#F1E8DA" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#stripes)" />
      </Svg>
      {children}
      {showLabel && <Text style={styles.label}>IMAGE</Text>}
    </View>
  );
}

/** A simple two-lobed apple with stem + leaf (CSS art from the source). */
export function AppleGlyph({ size = 70 }: { size?: number }) {
  const w = size;
  const h = size * 0.94;
  const blobW = w * 0.6;
  const blobH = h * 0.85;
  return (
    <View style={{ width: w, height: h }}>
      <View
        style={{
          position: 'absolute',
          left: w * 0.03,
          top: h * 0.12,
          width: blobW,
          height: blobH,
          backgroundColor: '#E8607A',
          borderRadius: blobW / 2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: w * 0.03,
          top: h * 0.12,
          width: blobW,
          height: blobH,
          backgroundColor: '#EE7286',
          borderRadius: blobW / 2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: '48%',
          top: 0,
          width: 5,
          height: h * 0.23,
          backgroundColor: '#7B5233',
          borderRadius: 3,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: '52%',
          top: 3,
          width: 15,
          height: 10,
          backgroundColor: '#5FA97F',
          borderTopLeftRadius: 9,
          borderTopRightRadius: 2,
          borderBottomLeftRadius: 9,
          borderBottomRightRadius: 2,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    position: 'absolute',
    top: 10,
    right: 12,
    fontFamily: fonts.bodyExtraBold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: '#B2A48F',
  },
});
