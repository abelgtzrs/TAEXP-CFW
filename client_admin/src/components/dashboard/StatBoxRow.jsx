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
    <section aria-label="Activity overview" className="dashboard-kpi-panel dashboard-ticker">
      {/* Two identical copies; the track slides by one copy's width so the loop is seamless */}
      <div className="dashboard-ticker-track">
        {[0, 1].map((copy) =>
          items.map((item) => (
            <div key={`${copy}-${item.key}`} className="dashboard-ticker-cell" aria-hidden={copy === 1 || undefined}>
              <DashboardStat item={item} stats={stats} loading={loading} />
            </div>
          )),
        )}
      </div>
    </section>
  );
}
