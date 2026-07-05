import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import { colors, gradients } from '../../constants/colors';
import { shadow } from '../../constants/shadows';

/** Google "G" — the four coloured segments, straight from the source SVG. */
export function GoogleLogo({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7C21.8 18.9 23 15.9 23 12.3z"
      />
      <Path
        fill="#34A853"
        d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3C3.7 21.4 7.5 24 12 24z"
      />
      <Path
        fill="#FBBC05"
        d="M5.6 14.7a7.2 7.2 0 0 1 0-4.6v-3H1.8a12 12 0 0 0 0 10.6l3.8-3z"
      />
      <Path
        fill="#EA4335"
        d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.2 15.1 0 12 0 7.5 0 3.7 2.6 1.8 6.4l3.8 3C6.5 6.7 9 4.8 12 4.8z"
      />
    </Svg>
  );
}

/** Apple mark. */
export function AppleLogo({ size = 20, color = colors.white }: { size?: number; color?: string }) {
  const h = (size / 20) * 24;
  return (
    <Svg width={size} height={h} viewBox="0 0 20 24">
      <Path
        fill={color}
        d="M16.4 12.6c0-2.7 2.2-4 2.3-4-1.2-1.8-3.1-2-3.8-2.1-1.6-.2-3.1 1-3.9 1-.8 0-2-1-3.3-.9-1.7 0-3.3 1-4.1 2.5-1.8 3-.5 7.5 1.2 9.9.8 1.2 1.8 2.5 3.1 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4a11 11 0 0 0 1.4-2.8c-.1 0-2.6-1-2.6-3.9z"
      />
      <Path
        fill={color}
        d="M13.9 4.4c.7-.8 1.1-2 1-3.2-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.5 2.9-1.3z"
      />
    </Svg>
  );
}

/**
 * The Bolo app mark — a purple gradient rounded square with a white
 * speech-bubble glyph (one squared-off corner, bottom-left).
 */
export function BoloMark({ size = 44 }: { size?: number }) {
  const radius = size * 0.34;
  const bubbleW = size * 0.455;
  const bubbleH = size * 0.36;
  return (
    <LinearGradient
      colors={gradients.purpleLogo}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
        shadow(colors.purple, 0.55, 20, 10, 8),
      ]}
    >
      <View
        style={{
          width: bubbleW,
          height: bubbleH,
          backgroundColor: colors.white,
          borderTopLeftRadius: bubbleH * 0.56,
          borderTopRightRadius: bubbleH * 0.56,
          borderBottomRightRadius: bubbleH * 0.56,
          borderBottomLeftRadius: bubbleH * 0.18,
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
