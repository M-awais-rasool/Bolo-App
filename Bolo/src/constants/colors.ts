/**
 * Bolo color palette.
 * Extracted verbatim from the original HTML screen designs so the React Native
 * build stays visually identical to the source mock-ups.
 */

export const colors = {
  // ── Core ink / text ──────────────────────────────────────────────
  ink: '#3B2B45', // primary plum text
  inkDeep: '#4A3550',
  inkBrow: '#B57C63', // Mano's brow line
  textMuted: '#8A7A93',
  textMuted2: '#6E6076',
  textMuted3: '#5F5268',
  textFaint: '#9A8AA3',
  textFaint2: '#B4A8BE',
  textFaint3: '#C4B9CE',
  textFaint4: '#B9AEC2',

  // ── Purple (companion / secondary brand) ─────────────────────────
  purple: '#7C5FC7',
  purpleDeep: '#6A4FB0',
  purpleDeeper: '#6B4E9E',
  purpleLight: '#A98BE0',
  purpleLighter: '#B79CE8',
  purpleAccent: '#B79AE4',
  purpleTint: '#EDE4FB',
  purpleTint2: '#EFE6FB',
  purpleTint3: '#F3ECFC',
  purpleTint4: '#EDE6F2',
  purpleTintBorder: '#EDE1F2',

  // ── Coral / orange (primary CTA) ─────────────────────────────────
  coral: '#FF8F66',
  coralLight: '#FFB08E',
  coralDeep: '#FF8266',
  coralText: '#5A2E1E', // readable text on coral buttons
  coralGlow: '#FF9E7D',

  // ── Green (success / mastered) ───────────────────────────────────
  green: '#4FB58C',
  greenDeep: '#2F7A5C',
  greenMid: '#5EA986',
  greenTint: '#E4F4EC',

  // ── Yellow / gold (celebration, Pip) ─────────────────────────────
  gold: '#FFCF5C',
  goldDeep: '#FBC53A',

  // ── Surfaces ─────────────────────────────────────────────────────
  white: '#FFFFFF',
  surface: '#FFFDF8', // warm off-white card / screen base
  cream: '#F6EEDF',
  creamDeep: '#EBDFC9',

  // ── Neutral borders / hairlines ──────────────────────────────────
  border: '#EAE0D2',
  border2: '#EFE4D6',
  border3: '#F0E7DB',
  border4: '#F3EBDF',
  borderLocked: '#E4D8C6',
  textLocked: '#B6A891',
  textLocked2: '#C4B9A6',

  // ── Parent area (calmer, grown-up palette) ───────────────────────
  parentInk: '#33283C',
  parentPurple: '#5B4667',
  parentPurpleLight: '#6E5680',
  parentBg: '#F5F1EA',
  parentFrame: '#EFEAE1',
  parentCardTint: '#F3EEF7',
  parentGreenTint: '#EAF3EE',
  parentText: '#7A6E82',
  parentText2: '#6E6270',
  parentText3: '#8B7E96',
  parentBorder: '#DACFE0',
  parentBorder2: '#E7DFD3',
  parentInactive: '#B4A9BE',

  // ── Utility ──────────────────────────────────────────────────────
  black: '#1A1A1F',
  transparent: 'transparent',
} as const;

/** Reusable gradient stop pairs (top → bottom unless noted). */
export const gradients = {
  coralButton: ['#FFB08E', '#FF8F66'] as const,
  coralMic: ['#FFB08E', '#FF8266'] as const,
  purpleButton: ['#B79CE8', '#7C5FC7'] as const,
  purpleLogo: ['#A98BE0', '#7C5FC7'] as const, // 150deg in source
  purpleTile: ['#B79CE8', '#7C5FC7'] as const, // 160deg
  screenCream: ['#FBF4EC', '#FFFDF8'] as const,
} as const;

export type ColorName = keyof typeof colors;
