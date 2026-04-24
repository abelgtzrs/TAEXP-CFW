import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

import {
  requestNotificationPermission,
  getNotificationPermissionStatus,
} from "@/services/notifications/notificationService";
import { getStoredJson, setStoredJson, LOCAL_STORAGE_KEYS } from "@/services/storage/localStorage";

type NotifPrefs = {
  prompted: boolean;
  enabled: boolean;
};

const DEFAULTS: NotifPrefs = { prompted: false, enabled: false };

export function useNotifications() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULTS);
  const [permissionStatus, setPermissionStatus] = useState<string>("undetermined");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      const stored = await getStoredJson<NotifPrefs>(LOCAL_STORAGE_KEYS.notificationPrefs, DEFAULTS);
      setPrefs(stored);
      if (Platform.OS !== "web") {
        const status = await getNotificationPermissionStatus();
        setPermissionStatus(status);
      }
      setLoaded(true);
    })();
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    const next: NotifPrefs = { prompted: true, enabled: granted };
    setPrefs(next);
    setPermissionStatus(granted ? "granted" : "denied");
    await setStoredJson(LOCAL_STORAGE_KEYS.notificationPrefs, next);
    return granted;
  }, []);

  const setEnabled = useCallback(
    async (enabled: boolean) => {
      const next = { ...prefs, enabled };
      setPrefs(next);
      await setStoredJson(LOCAL_STORAGE_KEYS.notificationPrefs, next);
    },
    [prefs],
  );

  return {
    loaded,
    prompted: prefs.prompted,
    enabled: prefs.enabled,
    permissionStatus,
    requestPermission,
    setEnabled,
  };
}
