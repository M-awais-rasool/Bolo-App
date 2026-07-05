/**
 * Remote pack loading: cache-then-network keyed by `revision`
 * (Bolo/BACKEND_PLAN.md §4.2).
 *
 * Boot order — chosen for a child on a flaky connection:
 *   1. bundled pack — always present, renders instantly
 *   2. cached pack  — applied at boot if newer (awaited; local, fast)
 *   3. CDN refresh  — background; a newer pack is cached and applied, and is
 *      still there on the next fully-offline launch
 * Every failure falls back one level; the app never blocks on the network.
 */
import { storage } from '../services/storage';
import { applyContentPack, getContentPack } from './index';
import type { ContentPack } from './types';

const PACK_CACHE_KEY = 'bolo.contentPack.v1';

/** Until child profiles pick a category in-app, everyone gets the KG pack. */
const CATEGORY_CODE = 'KG';

/**
 * Packs origin. Dev default is the MinIO container from server/docker-compose;
 * production builds point this at the CDN. Set to null to disable refresh.
 */
const PACKS_BASE_URL: string | null = 'http://localhost:9000/bolo-packs';

const FETCH_TIMEOUT_MS = 8000;

/** Call once at boot, before first render. Resolves fast: only the local
 *  cache read is awaited; the network refresh continues in the background. */
export async function hydrateContentPack(): Promise<void> {
  try {
    const raw = await storage.get(PACK_CACHE_KEY);
    if (raw) {
      const cached: unknown = JSON.parse(raw);
      if (isPack(cached) && cached.revision > getContentPack().revision) {
        applyContentPack(cached);
      }
    }
  } catch {
    // Corrupt cache — the bundled pack still works.
  }
  void refreshFromRemote();
}

async function refreshFromRemote(): Promise<void> {
  if (!PACKS_BASE_URL) return;
  try {
    const latest = (await fetchJson(
      `${PACKS_BASE_URL}/packs/${CATEGORY_CODE}/latest.json`,
    )) as { revision?: unknown; url?: unknown };
    if (typeof latest?.revision !== 'number' || typeof latest?.url !== 'string') return;
    if (latest.revision <= getContentPack().revision) return;

    const pack = await fetchJson(`${PACKS_BASE_URL}/${latest.url}`);
    if (!isPack(pack) || pack.revision !== latest.revision) return;

    await storage.set(PACK_CACHE_KEY, JSON.stringify(pack));
    applyContentPack(pack);
  } catch {
    // Offline is a normal condition, not an error.
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`${res.status} for ${url}`);
    }
    return (await res.json()) as unknown;
  } finally {
    clearTimeout(timer);
  }
}

/** `schemaVersion` must match exactly — an old client never applies a pack
 *  shape it can't render (see types.ts). */
function isPack(p: unknown): p is ContentPack {
  const pack = p as ContentPack;
  return (
    !!pack &&
    pack.schemaVersion === 1 &&
    typeof pack.revision === 'number' &&
    Array.isArray(pack.lessons) &&
    pack.lessons.length > 0
  );
}
