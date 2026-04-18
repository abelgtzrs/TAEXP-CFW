import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme/ThemeProvider";

type Props = {
  icon?: string;
  onPress: () => void;
  position?: "bottomRight" | "bottomCenter";
  label?: string;
};

export function FAB({ icon = "+", onPress, position = "bottomRight", label }: Props) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? "Add"}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        position === "bottomCenter" ? styles.center : styles.right,
        {
          backgroundColor: theme.colors.primary,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      {label ? (
        <View style={styles.extended}>
          <Text style={[styles.icon, { color: theme.colors.buttonText }]}>{icon}</Text>
          <Text style={[styles.label, { color: theme.colors.buttonText }]}>{label}</Text>
        </View>
      ) : (
        <Text style={[styles.icon, { color: theme.colors.buttonText }]}>{icon}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 24,
    minWidth: 56,
    minHeight: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  right: {
    right: 20,
  },
  center: {
    alignSelf: "center",
    left: "50%",
    transform: [{ translateX: -28 }],
  },
  extended: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 8,
  },
  icon: {
    fontSize: 22,
    fontWeight: "700",
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
  },
});
