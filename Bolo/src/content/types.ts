/**
 * Content model for Bolo lessons.
 *
 * Lessons are pure data — screens render whatever pack they're given, so
 * shipping new lessons (or serving them from a CDN/API for millions of
 * users) never requires touching UI code. See `content/index.ts` for the
 * content-source seam.
 */

/** Visual theme key — resolves to palette values via `LESSON_THEMES`. */
export type LessonThemeKey = 'green' | 'purple' | 'coral' | 'gold' | 'pink' | 'blue';

export interface LessonTheme {
  /** Main accent (map nodes, chips). */
  accent: string;
  /** Darker accent readable as text. */
  deep: string;
  /** Soft tint for tiles and badges. */
  tint: string;
}

export interface WordContent {
  /** Globally unique — namespaced by lesson, e.g. `food.apple`. */
  id: string;
  label: string;
  /** Emoji artwork keeps 80+ words lightweight; swap for images later. */
  emoji: string;
  /** Three sentence-builder chips for the micro-conversation step. */
  chips: readonly [string, string, string];
}

export interface SoundContent {
  /** The phoneme shown on the big tile, e.g. `th`. */
  letters: string;
  /** Example word containing `letters` (highlighted in the UI). */
  asIn: string;
  /** Coaching line, split so the key phrase renders bold. */
  tip: { pre: string; bold: string; post: string };
}

export interface LessonContent {
  id: string;
  title: string;
  emoji: string;
  theme: LessonThemeKey;
  /** Companion speech-bubble line on the hub. */
  intro: string;
  /** Question the companion asks in the micro-conversation step. */
  prompt: string;
  words: WordContent[];
  /** Optional pronunciation drill, played once mid-lesson. */
  sound?: SoundContent;
}

export interface ContentPack {
  /** Bump on breaking shape changes so cached packs can be migrated. */
  schemaVersion: 1;
  /** Monotonic content revision — remote sources serve newer revisions. */
  revision: number;
  lessons: LessonContent[];
}
