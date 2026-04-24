import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { useAppTheme } from "@/theme/ThemeProvider";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md";
};

export function AppButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "md",
}: AppButtonProps) {
  const { theme } = useAppTheme();

  const backgroundColor =
    variant === "secondary"
      ? theme.colors.surfaceMuted
      : variant === "danger"
        ? theme.colors.danger
        : theme.colors.primary;

  const textColor = variant === "secondary" ? theme.colors.textPrimary : theme.colors.buttonText;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        size === "sm" && styles.buttonSm,
        {
          backgroundColor,
          opacity: disabled || loading ? 0.6 : pressed ? 0.88 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size={size === "sm" ? "small" : "small"} />
      ) : (
        <Text style={[styles.text, size === "sm" && styles.textSm, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  buttonSm: {
    minHeight: 34,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  text: {
    fontSize: 15,
    fontWeight: "700",
  },
  textSm: {
    fontSize: 13,
  },
});
