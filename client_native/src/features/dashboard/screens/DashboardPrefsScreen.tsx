import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { AppButton } from "@/components/primitives/AppButton";
import { Screen } from "@/components/primitives/Screen";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useDashboardPrefs, SECTION_LABELS } from "@/hooks/useDashboardPrefs";
import { useToast } from "@/components/feedback/ToastProvider";

export function DashboardPrefsScreen() {
  const { theme } = useAppTheme();
  const { order, hidden, toggleSection, moveUp, moveDown, reset } = useDashboardPrefs();
  const { showToast } = useToast();

  const handleReset = () => {
    reset();
    showToast("Dashboard reset to defaults", "success");
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Dashboard Layout</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Toggle sections on or off and reorder them. Changes are saved on this device only.
        </Text>
      </View>

      {order.map((section, index) => {
        const isHidden = hidden.includes(section);
        return (
          <View key={section} style={[styles.row, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.rowLeft}>
              <Switch
                value={!isHidden}
                onValueChange={() => toggleSection(section)}
                trackColor={{ false: theme.colors.surfaceMuted, true: theme.colors.primary }}
              />
              <Text style={[styles.label, { color: isHidden ? theme.colors.textTertiary : theme.colors.textPrimary }]}>
                {SECTION_LABELS[section]}
              </Text>
            </View>
            <View style={styles.arrows}>
              <Pressable
                onPress={() => moveUp(index)}
                disabled={index === 0}
                style={({ pressed }) => [
                  styles.arrowBtn,
                  { backgroundColor: theme.colors.surfaceMuted, opacity: index === 0 ? 0.3 : pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={{ color: theme.colors.textPrimary, fontSize: 14 }}>▲</Text>
              </Pressable>
              <Pressable
                onPress={() => moveDown(index)}
                disabled={index === order.length - 1}
                style={({ pressed }) => [
                  styles.arrowBtn,
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
        );
      })}

      <AppButton title="Reset to defaults" onPress={handleReset} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 6 },
  title: { fontSize: 24, fontWeight: "800" },
  subtitle: { fontSize: 14, lineHeight: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  label: { fontSize: 15, fontWeight: "600" },
  arrows: { flexDirection: "row", gap: 6 },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
