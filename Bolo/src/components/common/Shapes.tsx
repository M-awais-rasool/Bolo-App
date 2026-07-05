import React from 'react';
import Svg, { Polygon } from 'react-native-svg';

/**
 * The mock-ups lean on CSS `clip-path` polygons for sparkles, gem noses and
 * party hats. React Native has no clip-path, so we redraw the exact same
 * polygons with `react-native-svg`.
 */

interface ShapeProps {
  size?: number;
  color: string;
  /** Optional non-square height (defaults to `size`). */
  height?: number;
}

function toPoints(pairs: [number, number][], w: number, h: number): string {
  return pairs.map(([x, y]) => `${x * w},${y * h}`).join(' ');
}

/** Four-point twinkle / sparkle. */
export function Sparkle({ size = 14, color, height }: ShapeProps) {
  const w = size;
  const h = height ?? size;
  const pts = toPoints(
    [
      [0.5, 0],
      [0.61, 0.39],
      [1, 0.5],
      [0.61, 0.61],
      [0.5, 1],
      [0.39, 0.61],
      [0, 0.5],
      [0.39, 0.39],
    ],
    w,
    h,
  );
  return (
    <Svg width={w} height={h}>
      <Polygon points={pts} fill={color} />
    </Svg>
  );
}

/** Diamond / gem (used for Pip's beak). */
export function Diamond({ size = 16, color, height }: ShapeProps) {
  const w = size;
  const h = height ?? size;
  const pts = toPoints(
    [
      [0.5, 0],
      [1, 0.42],
      [0.5, 1],
      [0, 0.42],
    ],
    w,
    h,
  );
  return (
    <Svg width={w} height={h}>
      <Polygon points={pts} fill={color} />
    </Svg>
  );
}

/** Simple triangle (party hats, wardrobe items). */
export function Triangle({ size = 26, color, height }: ShapeProps) {
  const w = size;
  const h = height ?? size;
  const pts = toPoints(
    [
      [0.5, 0],
      [1, 1],
      [0, 1],
    ],
    w,
    h,
  );
  return (
    <Svg width={w} height={h}>
      <Polygon points={pts} fill={color} />
    </Svg>
  );
}
