import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme/ThemeProvider";

type Action = {
  key: string;
  label: string;
  destructive?: boolean;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  title?: string;
  actions: Action[];
  onClose: () => void;
};

export function ActionSheet({ visible, title, actions, onClose }: Props) {
  const { theme } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
          {title ? <Text style={[styles.title, { color: theme.colors.textSecondary }]}>{title}</Text> : null}

          {actions.map((action) => (
            <Pressable
              key={action.key}
              accessibilityRole="button"
              onPress={() => {
                onClose();
                action.onPress();
              }}
              style={({ pressed }) => [
                styles.actionRow,
                { backgroundColor: pressed ? theme.colors.surfaceMuted : "transparent" },
              ]}
            >
              <Text
                style={[
                  styles.actionLabel,
                  {
                    color: action.destructive ? theme.colors.danger : theme.colors.textPrimary,
                  },
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={[styles.cancelRow, { backgroundColor: theme.colors.surfaceMuted }]}
          >
            <Text style={[styles.cancelLabel, { color: theme.colors.textPrimary }]}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 34,
    paddingHorizontal: 16,
    gap: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
    marginLeft: 4,
  },
  actionRow: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  actionLabel: {
    fontSize: 17,
    fontWeight: "600",
  },
  cancelRow: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 14,
  },
  cancelLabel: {
    fontSize: 17,
    fontWeight: "700",
  },
});
