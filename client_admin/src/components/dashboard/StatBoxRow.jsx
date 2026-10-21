import StatBox from "./StatBox";
import useStatTrend from "../../hooks/useStatTrend";

const items = [
  { key: "habitsCompleted", title: "Habits Today" },
  { key: "tasksCompletedToday", title: "Tasks Done" },
  { key: "tasksPending", title: "Tasks Pending" },
  { key: "activeStreaks", title: "Login Streak" },
  { key: "workoutsThisWeek", title: "Workouts (7d)" },
  { key: "totalWorkouts", title: "Total Workouts" },
  { key: "booksFinished", title: "Books Read" },
  { key: "totalBudget", title: "Total Budget", format: "currency" },
  { key: "gachaPulls", title: "Collectibles" },
  { key: "volumesPublished", title: "Volumes" },
  { key: "activeGoals", title: "Active Goals" },
  { key: "longestLoginStreak", title: "Longest Streak" },
];

function DashboardStat({ item, stats, loading }) {
  const rawValue = stats?.[item.key] ?? 0;
  const trend = useStatTrend(loading ? null : item.key, Number(rawValue), {
    horizon: 14,
    periodLabel: "yesterday",
  });
  return (
    <StatBox title={item.title} value={item.format === "currency" ? `$${rawValue}` : rawValue}
      {...trend} compact showDivider={false} loading={loading} />
  );
}

export default function StatBoxRow({ stats, loading }) {
  return (
    <section aria-label="Activity overview" className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
      {items.map((item) => <DashboardStat key={item.key} item={item} stats={stats} loading={loading} />)}
    </section>
  );
}
