import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../../config/env';
import { storage } from '../storage';
import { ApiError, type TokenPair } from './types';

const TOKENS_KEY = 'bolo.tokens.v1';

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

let tokens: Tokens | null = null;
let refreshInFlight: Promise<boolean> | null = null;

/** Fired when a refresh fails and the stored session is no longer usable. */
type SessionLostListener = () => void;
let onSessionLost: SessionLostListener | null = null;

export function setSessionLostListener(fn: SessionLostListener | null): void {
  onSessionLost = fn;
}

export async function loadTokens(): Promise<boolean> {
  const raw = await storage.get(TOKENS_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as Partial<Tokens>;
    if (typeof parsed.accessToken === 'string' && typeof parsed.refreshToken === 'string') {
      tokens = { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken };
      return true;
    }
  } catch {
    // Corrupt store — treat as signed out.
  }
  return false;
}

export async function saveTokens(pair: TokenPair): Promise<void> {
  tokens = { accessToken: pair.access_token, refreshToken: pair.refresh_token };
  await storage.set(TOKENS_KEY, JSON.stringify(tokens));
}

export async function clearTokens(): Promise<void> {
  tokens = null;
  await storage.remove(TOKENS_KEY);
}

export function hasTokens(): boolean {
  return tokens !== null;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** JSON body — mutually exclusive with `form`. */
  body?: unknown;
  /** Multipart body (audio uploads). */
  form?: FormData;
  /** Skip the Authorization header (auth endpoints). */
  anonymous?: boolean;
  timeoutMs?: number;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const result = await rawRequest(path, opts);
  if (result.status !== 401 || opts.anonymous || !tokens) {
    return unwrap<T>(result);
  }
  // Access token expired (15 min TTL) — refresh once and retry once.
  const refreshed = await ensureFreshTokens();
  if (!refreshed) {
    return unwrap<T>(result);
  }
  return unwrap<T>(await rawRequest(path, opts));
}

interface RawResult {
  status: number;
  json: unknown;
}

async function rawRequest(path: string, opts: RequestOptions): Promise<RawResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? REQUEST_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {};
    if (!opts.anonymous && tokens) headers.Authorization = `Bearer ${tokens.accessToken}`;
    let body: BodyInit | undefined;
    if (opts.form) {
      body = opts.form; // fetch sets the multipart boundary itself
    } else if (opts.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(opts.body);
    }
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: opts.method ?? (body ? 'POST' : 'GET'),
      headers,
      body,
      signal: controller.signal,
    });
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      // Non-JSON body (unlikely; error contract is JSON) — handled in unwrap.
    }
    return { status: res.status, json };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new ApiError(0, 'timeout', 'The request took too long. Check your connection and try again.');
    }
    throw new ApiError(0, 'network_error', 'Could not reach Bolo. Check your internet connection.');
  } finally {
    clearTimeout(timer);
  }
}

function unwrap<T>(result: RawResult): T {
  if (result.status >= 200 && result.status < 300) {
    return result.json as T;
  }
  const err = (result.json as { error?: { code?: string; message?: string } } | null)?.error;
  throw new ApiError(
    result.status,
    err?.code ?? 'unknown_error',
    err?.message ?? `Request failed (${result.status})`,
  );
}

async function ensureFreshTokens(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function doRefresh(): Promise<boolean> {
  if (!tokens) return false;
  try {
    const result = await rawRequest('/auth/refresh', {
      method: 'POST',
      body: { refresh_token: tokens.refreshToken },
      anonymous: true,
    });
    if (result.status === 200) {
      await saveTokens(result.json as TokenPair);
      return true;
    }
    if (result.status === 401) {
      // Rotated away or expired — this session is over.
      await clearTokens();
      onSessionLost?.();
    }
    return false;
  } catch {
    // Offline: keep the tokens, the next request will try again.
    return false;
  }
}
