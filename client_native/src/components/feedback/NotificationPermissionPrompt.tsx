import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppButton } from "@/components/primitives/AppButton";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationPermissionPrompt() {
  const { theme } = useAppTheme();
  const { loaded, prompted, permissionStatus, requestPermission } = useNotifications();

  // Don't render if: not loaded, already prompted, already granted, or web
  if (!loaded || prompted || permissionStatus === "granted") return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.content}>
        <Ionicons name="notifications" size={28} color={theme.colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Stay on track</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Enable notifications for task, habit, and reading reminders.
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <AppButton title="Enable" onPress={() => void requestPermission()} size="sm" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: { fontSize: 15, fontWeight: "700" },
  subtitle: { fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: "row", justifyContent: "flex-end" },
});
