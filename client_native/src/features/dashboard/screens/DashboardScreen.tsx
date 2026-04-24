import { useCallback, type ComponentProps } from "react";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CompositeNavigationProp } from "@react-navigation/native";

import { AppButton } from "@/components/primitives/AppButton";
import { Badge } from "@/components/primitives/Badge";
import { EmptyState } from "@/components/primitives/EmptyState";
import { ProgressBar } from "@/components/primitives/ProgressBar";
import { Skeleton, SkeletonRow } from "@/components/primitives/Skeleton";
import { Screen } from "@/components/primitives/Screen";
import { NotificationPermissionPrompt } from "@/components/feedback/NotificationPermissionPrompt";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import { useDashboardPrefs, type DashboardSection } from "@/hooks/useDashboardPrefs";
import { useAppTheme } from "@/theme/ThemeProvider";
import { formatCompactNumber } from "@/utils/formatters";
import { resolvePublicBaseUrl } from "@/services/api/client";
import type { AppStackParamList, HomeStackParamList } from "@/app/navigation/types";
import type { RecentAcquisition, TopProduct, YearlyGoal } from "@/services/contracts/userContract";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

// ── Quick-stat tiles ──────────────────────────────────
const STAT_TILES: Array<{ key: string; label: string; icon: IoniconName; color: string }> = [
  { key: "habitsCompleted", label: "Habits", icon: "flame", color: "#f97316" },
  { key: "totalWorkouts", label: "Workouts", icon: "barbell", color: "#6366f1" },
  { key: "booksFinished", label: "Books", icon: "book", color: "#10b981" },
  { key: "activeStreaks", label: "Streak", icon: "flash", color: "#eab308" },
  { key: "gachaPulls", label: "Collectibles", icon: "sparkles", color: "#ec4899" },
  { key: "volumesPublished", label: "Volumes", icon: "reader", color: "#3b82f6" },
];

// ── Quick actions ─────────────────────────────────────
type QuickAction = {
  label: string;
  icon: IoniconName;
  color: string;
  tab: "PlanTab" | "FitnessTab" | "LibraryTab" | "FinanceTab";
};

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Tasks", icon: "checkmark-circle-outline", color: "#6366f1", tab: "PlanTab" },
  { label: "Workout", icon: "barbell-outline", color: "#f97316", tab: "FitnessTab" },
  { label: "Read", icon: "book-outline", color: "#10b981", tab: "LibraryTab" },
  { label: "Finance", icon: "wallet-outline", color: "#3b82f6", tab: "FinanceTab" },
];

// ── Helpers ───────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function resolveAcquisitionImage(item: RecentAcquisition): string | null {
  if (!item.imageUrl) return null;
  if (item.imageUrl.startsWith("http")) return item.imageUrl;
  return `${resolvePublicBaseUrl()}${item.imageUrl}`;
}

// ── Main component ────────────────────────────────────
export function DashboardScreen() {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  type Nav = CompositeNavigationProp<
    NativeStackNavigationProp<HomeStackParamList>,
    NativeStackNavigationProp<AppStackParamList>
  >;
  const navigation = useNavigation<Nav>();
  const {
    stats,
    streak,
    isLoading,
    isRefetching,
    hasError,
    refetch,
    tickStreak: tick,
    isTickingStreak,
  } = useDashboard();
  const { visibleSections } = useDashboardPrefs();

  // currencies from auth user
  const temuTokens = Number(user?.temuTokens ?? 0);
  const gatillaGold = Number(user?.gatillaGold ?? 0);
  const wendyHearts = Number(user?.wendyHearts ?? 0);
  const userLevel = Number(user?.level ?? 1);
  const userXP = Number(user?.experience ?? 0);

  const show = (s: DashboardSection) => visibleSections.includes(s);

  const onRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  // ── Loading skeleton ──────────────────────────────
  if (isLoading) {
    return (
      <Screen>
        <View style={styles.hero}>
          <Skeleton width={140} height={16} />
          <Skeleton width={220} height={30} />
        </View>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </Screen>
    );
  }

  // ── Error fallback ────────────────────────────────
  if (hasError && !stats && !streak) {
    return (
      <Screen>
        <EmptyState
          icon={<Ionicons name="warning" size={40} color={theme.colors.textSecondary} />}
          title="Couldn't load dashboard"
          subtitle="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  const allGoals: YearlyGoal[] = stats?.allGoals ?? [];
  const acquisitions: RecentAcquisition[] = stats?.recentAcquisitions ?? [];
  const topProducts: TopProduct[] = stats?.topProducts ?? [];

  return (
    <Screen scroll={false}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* ── Hero greeting ─────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>{getGreeting()}</Text>
              <Text style={[styles.heroName, { color: theme.colors.textPrimary }]}>{user?.username ?? "there"}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.customizeBtn,
                { backgroundColor: theme.colors.surfaceMuted, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => navigation.navigate("DashboardPrefs")}
            >
              <Ionicons name="settings-outline" size={18} color={theme.colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* ── Notification permission prompt ────────── */}
        <NotificationPermissionPrompt />

        {/* ── Streak banner ─────────────────────────── */}
        {show("streak") && (
          <View
            style={[
              styles.streakBanner,
              { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.streakLeft}>
              <Ionicons name="flame" size={36} color="#f97316" />
              <View>
                <Text style={[styles.streakCount, { color: theme.colors.textPrimary }]}>
                  {streak?.currentLoginStreak ?? 0}
                </Text>
                <Text style={[styles.streakLabel, { color: theme.colors.textSecondary }]}>day streak</Text>
                {(streak?.longestLoginStreak ?? stats?.longestLoginStreak ?? 0) > 0 && (
                  <Text style={[styles.streakBest, { color: theme.colors.textSecondary }]}>
                    best {streak?.longestLoginStreak ?? stats?.longestLoginStreak ?? 0}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.streakRight}>
              {streak?.countedToday ? (
                <Badge label="Counted" variant="success" />
              ) : (
                <AppButton title="Count today" onPress={() => tick()} loading={isTickingStreak} size="sm" />
              )}
            </View>
          </View>
        )}

        {/* ── Quick actions row ─────────────────────── */}
        {show("quickActions") && (
          <View style={styles.quickRow}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.tab}
                style={({ pressed }) => [
                  styles.quickAction,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => navigation.navigate("Tabs", { screen: action.tab } as never)}
              >
                <Ionicons name={action.icon} size={22} color={action.color} />
                <Text style={[styles.quickLabel, { color: theme.colors.textPrimary }]}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* ── Stat tiles ────────────────────────────── */}
        {show("stats") && (
          <>
            <SectionHeader title="At a glance" theme={theme} />
            <View style={styles.statGrid}>
              {STAT_TILES.map((tile) => {
                const value = Number(stats?.[tile.key] ?? 0);
                return (
                  <View
                    key={tile.key}
                    style={[
                      styles.statTile,
                      { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    ]}
                  >
                    <Ionicons name={tile.icon} size={20} color={tile.color} style={{ marginBottom: 2 }} />
                    <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                      {formatCompactNumber(value)}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{tile.label}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ── Today's snapshot ──────────────────────── */}
        {show("today") && (stats?.tasksCompletedToday != null || stats?.workoutsThisWeek != null) && (
          <>
            <SectionHeader title="Today" theme={theme} />
            <View
              style={[styles.todayCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            >
              <TodayRow label="Tasks done today" value={stats?.tasksCompletedToday ?? 0} theme={theme} />
              <TodayRow label="Tasks pending" value={stats?.tasksPending ?? 0} theme={theme} />
              <TodayRow label="Workouts this week" value={stats?.workoutsThisWeek ?? 0} theme={theme} />
            </View>
          </>
        )}

        {/* ── Goals ─────────────────────────────────── */}
        {show("goals") && allGoals.length > 0 && (
          <>
            <SectionHeader title="Goals" theme={theme} />
            <View style={styles.goalsList}>
              {allGoals.map((goal) => {
                const pct = goal.target > 0 ? Math.min(goal.current / goal.target, 1) : 0;
                return (
                  <View
                    key={goal.name}
                    style={[
                      styles.goalCard,
                      { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    ]}
                  >
                    <View style={styles.goalHeader}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                        {goal.icon ? (
                          <Text style={{ fontSize: 14 }}>{goal.icon}</Text>
                        ) : (
                          <Ionicons name="flag" size={14} color={theme.colors.textPrimary} />
                        )}
                        <Text style={[styles.goalName, { color: theme.colors.textPrimary }]}>{goal.name}</Text>
                      </View>
                      <Text style={[styles.goalPct, { color: theme.colors.primary }]}>{Math.round(pct * 100)}%</Text>
                    </View>
                    <ProgressBar progress={pct} color={goal.color ?? theme.colors.primary} />
                    <Text style={[styles.goalMeta, { color: theme.colors.textSecondary }]}>
                      {goal.current} / {goal.target} {goal.metric ?? ""}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ── Fallback: simple goals% ──────────────── */}
        {show("goals") && allGoals.length === 0 && stats?.goals && Object.keys(stats.goals).length > 0 && (
          <>
            <SectionHeader title="Goals" theme={theme} />
            <View
              style={[styles.todayCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            >
              {Object.entries(stats.goals).map(([key, value]) => (
                <View key={key} style={styles.todayRow}>
                  <Text style={[styles.todayLabel, { color: theme.colors.textSecondary }]}>{key}</Text>
                  <View style={styles.todayRight}>
                    <ProgressBar progress={Number(value) / 100} width={80} height={6} />
                    <Text style={[styles.todayValue, { color: theme.colors.textPrimary }]}>{String(value)}%</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Recent acquisitions ───────────────────── */}
        {show("acquisitions") && acquisitions.length > 0 && (
          <>
            <SectionHeader title="Recent Acquisitions" theme={theme} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.acqScroll}>
              {acquisitions.slice(0, 8).map((item, idx) => {
                const imgUrl = resolveAcquisitionImage(item);
                return (
                  <View
                    key={`${item.name}-${idx}`}
                    style={[
                      styles.acqCard,
                      { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    ]}
                  >
                    {imgUrl ? (
                      <Image source={{ uri: imgUrl }} style={styles.acqImage} resizeMode="contain" />
                    ) : (
                      <View style={[styles.acqImagePlaceholder, { backgroundColor: theme.colors.surfaceMuted }]}>
                        <Ionicons name="gift-outline" size={28} color={theme.colors.textSecondary} />
                      </View>
                    )}
                    <Text style={[styles.acqName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.acqType, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                      {item.type}
                      {item.rarity ? ` · ${item.rarity}` : ""}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* ── Budget snapshot ───────────────────────── */}
        {show("budget") && stats?.totalBudget != null && (
          <>
            <SectionHeader title="Budget" theme={theme} />
            <View
              style={[styles.budgetCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            >
              <View style={styles.budgetRow}>
                <View style={styles.budgetLeft}>
                  <Ionicons name="wallet" size={28} color="#3b82f6" />
                  <View>
                    <Text style={[styles.budgetAmount, { color: theme.colors.textPrimary }]}>
                      ${formatCompactNumber(stats.totalBudget)}
                    </Text>
                    <Text style={[styles.budgetLabel, { color: theme.colors.textSecondary }]}>total tracked</Text>
                  </View>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.budgetAction,
                    { backgroundColor: theme.colors.surfaceMuted, opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => navigation.navigate("Tabs", { screen: "FinanceTab" } as never)}
                >
                  <Text style={[{ fontSize: 12, fontWeight: "700", color: theme.colors.primary }]}>Manage</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}

        {/* ── Top products leaderboard ──────────────── */}
        {show("topProducts") && topProducts.length > 0 && (
          <>
            <SectionHeader title="Top Products" theme={theme} />
            <View
              style={[styles.todayCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            >
              {topProducts.map((product, idx) => (
                <View key={product.name} style={styles.productRow}>
                  <View style={styles.productRank}>
                    <Text
                      style={[
                        styles.productRankNum,
                        {
                          color:
                            idx === 0
                              ? "#eab308"
                              : idx === 1
                                ? "#9ca3af"
                                : idx === 2
                                  ? "#f97316"
                                  : theme.colors.textSecondary,
                        },
                      ]}
                    >
                      #{idx + 1}
                    </Text>
                  </View>
                  <Text style={[styles.productName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <View style={[styles.productPill, { backgroundColor: theme.colors.surfaceMuted }]}>
                    <Text style={[styles.productUnits, { color: theme.colors.primary }]}>{product.units}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Currencies ────────────────────────────── */}
        {show("currencies") && (temuTokens > 0 || gatillaGold > 0 || wendyHearts > 0) && (
          <>
            <SectionHeader title="Currencies" theme={theme} />
            <View style={styles.currencyRow}>
              <CurrencyTile icon="logo-bitcoin" label="Temu" value={temuTokens} color="#6366f1" theme={theme} />
              <CurrencyTile icon="star" label="Gatilla" value={gatillaGold} color="#eab308" theme={theme} />
              <CurrencyTile icon="heart" label="Wendy" value={wendyHearts} color="#ec4899" theme={theme} />
            </View>
            {userLevel > 0 && (
              <View
                style={[styles.levelCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                <View style={styles.levelLeft}>
                  <Ionicons name="trophy" size={18} color="#eab308" />
                  <Text style={[styles.levelText, { color: theme.colors.textPrimary }]}>Level {userLevel}</Text>
                </View>
                <Text style={[styles.xpText, { color: theme.colors.textSecondary }]}>
                  {formatCompactNumber(userXP)} XP
                </Text>
              </View>
            )}
          </>
        )}

        {/* ── Profile + Collections shortcuts ───────── */}
        {show("you") && (
          <>
            <SectionHeader title="You" theme={theme} />
            <View style={styles.quickRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.youCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() =>
                  navigation.navigate("Tabs", {
                    screen: "MoreTab",
                    params: { screen: "Profile", initial: false },
                  } as never)
                }
              >
                <Ionicons name="person-outline" size={26} color={theme.colors.primary} />
                <Text style={[styles.quickLabel, { color: theme.colors.textPrimary }]}>Profile</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.youCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() =>
                  navigation.navigate("Tabs", {
                    screen: "MoreTab",
                    params: { screen: "Collections", initial: false },
                  } as never)
                }
              >
                <Ionicons name="layers-outline" size={26} color={theme.colors.primary} />
                <Text style={[styles.quickLabel, { color: theme.colors.textPrimary }]}>Collections</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.youCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() =>
                  navigation.navigate("Tabs", {
                    screen: "MoreTab",
                    params: { screen: "Pokedex", initial: false },
                  } as never)
                }
              >
                <Ionicons name="planet-outline" size={26} color={theme.colors.primary} />
                <Text style={[styles.quickLabel, { color: theme.colors.textPrimary }]}>Pokédex</Text>
              </Pressable>
            </View>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </Screen>
  );
}

// ── Small sub-components ──────────────────────────────
function SectionHeader({ title, theme }: { title: string; theme: { colors: { textPrimary: string } } }) {
  return <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>{title}</Text>;
}

function TodayRow({
  label,
  value,
  theme,
}: {
  label: string;
  value: number;
  theme: { colors: { textPrimary: string; textSecondary: string } };
}) {
  return (
    <View style={styles.todayRow}>
      <Text style={[styles.todayLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.todayValue, { color: theme.colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

function CurrencyTile({
  icon,
  label,
  value,
  color,
  theme,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: number;
  color: string;
  theme: { colors: { surface: string; border: string; textPrimary: string; textSecondary: string } };
}) {
  return (
    <View style={[styles.currencyTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.currencyValue, { color: theme.colors.textPrimary }]}>{formatCompactNumber(value)}</Text>
      <Text style={[styles.currencyLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 4 },

  // Hero
  hero: { marginBottom: 12, gap: 2 },
  heroTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  customizeBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  greeting: { fontSize: 14, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  heroName: { fontSize: 30, fontWeight: "900" },

  // Streak
  streakBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  streakLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  streakFlame: { fontSize: 32 },
  streakCount: { fontSize: 28, fontWeight: "900", lineHeight: 32 },
  streakLabel: { fontSize: 13, fontWeight: "600" },
  streakBest: { fontSize: 11, fontWeight: "500", marginTop: 1 },
  streakRight: { alignItems: "flex-end" },

  // Quick actions
  quickRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  quickAction: {
    flex: 1,
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    gap: 4,
  },
  quickIcon: { fontSize: 20 },
  quickLabel: { fontSize: 12, fontWeight: "700" },

  // Section header
  sectionTitle: { fontSize: 17, fontWeight: "800", marginTop: 16, marginBottom: 8 },

  // Stat grid
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statTile: {
    width: "31%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 2,
  },
  statIcon: { fontSize: 18, marginBottom: 2 },
  statValue: { fontSize: 20, fontWeight: "900" },
  statLabel: { fontSize: 11, fontWeight: "600" },

  // Today card
  todayCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  todayRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  todayLabel: { fontSize: 14 },
  todayRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  todayValue: { fontSize: 15, fontWeight: "800" },

  // Goals
  goalsList: { gap: 10 },
  goalCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  goalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goalName: { fontSize: 15, fontWeight: "700" },
  goalPct: { fontSize: 14, fontWeight: "800" },
  goalMeta: { fontSize: 12 },

  // Acquisitions
  acqScroll: { gap: 10, paddingRight: 20 },
  acqCard: { width: 120, borderRadius: 14, borderWidth: 1, padding: 10, alignItems: "center", gap: 6 },
  acqImage: { width: 56, height: 56, borderRadius: 8 },
  acqImagePlaceholder: { width: 56, height: 56, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  acqName: { fontSize: 12, fontWeight: "700", textAlign: "center" },
  acqType: { fontSize: 10, textAlign: "center" },

  // You cards
  youCard: {
    flex: 1,
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    gap: 6,
  },

  // Budget
  budgetCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  budgetRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  budgetLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  budgetAmount: { fontSize: 22, fontWeight: "900" },
  budgetLabel: { fontSize: 12 },
  budgetAction: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12 },

  // Top products
  productRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  productRank: { width: 28, alignItems: "center" },
  productRankNum: { fontSize: 13, fontWeight: "900" },
  productName: { flex: 1, fontSize: 14, fontWeight: "600" },
  productPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  productUnits: { fontSize: 12, fontWeight: "800" },

  // Currencies
  currencyRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  currencyTile: {
    flex: 1,
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    gap: 3,
  },
  currencyValue: { fontSize: 18, fontWeight: "900" },
  currencyLabel: { fontSize: 11, fontWeight: "600" },
  levelCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  levelLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  levelText: { fontSize: 15, fontWeight: "800" },
  xpText: { fontSize: 13, fontWeight: "600" },
});
