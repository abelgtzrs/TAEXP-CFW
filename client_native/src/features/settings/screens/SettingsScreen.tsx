import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/primitives/AppButton";
import { AppCard } from "@/components/primitives/AppCard";
import { Screen } from "@/components/primitives/Screen";
import { useAuth } from "@/features/auth/context/AuthContext";
import { resolveApiBaseUrl, resolvePublicBaseUrl } from "@/services/api/client";
import { clearLocalOnlyPreferences, LOCAL_STORAGE_KEYS } from "@/services/storage/localStorage";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useTabOrder, getTabLabel } from "@/hooks/useTabOrder";
import { useToast } from "@/components/feedback/ToastProvider";

export function SettingsScreen() {
  const { logout } = useAuth();
  const { theme } = useAppTheme();
  const { order, moveUp, moveDown, resetOrder } = useTabOrder();
  const { showToast } = useToast();

  const handleClearLocal = async () => {
    await clearLocalOnlyPreferences();
    showToast("Local preferences cleared", "success");
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Manage your device preferences, tab order, and session.
        </Text>
      </View>

      <AppCard title="Tab Order" subtitle="Reorder your bottom navigation. Changes are saved locally.">
        {order.map((tabKey, index) => (
          <View key={tabKey} style={[styles.reorderRow, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.reorderLabel, { color: theme.colors.textPrimary }]}>
              {index + 1}. {getTabLabel(tabKey)}
            </Text>
            <View style={styles.reorderButtons}>
              <Pressable
                onPress={() => moveUp(index)}
                disabled={index === 0}
                style={({ pressed }) => [
                  styles.reorderBtn,
                  { backgroundColor: theme.colors.surfaceMuted, opacity: index === 0 ? 0.3 : pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={{ color: theme.colors.textPrimary, fontSize: 14 }}>▲</Text>
              </Pressable>
              <Pressable
                onPress={() => moveDown(index)}
                disabled={index === order.length - 1}
                style={({ pressed }) => [
                  styles.reorderBtn,
                  {
                    backgroundColor: theme.colors.surfaceMuted,
                    opacity: index === order.length - 1 ? 0.3 : pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={{ color: theme.colors.textPrimary, fontSize: 14 }}>▼</Text>
              </Pressable>
            </View>
          </View>
        ))}
        <AppButton onPress={() => void resetOrder()} title="Reset to default" variant="secondary" />
      </AppCard>

      <AppCard title="Environment" subtitle="Resolved from Expo public env and normalized in the shared API client.">
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>API base</Text>
        <Text style={[styles.value, { color: theme.colors.textPrimary }]}>{resolveApiBaseUrl()}</Text>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Public base</Text>
        <Text style={[styles.value, { color: theme.colors.textPrimary }]}>{resolvePublicBaseUrl()}</Text>
      </AppCard>

      <AppCard title="Device-local preferences" subtitle="These remain unsynced by product decision.">
        <Text style={[styles.value, { color: theme.colors.textPrimary }]}>
          {Object.values(LOCAL_STORAGE_KEYS).join("\n")}
        </Text>
        <AppButton onPress={() => void handleClearLocal()} title="Clear local-only preferences" variant="secondary" />
      </AppCard>

      <AppCard title="Session" subtitle="Secure storage backs the auth token. Logout clears it.">
        <AppButton onPress={() => void logout()} title="Log out" variant="danger" />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
  value: {
    fontSize: 14,
    lineHeight: 22,
  },
  reorderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  reorderLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  reorderButtons: {
    flexDirection: "row",
    gap: 6,
  },
  reorderBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
