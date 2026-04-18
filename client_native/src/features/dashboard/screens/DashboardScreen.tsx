import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/primitives/AppButton";
import { AppCard } from "@/components/primitives/AppCard";
import { Screen } from "@/components/primitives/Screen";
import { useAuth } from "@/features/auth/context/AuthContext";
import { fetchDashboardStats, fetchStreakStatus, tickStreak } from "@/services/contracts/userContract";
import { formatCompactNumber } from "@/utils/formatters";
import { useAppTheme } from "@/theme/ThemeProvider";

const statConfig = [
  { key: "habitsCompleted", label: "Habits" },
  { key: "totalWorkouts", label: "Workouts" },
  { key: "booksFinished", label: "Books" },
  { key: "activeStreaks", label: "Streak" },
  { key: "gachaPulls", label: "Collectibles" },
  { key: "volumesPublished", label: "Volumes" },
] as const;

export function DashboardScreen() {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();

  const statsQuery = useQuery({ queryKey: ["dashboard.stats"], queryFn: fetchDashboardStats });
  const streakQuery = useQuery({ queryKey: ["dashboard.streakStatus"], queryFn: fetchStreakStatus });

  const tickMutation = useMutation({
    mutationFn: tickStreak,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard.stats"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard.streakStatus"] }),
        queryClient.invalidateQueries({ queryKey: ["profile.me"] }),
      ]);
    },
  });

  const stats = statsQuery.data;
  const streak = streakQuery.data;

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>Dashboard</Text>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Welcome back{user?.username ? `, ${user.username}` : ""}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>This starter screen proves the auth, query, and theme layers are working together.</Text>
      </View>

      <AppCard title="Streak" subtitle="Synced to the existing backend login streak flow.">
        <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>{streak?.currentLoginStreak ?? 0} day(s)</Text>
        <Text style={[styles.metricMeta, { color: theme.colors.textSecondary }]}>Longest streak: {streak?.longestLoginStreak ?? 0}</Text>
        {!streak?.countedToday ? (
          <AppButton loading={tickMutation.isPending} onPress={() => tickMutation.mutate()} title="Count today" />
        ) : (
          <Text style={[styles.metricMeta, { color: theme.colors.success }]}>Already counted today</Text>
        )}
      </AppCard>

      <AppCard title="Quick Stats" subtitle="Pulled from /users/me/dashboard-stats">
        <View style={styles.grid}>
          {statConfig.map((item) => (
            <View key={item.key} style={[styles.statTile, { backgroundColor: theme.colors.surfaceMuted }]}> 
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                {formatCompactNumber(Number(stats?.[item.key] ?? 0))}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </AppCard>

      <AppCard title="Goals Snapshot" subtitle="EPIC-2 will expand this into the real mobile home feed.">
        {stats?.goals ? (
          <View style={styles.goalList}>
            {Object.entries(stats.goals).map(([key, value]) => (
              <View key={key} style={styles.goalRow}>
                <Text style={[styles.goalLabel, { color: theme.colors.textSecondary }]}>{key}</Text>
                <Text style={[styles.goalValue, { color: theme.colors.textPrimary }]}>{String(value)}%</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.metricMeta, { color: theme.colors.textSecondary }]}>No goal data is currently available.</Text>
        )}
      </AppCard>

      <AppCard title="Recent Acquisitions" subtitle="Compact preview of the existing dashboard stats payload.">
        <View style={styles.acquisitionList}>
          {(stats?.recentAcquisitions ?? []).slice(0, 4).map((item, index) => (
            <Pressable
              key={`${item.name}-${index}`}
              style={[styles.acquisitionRow, { borderColor: theme.colors.border }]}
            >
              <Text style={[styles.acquisitionName, { color: theme.colors.textPrimary }]}>{item.name}</Text>
              <Text style={[styles.acquisitionMeta, { color: theme.colors.textSecondary }]}>
                {item.type}
                {item.rarity ? ` • ${item.rarity}` : ""}
              </Text>
            </Pressable>
          ))}
          {!stats?.recentAcquisitions?.length ? (
            <Text style={[styles.metricMeta, { color: theme.colors.textSecondary }]}>No recent acquisitions yet.</Text>
          ) : null}
        </View>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 6
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2
  },
  title: {
    fontSize: 28,
    fontWeight: "800"
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22
  },
  metricValue: {
    fontSize: 32,
    fontWeight: "800"
  },
  metricMeta: {
    fontSize: 14,
    lineHeight: 20
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  statTile: {
    width: "47%",
    borderRadius: 16,
    padding: 14,
    gap: 4
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800"
  },
  statLabel: {
    fontSize: 13
  },
  goalList: {
    gap: 10
  },
  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  goalLabel: {
    textTransform: "capitalize",
    fontSize: 14
  },
  goalValue: {
    fontSize: 14,
    fontWeight: "700"
  },
  acquisitionList: {
    gap: 10
  },
  acquisitionRow: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4
  },
  acquisitionName: {
    fontSize: 15,
    fontWeight: "700"
  },
  acquisitionMeta: {
    fontSize: 13
  }
});