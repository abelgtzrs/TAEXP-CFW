import { useEffect, useRef } from "react";
import { motion, useAnimation, useMotionValue } from "framer-motion";
import StatBox from "./StatBox";
import useStatTrend from "../../hooks/useStatTrend";
import Widget from "../ui/Widget";

const StatBoxRow = ({ stats, loading }) => {
  // Expanded list of stats
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

  // Duplicate items to create seamless loop
  const duplicatedItems = [...items, ...items];

  return (
    <Widget padding="p-0" className="overflow-hidden relative group">
      {/* Desktop Infinite Scroll */}
      <div className="hidden md:flex relative h-[96px] overflow-hidden">
        <motion.div
          className="flex flex-row"
          animate={{
            x: ["0%", "-50%"],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 40, // Adjust speed here (seconds for full loop)
              ease: "linear",
            },
          }}
          style={{ width: "200%" }} // 200% because we duplicated the list once
        >
          {duplicatedItems.map((it, idx) => {
            const rawVal = stats?.[it.key] ?? 0;
            const val = loading ? "..." : it.format === "currency" ? `$${rawVal}` : rawVal;

            const { trend, change, changeType, period } = useStatTrend(it.key, Number(rawVal), {
              horizon: 14,
              periodLabel: "yesterday",
            });

            return (
              <div key={`${it.key}-${idx}`} className="w-[200px] flex-shrink-0 border-r border-gray-700/50">
                <StatBox
                  title={it.title}
                  value={val}
                  change={change}
                  changeType={changeType}
                  period={period}
                  trend={trend}
                  compact
                  showDivider={false} // Handled by wrapper div
                />
              </div>
            );
          })}
        </motion.div>

        {/* Gradient Overlays for smooth fade effect at edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[var(--color-surface)] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--color-surface)] to-transparent z-10 pointer-events-none" />
      </div>

      {/* Mobile Grid (Fallback - show first 4 items condensed) */}
      <div className="md:hidden grid grid-cols-2 gap-1">
        {items.slice(0, 4).map((it) => {
          const rawVal = stats?.[it.key] ?? 0;
          const val = loading ? "..." : it.format === "currency" ? `$${rawVal}` : rawVal;
          const { trend, change, changeType, period } = useStatTrend(it.key, Number(rawVal), {
            horizon: 14,
            periodLabel: "yesterday",
          });
          return (
            <StatBox
              key={it.key}
              title={it.title}
              value={val}
              change={change}
              changeType={changeType}
              period={period}
              trend={trend}
              compact
              showDivider={false}
            />
          );
        })}
      </div>
    </Widget>
  );
};

export default StatBoxRow;
