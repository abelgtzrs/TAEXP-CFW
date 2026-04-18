import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/primitives/Screen";
import { useAppTheme } from "@/theme/ThemeProvider";

type Props = {
  icon: string;
  title: string;
  subtitle: string;
};

export function PlaceholderScreen({ icon, title, subtitle }: Props) {
  const { theme } = useAppTheme();

  return (
    <Screen scroll={false} contentContainerStyle={styles.center}>
      <View style={[styles.badge, { backgroundColor: theme.colors.surfaceMuted }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
      <View style={[styles.chip, { backgroundColor: theme.colors.surfaceMuted }]}>
        <Text style={[styles.chipText, { color: theme.colors.primary }]}>Coming soon</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
  },
  badge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
