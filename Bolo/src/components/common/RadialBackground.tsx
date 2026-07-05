import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

interface Stops {
  offset: number; // 0..1
  color: string;
  opacity?: number;
}

interface RadialBackgroundProps {
  stops: Stops[];
  /** Gradient centre (0..1 of the box). */
  cx?: number;
  cy?: number;
  /** Radii as fraction of box (matches CSS "120% 80%" style sizing). */
  rx?: number;
  ry?: number;
}

/**
 * Full-bleed radial gradient wash — the exact background treatment used on
 * many screens (`radial-gradient(120% 80% at 50% 20%, ...)`). Rendered via SVG
 * because React Native's StyleSheet only supports linear gradients.
 */
export function RadialBackground({
  stops,
  cx = 0.5,
  cy = 0.2,
  rx = 1.1,
  ry = 0.9,
}: RadialBackgroundProps) {
  // Default gradientUnits (objectBoundingBox) maps the gradient onto the
  // filled Rect's box, so percentage coords reliably cover the full screen.
  const r = Math.max(rx, ry);
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <RadialGradient id="bg" cx={`${cx * 100}%`} cy={`${cy * 100}%`} r={`${r * 100}%`}>
          {stops.map((s, i) => (
            <Stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={s.opacity ?? 1} />
          ))}
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#bg)" />
    </Svg>
  );
}
