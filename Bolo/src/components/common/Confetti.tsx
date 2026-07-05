import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { colors } from '../../constants/colors';

const PALETTE = [colors.coral, colors.purple, colors.green, colors.gold, '#E8607A', colors.purpleLight];

interface Piece {
  /** Horizontal start position as a fraction of the container width. */
  x: number;
  delay: number;
  duration: number;
  w: number;
  h: number;
  color: string;
  spinTo: string;
  sway: number;
  round: boolean;
}

function buildPieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => {
    const round = Math.random() < 0.3;
    const size = 7 + Math.random() * 6;
    return {
      x: (i + Math.random()) / count,
      delay: Math.random() * 700,
      duration: 2000 + Math.random() * 1400,
      w: size,
      h: round ? size : size * (1.4 + Math.random() * 0.8),
      color: PALETTE[i % PALETTE.length],
      spinTo: `${(Math.random() < 0.5 ? -1 : 1) * (240 + Math.random() * 420)}deg`,
      sway: 14 + Math.random() * 26,
      round,
    };
  });
}

function ConfettiPiece({ piece, height }: { piece: Piece; height: number }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(t, {
      toValue: 1,
      duration: piece.duration,
      delay: piece.delay,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [t, piece]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: `${piece.x * 100}%`,
        top: 0,
        width: piece.w,
        height: piece.h,
        borderRadius: piece.round ? piece.w / 2 : 2.5,
        backgroundColor: piece.color,
        opacity: t.interpolate({ inputRange: [0, 0.05, 0.8, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-30, height] }) },
          {
            translateX: t.interpolate({
              inputRange: [0, 0.25, 0.5, 0.75, 1],
              outputRange: [0, piece.sway, -piece.sway * 0.6, piece.sway * 0.8, -piece.sway * 0.3],
            }),
          },
          { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', piece.spinTo] }) },
        ],
      }}
    />
  );
}

/**
 * A one-shot celebration burst: paper pieces flutter down with sway and
 * spin, then fade. Renders above content and ignores touches.
 */
export function Confetti({ count = 16, height = 480 }: { count?: number; height?: number }) {
  const [pieces] = useState(() => buildPieces(count));
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} piece={p} height={height} />
      ))}
    </View>
  );
}
