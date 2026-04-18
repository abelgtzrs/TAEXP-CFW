import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme/ThemeProvider";

type Props = {
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "primary";
};

export function Badge({ label, variant = "default" }: Props) {
  const { theme } = useAppTheme();

  const colorMap = {
    default: { bg: theme.colors.surfaceMuted, text: theme.colors.textSecondary },
    success: { bg: theme.colors.success + "22", text: theme.colors.success },
    warning: { bg: theme.colors.warning + "22", text: theme.colors.warning },
    danger: { bg: theme.colors.danger + "22", text: theme.colors.danger },
    primary: { bg: theme.colors.primary + "22", text: theme.colors.primary },
  };

  const c = colorMap[variant];

  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
});
