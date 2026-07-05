import React from 'react';
import Svg, { Path, Rect, Circle, Line, G } from 'react-native-svg';

import { colors } from '../../constants/colors';

export type IconName =
  | 'mic'
  | 'chevronLeft'
  | 'lock'
  | 'plus'
  | 'check'
  | 'checkThin'
  | 'user'
  | 'userAlt'
  | 'journal'
  | 'room'
  | 'play'
  | 'speaker'
  | 'barChart';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Stroked / filled line-icons recreated 1:1 from the SVG paths used in the
 * original HTML. Keeping them as vector components means they stay crisp at
 * any size and inherit the exact geometry of the source design.
 */
export function Icon({
  name,
  size = 24,
  color = colors.ink,
  strokeWidth = 2.2,
}: IconProps) {
  const stroke = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  switch (name) {
    case 'mic':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x={9} y={3} width={6} height={11} rx={3} {...stroke} />
          <Path d="M6 11a6 6 0 0 0 12 0" {...stroke} />
          <Line x1={12} y1={17} x2={12} y2={21} {...stroke} />
        </Svg>
      );
    case 'chevronLeft':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M15 5l-7 7 7 7" {...stroke} strokeWidth={strokeWidth ?? 2.6} />
        </Svg>
      );
    case 'lock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x={5} y={11} width={14} height={9} rx={2.5} {...stroke} />
          <Path d="M8 11V8a4 4 0 0 1 8 0v3" {...stroke} />
        </Svg>
      );
    case 'plus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 5v14M5 12h14" {...stroke} />
        </Svg>
      );
    case 'check':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M5 13l4 4 10-11" {...stroke} strokeWidth={strokeWidth ?? 3} />
        </Svg>
      );
    case 'checkThin':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M20 6L9 17l-5-5" {...stroke} />
        </Svg>
      );
    case 'user':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={12} cy={8} r={4} {...stroke} />
          <Path d="M5 20v-1a7 7 0 0 1 14 0v1" {...stroke} />
        </Svg>
      );
    case 'userAlt':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M4 20v-1a6 6 0 0 1 12 0v1" {...stroke} />
          <Circle cx={10} cy={8} r={4} {...stroke} />
        </Svg>
      );
    case 'journal':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M6 4h11a1 1 0 0 1 1 1v15H8a2 2 0 0 1-2-2z" {...stroke} />
          <Line x1={10} y1={9} x2={14} y2={9} {...stroke} />
        </Svg>
      );
    case 'room':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M4 11l8-7 8 7" {...stroke} />
          <Path d="M6 10v9h12v-9" {...stroke} />
        </Svg>
      );
    case 'play':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M8 5v14l11-7z" fill={color} />
        </Svg>
      );
    case 'speaker':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M4 9v6h4l5 4V5L8 9z" fill={color} />
          <Path d="M16 8.5a4 4 0 0 1 0 7" {...stroke} strokeWidth={2} />
        </Svg>
      );
    case 'barChart':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <G>
            <Rect x={3} y={11} width={6} height={9} rx={1.5} {...stroke} />
            <Rect x={10} y={6} width={6} height={14} rx={1.5} {...stroke} />
            <Rect x={17} y={14} width={4} height={6} rx={1.5} {...stroke} opacity={0.5} />
          </G>
        </Svg>
      );
    default:
      return null;
  }
}
