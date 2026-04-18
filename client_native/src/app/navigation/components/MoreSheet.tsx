import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme/ThemeProvider";

type MoreItem = {
  key: string;
  icon: string;
  label: string;
};

const MORE_ITEMS: MoreItem[] = [
  { key: "Profile", icon: "👤", label: "Profile" },
  { key: "Collections", icon: "🎴", label: "Collections" },
  { key: "Pokedex", icon: "🔴", label: "Pokédex" },
  { key: "Settings", icon: "⚙️", label: "Settings" },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
};

export function MoreSheet({ visible, onClose, onNavigate }: Props) {
  const { theme } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
          <Text style={[styles.heading, { color: theme.colors.textSecondary }]}>More</Text>

          {MORE_ITEMS.map((item) => (
            <Pressable
              key={item.key}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: pressed ? theme.colors.surfaceMuted : "transparent" },
              ]}
              onPress={() => {
                onClose();
                onNavigate(item.key);
              }}
            >
              <Text style={styles.rowIcon}>{item.icon}</Text>
              <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>{item.label}</Text>
              <Text style={[styles.rowChevron, { color: theme.colors.textTertiary }]}>›</Text>
            </Pressable>
          ))}
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
    paddingBottom: 34,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  heading: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 14,
  },
  rowIcon: {
    fontSize: 22,
  },
  rowLabel: {
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
  },
  rowChevron: {
    fontSize: 22,
    fontWeight: "300",
  },
});
