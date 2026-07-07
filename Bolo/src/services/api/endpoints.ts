import { Platform } from 'react-native';
import { request } from './client';
import type {
  AddChildResponse,
  AttemptResponse,
  CompanionSpecies,
  CompanionState,
  ContentOverlay,
  ListChildrenResponse,
  RegisterResponse,
  SessionSummary,
  StartSessionResponse,
  SyncAttemptItem,
  SyncResponse,
  TokenPair,
  WeeklyDigest,
} from './types';

// ── auth ────────────────────────────────────────────────────────────────

export function register(email: string, password: string, region: string): Promise<RegisterResponse> {
  return request('/auth/register', { body: { email, password, region }, anonymous: true });
}

export function login(email: string, password: string): Promise<TokenPair> {
  return request('/auth/login', { body: { email, password }, anonymous: true });
}

// ── children ────────────────────────────────────────────────────────────

export function addChild(name: string, dateOfBirth: string): Promise<AddChildResponse> {
  return request('/children', { body: { name, date_of_birth: dateOfBirth } });
}

export function listChildren(): Promise<ListChildrenResponse> {
  return request('/children');
}

export function confirmCategory(childId: string, categoryCode: string): Promise<void> {
  return request(`/children/${childId}/category`, {
    method: 'PATCH',
    body: { category_code: categoryCode },
  });
}

// ── companion ───────────────────────────────────────────────────────────

export function selectCompanion(childId: string, species: CompanionSpecies): Promise<{ companion_id: string; growth_stage: string }> {
  return request(`/children/${childId}/companion`, { body: { species } });
}

export function getCompanion(childId: string): Promise<CompanionState> {
  return request(`/children/${childId}/companion`);
}

// ── learning ────────────────────────────────────────────────────────────

export function startSession(childId: string, lessonId: string, clientKey: string): Promise<StartSessionResponse> {
  return request(`/children/${childId}/lessons/${lessonId}/sessions`, {
    body: { client_key: clientKey },
  });
}

export interface RecordedAudio {
  uri: string;
  durationMillis: number;
}

export async function recordAttempt(
  sessionId: string,
  wordId: string,
  clientKey: string,
  audio: RecordedAudio,
): Promise<AttemptResponse> {
  const form = new FormData();
  form.append('word_id', wordId);
  form.append('client_key', clientKey);
  if (Platform.OS === 'web') {
    const blob = await (await fetch(audio.uri)).blob();
    form.append('audio', blob, 'attempt.webm');
  } else {
    form.append('audio', {
      uri: audio.uri,
      name: 'attempt.m4a',
      type: 'audio/m4a',
    } as unknown as Blob);
  }
  return request(`/sessions/${sessionId}/attempts`, { form, timeoutMs: 30000 });
}

export function completeSession(sessionId: string): Promise<SessionSummary> {
  return request(`/sessions/${sessionId}/complete`, { method: 'POST' });
}

export function syncAttempts(attempts: SyncAttemptItem[]): Promise<SyncResponse> {
  return request('/sync/attempts', { body: { attempts }, timeoutMs: 60000 });
}

// ── content overlay ─────────────────────────────────────────────────────

export function getContentOverlay(childId: string): Promise<ContentOverlay> {
  return request(`/children/${childId}/content-overlay`);
}

// ── reporting ───────────────────────────────────────────────────────────

export function getWeeklyDigest(childId: string): Promise<WeeklyDigest> {
  return request(`/children/${childId}/digest/weekly`);
}
