import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme/ThemeProvider";

export type MoreDestinationKey =
  | "Dashboard"
  | "DashboardPrefs"
  | "PlannerHome"
  | "HabitsList"
  | "HabitEditor"
  | "TasksList"
  | "TaskEditor"
  | "WorkoutList"
  | "WorkoutTemplates"
  | "WorkoutEditor"
  | "FitnessGoals"
  | "BooksList"
  | "BookDetails"
  | "BookNotes"
  | "DailyDrafts"
  | "FinanceHome"
  | "Transactions"
  | "Budgets"
  | "Bills"
  | "Profile"
  | "Collections"
  | "Pokedex"
  | "Settings"
  | "VolumesList";

type MoreItem = {
  key: MoreDestinationKey;
  icon: string;
  label: string;
};

type MoreSection = {
  title: string;
  items: MoreItem[];
};

const MORE_SECTIONS: MoreSection[] = [
  {
    title: "Home",
    items: [
      { key: "Dashboard", icon: "D", label: "Dashboard" },
      { key: "DashboardPrefs", icon: "C", label: "Dashboard Customize" },
    ],
  },
  {
    title: "Plan",
    items: [
      { key: "PlannerHome", icon: "P", label: "Planner Home" },
      { key: "HabitsList", icon: "H", label: "Habits List" },
      { key: "HabitEditor", icon: "E", label: "Habit Editor" },
      { key: "TasksList", icon: "T", label: "Tasks List" },
      { key: "TaskEditor", icon: "D", label: "Task Editor" },
    ],
  },
  {
    title: "Fitness",
    items: [
      { key: "WorkoutList", icon: "W", label: "Workout List" },
      { key: "WorkoutTemplates", icon: "T", label: "Workout Templates" },
      { key: "WorkoutEditor", icon: "S", label: "Workout Session" },
      { key: "FitnessGoals", icon: "G", label: "Fitness Goals" },
    ],
  },
  {
    title: "Library",
    items: [
      { key: "BooksList", icon: "B", label: "Books List" },
      { key: "BookDetails", icon: "D", label: "Book Details" },
      { key: "BookNotes", icon: "N", label: "Book Notes" },
      { key: "DailyDrafts", icon: "R", label: "Daily Drafts" },
    ],
  },
  {
    title: "Finance",
    items: [
      { key: "FinanceHome", icon: "F", label: "Finance Home" },
      { key: "Transactions", icon: "T", label: "Transactions" },
      { key: "Budgets", icon: "B", label: "Budgets" },
      { key: "Bills", icon: "L", label: "Bills" },
    ],
  },
  {
    title: "More",
    items: [
      { key: "Profile", icon: "P", label: "Profile" },
      { key: "Collections", icon: "C", label: "Collections" },
      { key: "Pokedex", icon: "K", label: "Pokédex" },
      { key: "VolumesList", icon: "G", label: "Greentext Volumes" },
      { key: "Settings", icon: "S", label: "Settings" },
    ],
  },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: MoreDestinationKey) => void;
};

const SCREEN_HEIGHT = Dimensions.get("window").height;

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
              maxHeight: SCREEN_HEIGHT * 0.85,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
          <Text style={[styles.heading, { color: theme.colors.textSecondary }]}>More</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
          >
            {MORE_SECTIONS.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>{section.title}</Text>
                {section.items.map((item) => (
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
            ))}
          </ScrollView>
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
    paddingHorizontal: 16,
    paddingBottom: 0,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginLeft: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 12,
  },
  rowIcon: {
    fontSize: 14,
    fontWeight: "700",
    width: 20,
    textAlign: "center",
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  rowChevron: {
    fontSize: 18,
    fontWeight: "300",
  },
});
