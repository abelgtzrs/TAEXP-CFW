import AsyncStorage from "@react-native-async-storage/async-storage";

export const LOCAL_STORAGE_KEYS = {
  bottomNavOrder: "tae.mobile.bottomNavOrder.v1",
  dashboardPrefs: "tae.mobile.dashboardPrefs.v1",
  dailyDrafts: "tae.mobile.dailyDrafts.v1",
  profileAppearance: "tae.mobile.profileAppearance.v1",
  notificationPrefs: "tae.mobile.notificationPrefs.v1"
} as const;

export async function getStoredString(key: string) {
  return AsyncStorage.getItem(key);
}

export async function setStoredString(key: string, value: string) {
  await AsyncStorage.setItem(key, value);
}

export async function removeStoredItem(key: string) {
  await AsyncStorage.removeItem(key);
}

export async function getStoredJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setStoredJson<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function clearLocalOnlyPreferences() {
  await AsyncStorage.multiRemove(Object.values(LOCAL_STORAGE_KEYS));
}