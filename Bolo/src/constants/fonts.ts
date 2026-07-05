/**
 * Typography tokens.
 *
 * The source design pairs two Google fonts:
 *  - Fredoka  → display / headings / buttons (rounded, friendly)
 *  - Nunito   → body / labels (high weights for a chunky, playful feel)
 *
 * The string values match the font family names registered by the
 * `@expo-google-fonts/*` packages (see `useAppFonts`).
 */

export const fonts = {
  // Fredoka — display
  displayRegular: 'Fredoka_400Regular',
  displayMedium: 'Fredoka_500Medium',
  displaySemiBold: 'Fredoka_600SemiBold',
  displayBold: 'Fredoka_700Bold',

  // Nunito — body
  bodyRegular: 'Nunito_400Regular',
  bodySemiBold: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  bodyExtraBold: 'Nunito_800ExtraBold',
  bodyBlack: 'Nunito_900Black',
} as const;

/** Font size scale used across the screens. */
export const fontSizes = {
  xs: 10,
  sm: 11,
  smd: 12,
  base: 13,
  md: 14,
  lg: 15,
  lgx: 16,
  xl: 18,
  xl2: 19,
  xl3: 20,
  xl4: 22,
  xl5: 24,
  xl6: 26,
  xl7: 30,
  xl8: 34,
  xl9: 40,
  huge: 58,
} as const;

export type FontName = keyof typeof fonts;
