import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

import { lessons } from '../content';
import type { LessonContent } from '../content';
import { storage } from '../services/storage';

/**
 * Learner progress. Content (lessons/words) and progress (what this child
 * has done) are deliberately separate: content can grow to hundreds of
 * lessons or move to a CDN, and this store — keyed by stable ids — never
 * has to change shape.
 */

const STORAGE_KEY = 'bolo.progress.v1';

/**
 * Seed a lively demo state on first launch (two lessons mastered, a streak
 * in flight) so every screen shows real, dynamic data. Set to `false` to
 * start children from zero.
 */
const SEED_DEMO = true;

interface PersistedProgress {
  /** Word ids in the order they were first spoken. */
  learnedWordIds: string[];
  completedLessonIds: string[];
  /** Local `YYYY-MM-DD` keys of days with at least one practice. */
  practiceDays: string[];
}

interface ProgressState extends PersistedProgress {
  hydrated: boolean;
}

type Action =
  | { type: 'hydrate'; payload: PersistedProgress }
  | { type: 'learnWord'; wordId: string; day: string }
  | { type: 'completeLesson'; lessonId: string; day: string };

const EMPTY: PersistedProgress = {
  learnedWordIds: [],
  completedLessonIds: [],
  practiceDays: [],
};

function pushUnique(list: string[], item: string): string[] {
  return list.includes(item) ? list : [...list, item];
}

function reducer(state: ProgressState, action: Action): ProgressState {
  switch (action.type) {
    case 'hydrate':
      return { ...action.payload, hydrated: true };
    case 'learnWord':
      return {
        ...state,
        learnedWordIds: pushUnique(state.learnedWordIds, action.wordId),
        practiceDays: pushUnique(state.practiceDays, action.day),
      };
    case 'completeLesson':
      return {
        ...state,
        completedLessonIds: pushUnique(state.completedLessonIds, action.lessonId),
        practiceDays: pushUnique(state.practiceDays, action.day),
      };
    default:
      return state;
  }
}

/** Local calendar-day key, e.g. `2026-07-05`. */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Consecutive practice days ending today (or yesterday, as grace). */
function calcStreak(practiceDays: string[]): number {
  const days = new Set(practiceDays);
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function buildDemoSeed(): PersistedProgress {
  const practiceDays: string[] = [];
  for (let i = 6; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    practiceDays.push(dayKey(d));
  }
  const [greetings, colors, food] = lessons;
  return {
    learnedWordIds: [
      ...greetings.words.map((w) => w.id),
      ...colors.words.map((w) => w.id),
      food.words[0].id,
    ],
    completedLessonIds: [greetings.id, colors.id],
    practiceDays,
  };
}

export type LessonStatus = 'done' | 'active' | 'locked';

interface ProgressApi extends ProgressState {
  /** Total distinct words the child has said. */
  wordCount: number;
  /** Consecutive practice-day streak. */
  streak: number;
  /** The lesson the child is currently on (first uncompleted). */
  activeLesson: LessonContent;
  lessonStatus(lessonId: string): LessonStatus;
  /** How many of a lesson's words are already learned. */
  learnedInLesson(lessonId: string): number;
  /** Word index to resume a lesson at (first unlearned word). */
  resumeIndex(lessonId: string): number;
  isWordLearned(wordId: string): boolean;
  learnWord(wordId: string): void;
  completeLesson(lessonId: string): void;
}

const ProgressContext = createContext<ProgressApi | undefined>(undefined);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { ...EMPTY, hydrated: false });

  // Hydrate once from the persistence seam.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let payload: PersistedProgress | null = null;
      const raw = await storage.get(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<PersistedProgress>;
          payload = {
            learnedWordIds: parsed.learnedWordIds ?? [],
            completedLessonIds: parsed.completedLessonIds ?? [],
            practiceDays: parsed.practiceDays ?? [],
          };
        } catch {
          payload = null;
        }
      }
      if (!payload) payload = SEED_DEMO ? buildDemoSeed() : EMPTY;
      if (!cancelled) dispatch({ type: 'hydrate', payload });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist on every change after hydration.
  useEffect(() => {
    if (!state.hydrated) return;
    const { learnedWordIds, completedLessonIds, practiceDays } = state;
    void storage.set(STORAGE_KEY, JSON.stringify({ learnedWordIds, completedLessonIds, practiceDays }));
  }, [state]);

  const learnWord = useCallback((wordId: string) => {
    dispatch({ type: 'learnWord', wordId, day: dayKey(new Date()) });
  }, []);

  const completeLesson = useCallback((lessonId: string) => {
    dispatch({ type: 'completeLesson', lessonId, day: dayKey(new Date()) });
  }, []);

  const value = useMemo<ProgressApi>(() => {
    const learnedSet = new Set(state.learnedWordIds);
    const completedSet = new Set(state.completedLessonIds);
    const active = lessons.find((l) => !completedSet.has(l.id)) ?? lessons[lessons.length - 1];

    const learnedInLesson = (lessonId: string) => {
      const lesson = lessons.find((l) => l.id === lessonId);
      if (!lesson) return 0;
      return lesson.words.filter((w) => learnedSet.has(w.id)).length;
    };

    return {
      ...state,
      wordCount: state.learnedWordIds.length,
      streak: calcStreak(state.practiceDays),
      activeLesson: active,
      lessonStatus: (lessonId) => {
        if (completedSet.has(lessonId)) return 'done';
        return lessonId === active.id ? 'active' : 'locked';
      },
      learnedInLesson,
      resumeIndex: (lessonId) => {
        const lesson = lessons.find((l) => l.id === lessonId);
        if (!lesson) return 0;
        const idx = lesson.words.findIndex((w) => !learnedSet.has(w.id));
        return idx === -1 ? 0 : idx;
      },
      isWordLearned: (wordId) => learnedSet.has(wordId),
      learnWord,
      completeLesson,
    };
  }, [state, learnWord, completeLesson]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

/** Read + mutate learner progress from any screen. */
export function useProgress(): ProgressApi {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within a ProgressProvider');
  return ctx;
}
