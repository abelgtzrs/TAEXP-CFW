import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";

// ── Configure default behavior ────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// ── Permission ────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function getNotificationPermissionStatus(): Promise<string> {
  if (Platform.OS === "web") return "unavailable";
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

// ── Scheduling ────────────────────────────────────────
export type ReminderInput = {
  id: string;
  title: string;
  body: string;
  /** Trigger date — or seconds from now if number */
  trigger: Date | number;
};

export async function scheduleReminder(input: ReminderInput): Promise<string> {
  const trigger: Notifications.NotificationTriggerInput =
    typeof input.trigger === "number"
      ? { seconds: input.trigger, type: SchedulableTriggerInputTypes.TIME_INTERVAL }
      : { date: input.trigger, type: SchedulableTriggerInputTypes.DATE };

  const notificationId = await Notifications.scheduleNotificationAsync({
    identifier: input.id,
    content: {
      title: input.title,
      body: input.body,
    },
    trigger,
  });
  return notificationId;
}

// ── Cancellation ──────────────────────────────────────
export async function cancelReminder(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ── Query scheduled ───────────────────────────────────
export async function getScheduledReminders() {
  return Notifications.getAllScheduledNotificationsAsync();
}
