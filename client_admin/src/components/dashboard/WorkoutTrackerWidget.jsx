import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import Widget from "../ui/Widget";
import WorkoutLogItem from "../workouts/WorkoutLogItem";
import {
  Dumbbell,
  CalendarDays,
  Plus,
  BarChart3,
  History,
  ArrowRight,
  Zap,
  Layers,
  Timer,
  Flame,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

const WorkoutTrackerWidget = () => {
  const navigate = useNavigate();

  const [lastLog, setLastLog] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [timeframe, setTimeframe] = useState("week"); // week | month | year | all
  const [tab, setTab] = useState("stats"); // stats | history

  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

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

    api
      .get("/workout-templates")
      .then((res) => {
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setTemplates(list);
        if (list.length > 0) setSelectedTemplateId(list[0]._id);
      })
      .catch((err) => console.error("Failed to fetch workout templates:", err));
  }, []);

  const lastMeta = useMemo(() => {
    if (!lastLog) return null;
    const date = lastLog.date ? new Date(lastLog.date) : null;
    const now = new Date();
    const daysAgo = date ? Math.floor((now - date) / (1000 * 60 * 60 * 24)) : null;
    const exercises = Array.isArray(lastLog.exercises) ? lastLog.exercises : [];
    const totalExercises = exercises.length;
    const totalSets = exercises.reduce((acc, ex) => acc + (Array.isArray(ex.sets) ? ex.sets.length : 0), 0);
    const duration = lastLog.durationSessionMinutes ?? lastLog.durationMinutes ?? lastLog.duration ?? null;
    return { date, daysAgo, totalExercises, totalSets, duration };
  }, [lastLog]);

  const startTemplate = () => {
    const template = templates.find((t) => t._id === selectedTemplateId);
    if (!template) return;
    navigate("/workouts/log", { state: { templateData: template } });
  };

  const startBlank = () => navigate("/workouts/log");

  return (
    <Widget title="Workout Status" className="overflow-hidden" padding="p-4 sm:p-5">
      <div className="space-y-5">
        <section>
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
              <Zap className="h-3 w-3 text-primary" />
              <span>Quick Start</span>
            </div>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-medium text-text-tertiary">
              {templates.length} template{templates.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                disabled={templates.length === 0}
                className="h-10 w-full appearance-none rounded-lg border border-white/10 bg-black/20 px-3 pr-9 text-sm text-text-main outline-none transition-colors focus:border-primary/60 focus:ring-1 focus:ring-primary/40 disabled:opacity-50"
              >
                {templates.length === 0 && <option value="">No templates yet</option>}
                {templates.map((tpl) => (
                  <option key={tpl._id} value={tpl._id}>
                    {tpl.name}
                  </option>
                ))}
              </select>
              <Dumbbell className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary/70" />
            </div>
            <button
              onClick={startTemplate}
              disabled={!selectedTemplateId}
              className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-[11px] font-semibold uppercase tracking-wide text-white shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none"
            >
              <span>Start</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={startBlank}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-text-secondary transition-colors hover:border-primary/50 hover:text-primary"
              title="Start a blank workout"
              aria-label="Start a blank workout"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </section>

        {lastLog ? (
          <section className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Dumbbell className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
                    Latest session
                  </div>
                  <h4 className="truncate text-base font-semibold leading-tight text-text-main">
                    {lastLog.workoutName}
                  </h4>
                </div>
              </div>
              {lastMeta?.date && (
                <div
                  className="flex shrink-0 items-center gap-1 rounded-full bg-black/20 px-2 py-1 text-[10px] text-text-secondary"
                  title={lastMeta.date.toLocaleDateString()}
                >
                  <CalendarDays className="h-3 w-3 text-primary" />
                  <span>{lastMeta.daysAgo === 0 ? "Today" : `${lastMeta.daysAgo}d ago`}</span>
                </div>
              )}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
              <SessionMetric icon={Dumbbell} label="Exercises" value={lastMeta?.totalExercises ?? 0} />
              <SessionMetric icon={Layers} label="Sets" value={lastMeta?.totalSets ?? 0} />
              <SessionMetric icon={Timer} label="Minutes" value={lastMeta?.duration ?? "--"} />
            </div>
          </section>
        ) : (
          <section className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 py-6 text-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-text-tertiary">
              <Dumbbell className="h-4 w-4" />
            </div>
            <p className="text-sm text-text-tertiary">No workouts logged yet.</p>
          </section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1 rounded-lg border border-white/5 bg-black/20 p-1">
            <button
              onClick={() => setTab("stats")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                tab === "stats"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text-main"
              }`}
              aria-pressed={tab === "stats"}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Statistics</span>
            </button>
            <button
              onClick={() => setTab("history")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                tab === "history"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text-main"
              }`}
              aria-pressed={tab === "history"}
            >
              <History className="h-3.5 w-3.5" />
              <span>History</span>
            </button>
          </div>
          {tab === "stats" && weekly && (
            <div className="flex gap-1 rounded-lg border border-white/5 bg-black/20 p-1">
              {[
                { k: "week", label: "7D" },
                { k: "month", label: "30D" },
                { k: "year", label: "YR" },
                { k: "all", label: "ALL" },
              ].map((opt) => (
                <button
                  key={opt.k}
                  onClick={() => setTimeframe(opt.k)}
                  className={`rounded-md px-2 py-1 text-[9px] font-semibold transition-colors ${
                    timeframe === opt.k
                      ? "bg-primary text-white shadow-sm"
                      : "text-text-secondary hover:text-text-main"
                  }`}
                  aria-label={`Show ${opt.k} workout statistics`}
                  aria-pressed={timeframe === opt.k}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
        {tab === "stats" && weekly && (
          <motion.section
            key={`stats-${timeframe}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
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
                    <StatsSummary summary={summary} />
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
                    <StatsSummary summary={totals} />
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
                  <StatsSummary summary={summary} />
                  <MiniBar labels={labels} data={days.map((d) => d.sets)} max={maxSets} />
                </>
              );
            })()}
          </motion.section>
        )}

        {tab === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {(weekly?.rawLogs || []).length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 py-6 text-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-text-tertiary">
                  <History className="h-4 w-4" />
                </div>
                <p className="text-sm text-text-tertiary">No workout history yet.</p>
              </div>
            ) : (
              <>
                {weekly.rawLogs.slice(0, 5).map((log) => (
                  <WorkoutLogItem key={log._id} log={log} />
                ))}
                <button
                  onClick={() => navigate("/workouts")}
                  className="flex w-full items-center justify-center gap-1 rounded-lg border border-white/5 bg-black/20 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-secondary transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <span>View All History</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </Widget>
  );
};

export default WorkoutTrackerWidget;

// Small presentational helpers
const StatChip = ({ icon: Icon, label, value }) => (
  <div
    className="min-w-0 rounded-lg border border-white/5 bg-white/[0.03] px-2 py-2 text-center"
    title={label}
  >
    <div className="flex items-center justify-center gap-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-text-secondary">
      {Icon && <Icon className="h-2.5 w-2.5 text-primary/70" />}
      <span className="truncate">{label}</span>
    </div>
    <span className="mt-1 block truncate text-lg font-semibold leading-none text-text-main">{value}</span>
  </div>
);

const StatsSummary = ({ summary }) => {
  const averageSets = summary.workouts ? Math.round(summary.sets / summary.workouts) : 0;
  const averageMinutes = summary.workouts ? Math.round(summary.minutes / summary.workouts) : 0;

  return (
    <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
      <StatChip icon={Flame} label="Workouts" value={summary.workouts} />
      <StatChip icon={Layers} label="Sets" value={summary.sets} />
      <StatChip icon={Timer} label="Minutes" value={summary.minutes} />
      <StatChip icon={BarChart3} label="Avg sets" value={averageSets} />
      <StatChip icon={TrendingUp} label="Avg min" value={averageMinutes} />
    </div>
  );
};

const SessionMetric = ({ icon: Icon, label, value }) => (
  <div className="rounded-lg bg-black/20 px-2 py-2 text-center">
    <div className="flex items-center justify-center gap-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
      {Icon && <Icon className="h-2.5 w-2.5 text-primary/70" />}
      <span>{label}</span>
    </div>
    <span className="mt-1 block truncate text-lg font-semibold leading-none text-text-main">{value}</span>
  </div>
);

const MiniBar = ({ labels, data, max }) => (
  <div className="overflow-x-auto">
    <div className="mb-2 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
      <span>Set volume</span>
      <span>Sets per period</span>
    </div>
    <div
      className="flex h-[4.75rem] min-w-0 items-end gap-1.5 rounded-lg border border-white/5 bg-white/[0.02] px-2 pb-2 pt-3"
      style={{ width: `${Math.max(100, data.length * 18)}px` }}
    >
      {data.map((v, i) => {
        const h = Math.round(((v || 0) / Math.max(1, max)) * 100);
        return (
          <div
            key={i}
            className="flex min-w-0 flex-1 flex-col items-center gap-1"
            title={`${labels[i]}: ${v || 0} sets`}
          >
            <div className="flex h-12 w-full items-end overflow-hidden rounded-sm bg-white/5">
              <motion.div
                className="w-full rounded-t-sm bg-gradient-to-t from-primary/70 to-primary"
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(4, h)}%` }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.02, 0.4), ease: "easeOut" }}
              />
            </div>
            <div className="w-full truncate text-center text-[9px] font-medium text-text-secondary">{labels[i]}</div>
          </div>
        );
      })}
    </div>
  </div>
);
