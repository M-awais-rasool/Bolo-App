/**
 * Wire types for the Bolo API (server/internal/*). Field names mirror the
 * backend JSON exactly; the client switches on stable `code` strings from the
 * shared error contract, never on message text.
 */
import type { LessonContent } from '../../content/types';

// ── error contract (server/internal/platform/httpx) ────────────────────

export class ApiError extends Error {
  constructor(
    /** HTTP status; 0 means the request never reached the server. */
    readonly status: number,
    /** Stable snake_case code, e.g. `invalid_credentials`, `network_error`. */
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isApiError(e: unknown, code?: string): e is ApiError {
  return e instanceof ApiError && (code === undefined || e.code === code);
}

/** True when the failure is connectivity, not a server verdict. */
export function isOffline(e: unknown): boolean {
  return e instanceof ApiError && e.status === 0;
}

// ── auth ────────────────────────────────────────────────────────────────

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export interface RegisterResponse extends TokenPair {
  parent_id: string;
}

// ── children ────────────────────────────────────────────────────────────

export interface AddChildResponse {
  child_id: string;
  suggested_category: string;
  next_step: string;
}

export interface ChildSummary {
  child_id: string;
  name: string;
  date_of_birth: string;
  category_code: string;
  category_confirmed: boolean;
}

export interface ListChildrenResponse {
  children: ChildSummary[];
}

// ── companion ───────────────────────────────────────────────────────────

export type CompanionSpecies = 'mano' | 'pip' | 'zizi';

export interface CompanionState {
  companion_id: string;
  species: CompanionSpecies;
  /** Server-named stage, e.g. `egg`, `hatchling`, … */
  growth_stage: string;
  words_mastered_count: number;
}

// ── learning ────────────────────────────────────────────────────────────

export interface StartSessionResponse {
  session_id: string;
  lesson_id: string;
}

/** Fixed enum from server/internal/speech — each maps to reviewed praise copy. */
export type FeedbackCode = 'excellent' | 'good' | 'almost_there' | 'listen_and_retry';

export interface AttemptResponse {
  word_id: string;
  score: number;
  feedback_code: FeedbackCode;
}

export interface SessionSummary {
  lesson_mastered: boolean;
  words_mastered_delta: number;
  next_lesson_unlocked: string | null;
  companion_growth_triggered: boolean;
}

export interface SyncAttemptItem {
  client_key: string;
  session_id: string;
  word_id: string;
  recorded_at: string;
  audio_base64: string;
}

export interface SyncResponse {
  synced: number;
  duplicates: number;
  conflicts: number;
  results: Array<{
    client_key: string;
    status: 'synced' | 'duplicate' | 'conflict';
    error_code?: string;
    score?: number;
    feedback_code?: FeedbackCode;
  }>;
}

// ── content overlay ─────────────────────────────────────────────────────

export interface ContentOverlay {
  base_pack: { category_code: string; revision: number };
  unlocked_lesson_ids: string[] | null;
  extra_lessons: LessonContent[] | null;
}

// ── reporting ───────────────────────────────────────────────────────────

export interface WeeklyDigest {
  words_mastered_this_week: number;
  streak_days: number;
  weak_phonemes: string[] | null;
  sample_clips: string[] | null;
  suggested_home_practice: string;
}
