import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, Plus, ChevronRight } from "lucide-react";
import api from "../../services/api";
import Widget from "../ui/Widget";
import { buildWorkoutBuckets, countSets, formatRelativeDay, logMinutes } from "../../utils/workoutStats";

const RANGES = [
  { id: "7d", label: "7D", unit: "day" },
  { id: "30d", label: "30D", unit: "day" },
  { id: "12m", label: "12M", unit: "month" },
  { id: "all", label: "All", unit: "year" },
];

const WorkoutTrackerWidget = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState(null); // null = loading
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [range, setRange] = useState("7d");

  useEffect(() => {
    api
      .get("/workouts?limit=200")
      .then((res) => setLogs(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch((err) => {
        console.error("Failed to fetch workout logs:", err);
        setLogs([]);
      });

    api
      .get("/workout-templates")
      .then((res) => {
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setTemplates(list);
        if (list.length > 0) setSelectedTemplateId(list[0]._id);
      })
      .catch((err) => console.error("Failed to fetch workout templates:", err));
  }, []);

  const { buckets, summary } = useMemo(() => buildWorkoutBuckets(logs || [], range), [logs, range]);
  const lastLog = logs?.[0];
  const lastDate = lastLog?.date ? new Date(lastLog.date) : null;
  const unit = RANGES.find((r) => r.id === range).unit;

  const startTemplate = () => {
    const template = templates.find((t) => t._id === selectedTemplateId);
    if (template) navigate("/workouts/log", { state: { templateData: template } });
  };

  return (
    <Widget
      title="Workouts"
      padding="p-4"
      titleChildren={
        lastDate && (
          <span className="text-[11px] text-text-secondary" title={lastDate.toLocaleString()}>
            Last trained <span className="text-text-main">{formatRelativeDay(lastDate)}</span>
          </span>
        )
      }
    >
      <div className="space-y-4">
        {/* Primary action: start a session */}
        <div className="flex gap-2">
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            disabled={templates.length === 0}
            aria-label="Workout template"
            className="dash-input min-w-0 flex-1 !min-h-[36px] text-[13px]"
          >
            {templates.length === 0 && <option value="">No templates yet</option>}
            {templates.map((tpl) => (
              <option key={tpl._id} value={tpl._id}>
                {tpl.name}
              </option>
            ))}
          </select>
          <button
            onClick={startTemplate}
            disabled={!selectedTemplateId}
            className="dash-btn dash-btn-primary !min-h-[36px] !px-4 font-semibold"
          >
            <Play size={13} aria-hidden="true" /> Start
          </button>
          <button
            onClick={() => navigate("/workouts/log")}
            className="dash-btn !min-h-[36px]"
            title="Start an empty workout and add exercises as you go"
          >
            <Plus size={13} aria-hidden="true" /> Blank
          </button>
        </div>

        {/* Trends */}
        <section className="space-y-3 border-t border-white/[0.06] pt-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="dashboard-label">Activity</h4>
            <div className="dash-segment" role="group" aria-label="Time range">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRange(r.id)}
                  aria-pressed={range === r.id}
                  className={range === r.id ? "is-active" : ""}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="dashboard-kpi-panel grid grid-cols-4">
            <Metric label="Workouts" value={summary.workouts} loading={!logs} />
            <Metric label="Sets" value={summary.sets} loading={!logs} />
            <Metric label="Minutes" value={summary.minutes} loading={!logs} />
            <Metric
              label="Avg min"
              value={summary.workouts ? Math.round(summary.minutes / summary.workouts) : "–"}
              loading={!logs}
            />
          </div>

          <SetsChart buckets={buckets} unit={unit} />
        </section>

        {/* Recent sessions */}
        <section className="space-y-1 border-t border-white/[0.06] pt-4">
          <div className="flex items-center justify-between">
            <h4 className="dashboard-label">Recent</h4>
            <Link to="/workouts" className="flex items-center gap-0.5 text-[11px] text-text-secondary hover:text-primary">
              View all <ChevronRight size={12} aria-hidden="true" />
            </Link>
          </div>
          {logs && logs.length === 0 ? (
            <p className="dash-empty">No workouts logged yet. Start one above.</p>
          ) : (
            <ul className="dash-rows">
              {(logs || []).slice(0, 3).map((log) => {
                const date = log.date ? new Date(log.date) : null;
                const exercises = Array.isArray(log.exercises) ? log.exercises.length : 0;
                return (
                  <li key={log._id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-text-main">{log.workoutName || "Workout"}</p>
                      <p className="text-[11px] text-text-secondary" title={date?.toLocaleString()}>
                        {formatRelativeDay(date)}
                      </p>
                    </div>
                    <p className="shrink-0 text-[11px] text-text-secondary tabular-nums">
                      <span className="text-text-main">{exercises}</span> ex · <span className="text-text-main">{countSets(log)}</span> sets
                      {logMinutes(log) > 0 && (
                        <>
                          {" "}
                          · <span className="text-text-main">{logMinutes(log)}</span> min
                        </>
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </Widget>
  );
};

const Metric = ({ label, value, loading }) => (
  <div className="bg-surface px-3 py-2">
    <p className="dashboard-label !text-[9px]">{label}</p>
    {loading ? (
      <span className="skeleton-shimmer mt-1.5 block h-4 w-8" />
    ) : (
      <p className="dash-value mt-1 text-lg leading-none">{value}</p>
    )}
  </div>
);

// Sets per bucket; the last bucket is the current period and is emphasized.
const SetsChart = ({ buckets, unit }) => {
  const peak = Math.max(0, ...buckets.map((b) => b.sets));
  const max = Math.max(1, peak);
  return (
    <div>
      <div className="flex h-16 items-end gap-[3px]" role="img" aria-label={`Sets per ${unit}`}>
        {buckets.map((b, i) => {
          const isCurrent = i === buckets.length - 1;
          return (
            <div
              key={b.key}
              className="flex h-full flex-1 items-end"
              title={`${b.title}: ${b.sets} sets, ${b.workouts} workout${b.workouts === 1 ? "" : "s"}`}
            >
              <div
                className={`w-full rounded-[2px] transition-[height] duration-300 ${
                  b.sets === 0 ? "bg-white/[0.07]" : isCurrent ? "bg-primary" : "bg-primary/55"
                }`}
                style={{ height: b.sets === 0 ? "2px" : `${Math.max(6, (b.sets / max) * 100)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-[3px]" aria-hidden="true">
        {buckets.map((b, i) => (
          <span
            key={b.key}
            className={`flex-1 whitespace-nowrap text-center text-[9px] tabular-nums ${
              i === buckets.length - 1 ? "text-text-main" : "text-text-secondary"
            }`}
          >
            {b.label}
          </span>
        ))}
      </div>
      <p className="mt-1 text-right text-[10px] text-text-secondary">Sets per {unit} · peak {peak}</p>
    </div>
  );
};

export default WorkoutTrackerWidget;
