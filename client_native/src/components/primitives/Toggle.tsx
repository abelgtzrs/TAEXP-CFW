import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { useAppTheme } from "@/theme/ThemeProvider";

type Props = {
  label: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  subtitle?: string;
  disabled?: boolean;
};

export function Toggle({ label, value, onValueChange, subtitle, disabled }: Props) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => !disabled && onValueChange(!value)}
      style={[styles.row, { opacity: disabled ? 0.5 : 1 }]}
    >
      <View style={styles.copy}>
        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>{label}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={theme.colors.surface}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    gap: 12,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
  },
});
