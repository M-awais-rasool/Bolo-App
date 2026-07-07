import { Platform } from 'react-native';

const DEV_HOST = Platform.OS === 'android' ? '192.168.18.20' : '192.168.18.20';

export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ?? `http://${DEV_HOST}:8080/api/v1`;

export const PACKS_BASE_URL: string =
  process.env.EXPO_PUBLIC_PACKS_URL ?? `http://${DEV_HOST}:9000/bolo-packs`;

export const REQUEST_TIMEOUT_MS = 15000;
