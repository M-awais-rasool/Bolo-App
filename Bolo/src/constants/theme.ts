import { colors, gradients } from './colors';
import { fonts, fontSizes } from './fonts';
import { radii, spacing, DESIGN } from './spacing';
import { shadow, shadows } from './shadows';

/** Single import surface for the whole design system. */
export const theme = {
  colors,
  gradients,
  fonts,
  fontSizes,
  spacing,
  radii,
  shadows,
  shadow,
  DESIGN,
} as const;

export type Theme = typeof theme;
