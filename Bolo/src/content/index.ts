/**
 * Content source seam.
 *
 * The bundled pack renders instantly and works offline forever; newer packs
 * come from the packs CDN as immutable JSON keyed by `revision` and are
 * cached locally — see `remote.ts` for the boot order. Screens never import
 * lesson data from anywhere else.
 */
import { CONTENT_PACK, LESSON_THEMES } from './lessons';
import type { ContentPack, LessonContent, LessonTheme, WordContent } from './types';

export type { ContentPack, LessonContent, LessonTheme, SoundContent, WordContent } from './types';
export { LESSON_THEMES } from './lessons';
export { COMPANION_NAMES, MILESTONES, stageFor } from './progression';
export type { Milestone, StageInfo } from './progression';

let activePack: ContentPack = CONTENT_PACK;

/**
 * Lessons in journey order. Mutated in place when a newer pack applies, so
 * every existing import stays live.
 */
export const lessons: LessonContent[] = [...CONTENT_PACK.lessons];

let lessonById = new Map<string, LessonContent>();
let wordById = new Map<string, { word: WordContent; lesson: LessonContent }>();

function reindex(): void {
  lessonById = new Map(lessons.map((l) => [l.id, l]));
  wordById = new Map(
    lessons.flatMap((l) => l.words.map((w) => [w.id, { word: w, lesson: l }] as const)),
  );
}
reindex();

/** The active pack. */
export function getContentPack(): ContentPack {
  return activePack;
}

/**
 * Swap in a newer pack (from the local cache or the packs CDN). Progress is
 * keyed by stable ids that are never reused, so a content update can't
 * corrupt anything the child has already earned.
 */
export function applyContentPack(pack: ContentPack): void {
  activePack = pack;
  lessons.length = 0;
  lessons.push(...pack.lessons);
  reindex();
}

export function getLesson(id: string): LessonContent {
  const lesson = lessonById.get(id);
  return lesson ?? lessons[0];
}

/** Look up a word (with its lesson) by global word id. */
export function findWord(wordId: string): { word: WordContent; lesson: LessonContent } | undefined {
  return wordById.get(wordId);
}

export function themeOf(lesson: LessonContent): LessonTheme {
  return LESSON_THEMES[lesson.theme];
}

/** Index of the word after which the lesson's sound drill plays. */
export function soundStepIndex(lesson: LessonContent): number {
  return Math.floor(lesson.words.length / 2);
}
