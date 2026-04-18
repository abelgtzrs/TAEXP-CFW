import { Pressable, StyleSheet, Text } from "react-native";

import { useAppTheme } from "@/theme/ThemeProvider";

type Props = {
  icon?: string;
  label?: string;
  onPress: () => void;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary";
};

export function IconButton({ icon = "•", label, onPress, size = "md", variant = "secondary" }: Props) {
  const { theme } = useAppTheme();

  const dims = size === "sm" ? 32 : size === "lg" ? 52 : 42;
  const fontSize = size === "sm" ? 14 : size === "lg" ? 24 : 18;
  const bg = variant === "primary" ? theme.colors.primary : theme.colors.surfaceMuted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          width: dims,
          height: dims,
          borderRadius: dims / 2.5,
          backgroundColor: bg,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text style={{ fontSize }}>{icon}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
});
