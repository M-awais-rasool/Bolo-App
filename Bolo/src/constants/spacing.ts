/** Spacing scale (dp). Mirrors the padding/margin rhythm in the source. */
export const spacing = {
  xs: 4,
  sm: 6,
  s: 8,
  md: 12,
  base: 14,
  lg: 16,
  xl: 18,
  xl2: 22,
  xl3: 26,
  xl4: 30,
  xl5: 34,
} as const;

/** Corner radii used throughout the design. */
export const radii = {
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xl2: 22,
  xl3: 24,
  xl4: 26,
  pill: 999,
  /** Outer phone-frame radius / large screen corners. */
  screen: 34,
} as const;

/**
 * The source mock-ups are drawn inside a fixed 320 × 690 device frame.
 * These constants let the mascots and a few pixel-tuned pieces keep their
 * exact proportions while everything else flexes responsively.
 */
export const DESIGN = {
  width: 320,
  height: 690,
} as const;
