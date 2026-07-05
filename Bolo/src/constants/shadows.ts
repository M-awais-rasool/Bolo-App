import { Platform, ViewStyle } from 'react-native';

import { colors } from './colors';

/**
 * Cross-platform shadow helper.
 * iOS uses shadow* props; Android uses elevation. We keep both so cards feel
 * as soft/lifted as the CSS `box-shadow`s in the original design.
 */
export function shadow(
  color: string,
  opacity: number,
  radius: number,
  offsetY: number,
  elevation = Math.round(radius / 2),
): ViewStyle {
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: color,
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: { width: 0, height: offsetY },
    },
    android: { elevation },
    default: {
      shadowColor: color,
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: { width: 0, height: offsetY },
    },
  }) as ViewStyle;
}

/** A few frequently-reused shadow presets. */
export const shadows = {
  card: shadow(colors.ink, 0.12, 10, 6, 3),
  cardSoft: shadow(colors.ink, 0.18, 9, 5, 2),
  coralButton: shadow(colors.coral, 0.5, 18, 10, 6),
  purpleButton: shadow(colors.purple, 0.5, 16, 9, 6),
  mic: shadow(colors.coralDeep, 0.6, 18, 8, 6),
  bubble: shadow(colors.ink, 0.28, 12, 6, 3),
} as const;
