import AsyncStorage from '@react-native-async-storage/async-storage';

export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

const memory = new Map<string, string>();

export const storage: KeyValueStore = {
  async get(key) {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return memory.get(key) ?? null;
    }
  },
  async set(key, value) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      memory.set(key, value);
    }
  },
  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      memory.delete(key);
    }
  },
};
