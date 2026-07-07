import { PACKS_BASE_URL } from '../config/env';
import { storage } from '../services/storage';
import { applyContentPack, getContentPack } from './index';
import type { ContentPack } from './types';

const PACK_CACHE_KEY = 'bolo.contentPack.v1';

const DEFAULT_CATEGORY = 'KG';

const FETCH_TIMEOUT_MS = 8000;

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
  }
  void refreshContentPack(DEFAULT_CATEGORY);
}

export async function refreshContentPack(categoryCode: string = DEFAULT_CATEGORY): Promise<void> {
  if (!PACKS_BASE_URL) return;
  try {
    const latest = (await fetchJson(
      `${PACKS_BASE_URL}/packs/${categoryCode}/latest.json`,
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
