import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import Widget from "../ui/Widget";
import StyledButton from "../ui/StyledButton";
import { Dumbbell, CalendarDays } from "lucide-react";

const WORKOUT_TEMPLATES = [
  { name: "Push Day", to: "/workouts/log?template=push" },
  { name: "Pull Day", to: "/workouts/log?template=pull" },
  { name: "Leg Day", to: "/workouts/log?template=legs" },
  { name: "Full Body", to: "/workouts/log?template=fullbody" },
];

const WorkoutTrackerWidget = () => {
  const [lastLog, setLastLog] = useState(null);

  const [weekly, setWeekly] = useState(null);
  const [timeframe, setTimeframe] = useState("week"); // week | month | year | all

  useEffect(() => {
    api
      .get("/workouts?limit=200")
      .then((res) => {
        const logs = Array.isArray(res.data?.data) ? res.data.data : [];
        if (logs.length > 0) {
          setLastLog(logs[0]);
        }
        // Store raw logs; we'll derive stats for the selected timeframe in render
        setWeekly({ rawLogs: logs });
      })
      .catch((err) => console.error("Failed to fetch workout logs:", err));
  }, []);

  const lastMeta = useMemo(() => {
    if (!lastLog) return null;
    const date = lastLog.date ? new Date(lastLog.date) : null;
    const now = new Date();
    const daysAgo = date ? Math.floor((now - date) / (1000 * 60 * 60 * 24)) : null;
    const exercises = Array.isArray(lastLog.exercises) ? lastLog.exercises : [];
    const totalExercises = exercises.length;
    const totalSets = exercises.reduce((acc, ex) => acc + (Array.isArray(ex.sets) ? ex.sets.length : 0), 0);
    const duration = lastLog.durationMinutes ?? lastLog.duration ?? null;
    return { date, daysAgo, totalExercises, totalSets, duration };
  }, [lastLog]);

  return (
    <Widget title="Workout Status" className="overflow-hidden">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary">Quick Start</h3>
          <div className="rounded-full border border-gray-700/70 bg-black/30 px-2.5 py-0.5 text-[10px] font-mono text-text-tertiary">
            {WORKOUT_TEMPLATES.length} templates
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
          {WORKOUT_TEMPLATES.map((tpl) => (
            <Link key={tpl.name} to={tpl.to} className="block">
              <StyledButton
                className="h-12 w-full border text-xs font-semibold uppercase tracking-wide text-text-main hover:opacity-95 sm:h-14 sm:text-sm"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-primary)" }}
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="grid h-6 w-6 place-items-center rounded border border-primary/40 bg-primary/10 sm:h-7 sm:w-7">
                    <Dumbbell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <span>{tpl.name}</span>
                </div>
              </StyledButton>
            </Link>
          ))}
        </div>

        {lastLog ? (
          <div
            className="rounded-xl border bg-gradient-to-b from-black/25 to-black/40 p-2.5 sm:p-3"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-primary)" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className="h-10 w-10 flex items-center justify-center rounded-md border sm:h-12 sm:w-12"
                  style={{ background: "var(--color-background)", borderColor: "var(--color-primary)" }}
                >
                  <Dumbbell className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">
                    Last Session
                  </div>
                  <h4 className="truncate text-base font-semibold text-text-main sm:text-lg">{lastLog.workoutName}</h4>
                  {lastMeta?.date && (
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-text-secondary">
                      <CalendarDays className="h-4 w-4" />
                      <span>{lastMeta.date.toLocaleDateString()}</span>
                      {typeof lastMeta.daysAgo === "number" && (
                        <span className="ml-2 opacity-80">
                          {lastMeta.daysAgo === 0 ? "Today" : `${lastMeta.daysAgo}d ago`}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div
                className="flex items-center justify-between rounded-md border px-2 py-1.5 text-xs"
                style={{ background: "var(--color-background)", borderColor: "var(--color-primary)" }}
                title="Total exercises in session"
              >
                <span className="text-text-secondary">Exercises</span>
                <span className="text-text-main font-semibold">{lastMeta?.totalExercises ?? 0}</span>
              </div>
              <div
                className="flex items-center justify-between rounded-md border px-2 py-1.5 text-xs"
                style={{ background: "var(--color-background)", borderColor: "var(--color-primary)" }}
                title="Total sets performed"
              >
                <span className="text-text-secondary">Sets</span>
                <span className="text-text-main font-semibold">{lastMeta?.totalSets ?? 0}</span>
              </div>
              {lastMeta?.duration != null && (
                <div
                  className="col-span-2 flex items-center justify-between rounded-md border px-2 py-1.5 text-xs sm:col-span-1"
                  style={{ background: "var(--color-background)", borderColor: "var(--color-primary)" }}
                  title="Session duration"
                >
                  <span className="text-text-secondary">Minutes</span>
                  <span className="text-text-main font-semibold">{lastMeta.duration}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-700/70 bg-black/20 px-3 py-4 text-center text-sm text-text-tertiary">
            No workouts logged yet.
          </div>
        )}

        {/* Timeframe stats */}
        {weekly && (
          <div className="rounded-xl border border-gray-700/70 bg-black/20 p-2.5 sm:p-3">
            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary">Statistics</h3>
              <div
                className="grid w-full grid-cols-4 overflow-hidden rounded-md border sm:inline-flex sm:w-auto"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-primary)" }}
              >
                {[
                  { k: "week", label: "Week" },
                  { k: "month", label: "Month" },
                  { k: "year", label: "Year" },
                  { k: "all", label: "All" },
                ].map((opt) => (
                  <button
                    key={opt.k}
                    onClick={() => setTimeframe(opt.k)}
                    className={`px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${
                      timeframe === opt.k
                        ? "bg-primary text-white"
                        : "text-text-main hover:bg-[var(--color-background)]"
                    }`}
                    aria-pressed={timeframe === opt.k}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              const logs = weekly.rawLogs || [];
              const today = new Date();
              const tzFix = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000);
              let days = [];

              const pushDay = (d) => {
                const key = tzFix(d).toISOString().slice(0, 10);
                days.push({ date: new Date(d), key, workouts: 0, sets: 0, minutes: 0 });
              };

              if (timeframe === "week") {
                const start = new Date(today);
                start.setHours(0, 0, 0, 0);
                start.setDate(start.getDate() - 6);
                for (let i = 0; i < 7; i++) {
                  const d = new Date(start);
                  d.setDate(start.getDate() + i);
                  pushDay(d);
                }
              } else if (timeframe === "month") {
                const start = new Date(today.getFullYear(), today.getMonth(), 1);
                const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) pushDay(new Date(d));
              } else if (timeframe === "year") {
                // Aggregate by month for compact display
                const months = Array.from({ length: 12 }, (_, i) => ({ key: i, workouts: 0, sets: 0, minutes: 0 }));
                let summary = { workouts: 0, sets: 0, minutes: 0 };
                for (const log of logs) {
                  if (!log?.date) continue;
                  const d = new Date(log.date);
                  if (d.getFullYear() !== today.getFullYear()) continue;
                  const monthIdx = d.getMonth();
                  const exs = Array.isArray(log.exercises) ? log.exercises : [];
                  const sets = exs.reduce((acc, ex) => acc + (Array.isArray(ex.sets) ? ex.sets.length : 0), 0);
                  const minutes = Number(log.durationSessionMinutes ?? log.duration ?? 0) || 0;
                  months[monthIdx].workouts += 1;
                  months[monthIdx].sets += sets;
                  months[monthIdx].minutes += minutes;
                  summary.workouts += 1;
                  summary.sets += sets;
                  summary.minutes += minutes;
                }
                const monthLabels = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
                const maxSets = Math.max(1, ...months.map((m) => m.sets));
                return (
                  <>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <StatChip label="Workouts" value={summary.workouts} />
                      <StatChip label="Sets" value={summary.sets} />
                      <StatChip label="Minutes" value={summary.minutes} />
                    </div>
                    <MiniBar labels={monthLabels} data={months.map((m) => m.sets)} max={maxSets} />
                  </>
                );
              } else {
                // All time: aggregate by year
                const byYear = new Map();
                for (const log of logs) {
                  if (!log?.date) continue;
                  const d = new Date(log.date);
                  const y = d.getFullYear();
                  const exs = Array.isArray(log.exercises) ? log.exercises : [];
                  const sets = exs.reduce((acc, ex) => acc + (Array.isArray(ex.sets) ? ex.sets.length : 0), 0);
                  const minutes = Number(log.durationSessionMinutes ?? log.duration ?? 0) || 0;
                  if (!byYear.has(y)) byYear.set(y, { workouts: 0, sets: 0, minutes: 0 });
                  const agg = byYear.get(y);
                  agg.workouts += 1;
                  agg.sets += sets;
                  agg.minutes += minutes;
                }
                const years = Array.from(byYear.keys()).sort((a, b) => a - b);
                const arr = years.map((y) => ({ label: String(y).slice(-2), ...byYear.get(y) }));
                const maxSets = Math.max(1, ...arr.map((m) => m.sets));
                const totals = arr.reduce(
                  (acc, x) => ({
                    workouts: acc.workouts + x.workouts,
                    sets: acc.sets + x.sets,
                    minutes: acc.minutes + x.minutes,
                  }),
                  { workouts: 0, sets: 0, minutes: 0 },
                );
                return (
                  <>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <StatChip label="Workouts" value={totals.workouts} />
                      <StatChip label="Sets" value={totals.sets} />
                      <StatChip label="Minutes" value={totals.minutes} />
                    </div>
                    <MiniBar labels={arr.map((x) => x.label)} data={arr.map((x) => x.sets)} max={maxSets} />
                  </>
                );
              }

              // For week/month we aggregate by day
              const indexByKey = Object.fromEntries(days.map((d, i) => [d.key, i]));
              let summary = { workouts: 0, sets: 0, minutes: 0 };
              for (const log of logs) {
                if (!log?.date) continue;
                const d = new Date(log.date);
                const key = tzFix(d).toISOString().slice(0, 10);
                const idx = indexByKey[key];
                if (idx === undefined) continue;
                const exs = Array.isArray(log.exercises) ? log.exercises : [];
                const sets = exs.reduce((acc, ex) => acc + (Array.isArray(ex.sets) ? ex.sets.length : 0), 0);
                const minutes = Number(log.durationSessionMinutes ?? log.duration ?? 0) || 0;
                days[idx].workouts += 1;
                days[idx].sets += sets;
                days[idx].minutes += minutes;
                summary.workouts += 1;
                summary.sets += sets;
                summary.minutes += minutes;
              }

              let labels;
              if (timeframe === "week") {
                labels = ["S", "M", "T", "W", "T", "F", "S"];
              } else if (timeframe === "month") {
                // Show labels roughly weekly to avoid overflow (1, 8, 15, 22, 29)
                labels = days.map((d, i) => (i % 7 === 0 ? d.date.getDate() : ""));
              } else {
                labels = days.map((d) => d.date.getDate());
              }
              const maxSets = Math.max(1, ...days.map((d) => d.sets));
              return (
                <>
                  <div className="mb-2.5 flex flex-wrap gap-2">
                    <StatChip label="Workouts" value={summary.workouts} />
                    <StatChip label="Sets" value={summary.sets} />
                    <StatChip label="Minutes" value={summary.minutes} />
                  </div>
                  <MiniBar labels={labels} data={days.map((d) => d.sets)} max={maxSets} />
                </>
              );
            })()}
          </div>
        )}

        <Link to="/workouts/log">
          <StyledButton className="mt-1 w-full border border-primary/40 bg-primary/20 text-sm font-semibold hover:opacity-95">
            Log Custom Workout
          </StyledButton>
        </Link>
      </div>
    </Widget>
  );
};

export default WorkoutTrackerWidget;

// Small presentational helpers
const StatChip = ({ label, value }) => (
  <div
    className="inline-flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs"
    style={{ background: "var(--color-surface)", borderColor: "var(--color-primary)" }}
  >
    <span className="text-[11px] uppercase tracking-wide text-text-secondary">{label}</span>
    <span className="text-primary font-semibold">{value}</span>
  </div>
);

const MiniBar = ({ labels, data, max }) => (
  <div
    className="overflow-x-auto rounded-md border p-2.5 sm:p-3"
    style={{ background: "var(--color-surface)", borderColor: "var(--color-primary)" }}
  >
    <div className="flex h-20 min-w-0 items-end gap-1" style={{ width: `${Math.max(100, data.length * 18)}px` }}>
      {data.map((v, i) => {
        const h = Math.round(((v || 0) / Math.max(1, max)) * 100);
        return (
          <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="w-full rounded bg-[var(--color-background)]">
              <div className="rounded bg-primary" style={{ height: `${Math.max(4, h)}%` }}></div>
            </div>
            <div className="text-[10px] text-text-secondary w-full text-center truncate">{labels[i]}</div>
          </div>
        );
      })}
    </div>
  </div>
);
