import { Dimensions, PixelRatio } from 'react-native';

import { DESIGN } from '../constants/spacing';

/**
 * The original screens are pixel-perfect inside a 320-wide artboard.
 * On a real device we want that same layout to scale up gracefully to fill
 * the viewport (iPhone SE → 15 Pro Max → tablets) without distorting.
 *
 * `scaleFactor` maps the 320pt artboard onto the available width, capped so
 * the phone-style UI never grows absurdly large on tablets.
 */
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Cap the effective design width so tablets show a comfortable phone canvas. */
const MAX_CANVAS_WIDTH = 480;

export const canvasWidth = Math.min(SCREEN_WIDTH, MAX_CANVAS_WIDTH);

/** Horizontal scale relative to the 320pt design artboard. */
export const scaleFactor = canvasWidth / DESIGN.width;

/** Scale a design-space value to the current device. */
export function s(value: number): number {
  return PixelRatio.roundToNearestPixel(value * scaleFactor);
}

/** Moderate scaling (used for type) — softens the effect for readability. */
export function ms(value: number, factor = 0.5): number {
  return PixelRatio.roundToNearestPixel(value + (s(value) - value) * factor);
}

export const screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: SCREEN_WIDTH <= 360, // iPhone SE class
  isTablet: SCREEN_WIDTH >= 768,
};
