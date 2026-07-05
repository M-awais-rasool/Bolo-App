/**
 * Key-value persistence seam.
 *
 * The app talks to `KeyValueStore` only, so swapping the backing store —
 * AsyncStorage / MMKV on device, or a synced profile service at scale —
 * is a one-file change. Web builds persist to `localStorage` today;
 * native falls back to in-memory until a device store is plugged in.
 */
export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

function createLocalStorageStore(ls: Storage): KeyValueStore {
  return {
    async get(key) {
      try {
        return ls.getItem(key);
      } catch {
        return null;
      }
    },
    async set(key, value) {
      try {
        ls.setItem(key, value);
      } catch {
        // Quota/private-mode failures are non-fatal: the app keeps working
        // from memory and simply won't persist this session.
      }
    },
    async remove(key) {
      try {
        ls.removeItem(key);
      } catch {
        // ignore
      }
    },
  };
}

function createMemoryStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    async get(key) {
      return map.get(key) ?? null;
    },
    async set(key, value) {
      map.set(key, value);
    },
    async remove(key) {
      map.delete(key);
    },
  };
}

function detectStore(): KeyValueStore {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return createLocalStorageStore(window.localStorage);
  }
  return createMemoryStore();
}

export const storage: KeyValueStore = detectStore();
