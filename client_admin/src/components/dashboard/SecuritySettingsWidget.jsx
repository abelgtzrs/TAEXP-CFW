// src/components/dashboard/SecuritySettingsWidget.jsx
import { useEffect, useMemo, useState } from "react";
import Widget from "../ui/Widget";
import { useAuth } from "../../context/AuthContext";
import { buildStatusData } from "../status/statusData";

const TICK_MS = 1500; // same cadence as the Operations Control Console
const DAY_MS = 24 * 60 * 60 * 1000;

// Reads iat/exp from the JWT payload. Display only: the server is what verifies the token.
const decodeToken = (token) => {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { iat, exp } = JSON.parse(atob(payload));
    return { issuedAt: iat ? iat * 1000 : null, expiresAt: exp ? exp * 1000 : null };
  } catch {
    return { issuedAt: null, expiresAt: null };
  }
};

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
const relative = (ms, now) => {
  const diff = ms - now;
  const abs = Math.abs(diff);
  if (abs < 60 * 60 * 1000) return rtf.format(Math.round(diff / 60000), "minute");
  if (abs < DAY_MS) return rtf.format(Math.round(diff / 3600000), "hour");
  return rtf.format(Math.round(diff / DAY_MS), "day");
};
const formatDate = (value, withTime = false) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
};

const STATE_COLORS = { healthy: "#34d399", warning: "#fbbf24", degraded: "#fb7185", stable: "rgba(255,255,255,0.14)" };

const SecuritySettingsWidget = () => {
  const { user, token } = useAuth();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // Skip ticks while the tab is hidden so a background dashboard does no work.
    const timer = setInterval(() => !document.hidden && setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const now = Date.now(); // the tick re-renders, so relative times stay current
  const { issuedAt, expiresAt } = useMemo(() => decodeToken(token || ""), [token]);
  const status = useMemo(() => buildStatusData(tick), [tick]);

  const lifetime = issuedAt && expiresAt ? expiresAt - issuedAt : 0;
  const remainingPct = lifetime ? Math.max(0, Math.min(100, ((expiresAt - now) / lifetime) * 100)) : 0;
  const expiringSoon = expiresAt && expiresAt - now < 3 * DAY_MS;

  const { healthy, warnings, degraded, activeAlerts } = status.summary;
  const serviceTotal = healthy + warnings + degraded;
  const p1Alerts = status.alerts.filter((a) => a.severity === "P1").length;
  const resources = [
    { label: "CPU", value: status.resourceProfile.avgCpu },
    { label: "Memory", value: status.resourceProfile.avgMemory },
    { label: "Disk", value: status.resourceProfile.avgDisk },
  ];

  const sessionFacts = [
    { label: "Signed in", value: formatDate(issuedAt, true) },
    { label: "Expires", value: formatDate(expiresAt, true) },
    { label: "Last sign-in", value: formatDate(user?.lastLoginDate) },
    { label: "Member since", value: formatDate(user?.createdAt) },
    {
      label: "Login streak",
      value: `${user?.currentLoginStreak ?? 0} ${user?.currentLoginStreak === 1 ? "day" : "days"}`,
      hint: user?.longestLoginStreak ? `best ${user.longestLoginStreak}` : null,
    },
    { label: "Role", value: user?.role || "user", capitalize: true },
  ];

  return (
    <Widget
      title="Security"
      padding="p-0"
      titleChildren={
        <span className="inline-flex items-center gap-2 text-[11px] text-text-secondary">
          <span className={`dashboard-status-dot ${expiringSoon ? "is-pending" : ""}`} aria-hidden="true" />
          {expiringSoon ? "Session ending soon" : "Signed in"}
        </span>
      }
    >
      {/* Identity */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold uppercase text-primary ring-1 ring-primary/30">
          {(user?.username || user?.email || "?").slice(0, 1)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text-main">{user?.username || "Signed-in user"}</p>
          <p className="truncate text-xs text-text-secondary">{user?.email}</p>
        </div>
      </div>

      {/* Session lifetime */}
      <section aria-label="Session" className="px-4 pt-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[13px] text-text-main">
            {expiresAt ? `Session ends ${relative(expiresAt, now)}` : "Session details unavailable"}
          </p>
          {lifetime > 0 && <span className="text-xs tabular-nums text-text-secondary">{Math.round(remainingPct)}% left</span>}
        </div>
        <div
          className="dash-meter mt-2"
          role="meter"
          aria-label="Session time remaining"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(remainingPct)}
        >
          <span style={{ width: `${remainingPct}%`, background: expiringSoon ? "#fbbf24" : "#34d399" }} />
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
          {sessionFacts.map(({ label, value, hint, capitalize }) => (
            <div key={label} className="min-w-0">
              <dt className="text-[11px] text-text-secondary">{label}</dt>
              <dd className={`truncate text-[13px] tabular-nums text-text-main ${capitalize ? "capitalize" : ""}`}>
                {value}
                {hint && <span className="ml-1.5 text-[11px] text-text-secondary">{hint}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Systems, from the Operations Control Console */}
      <section aria-label="Systems" className="mt-4 border-t border-white/[0.06] px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-[13px] font-medium text-text-main">Systems</h4>
          <span className="dash-tag" title="Generated by the Operations Control Console, not measured">
            Simulated
          </span>
        </div>

        <div className="mt-2.5 flex h-1.5 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
          {[
            ["healthy", healthy],
            ["warning", warnings],
            ["degraded", degraded],
          ].map(([state, count]) => (
            <span
              key={state}
              className="h-full transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${(count / serviceTotal) * 100}%`, background: STATE_COLORS[state] }}
            />
          ))}
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums text-text-secondary">
          {[
            ["Healthy", healthy, STATE_COLORS.healthy],
            ["Warning", warnings, STATE_COLORS.warning],
            ["Degraded", degraded, STATE_COLORS.degraded],
          ].map(([label, count, color]) => (
            <li key={label} className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden="true" />
              <span className="text-text-main">{count}</span> {label.toLowerCase()}
            </li>
          ))}
          <li className="ml-auto">
            <span className="text-text-main">{activeAlerts}</span> alerts, {p1Alerts} P1
          </li>
        </ul>

        <div className="mt-3.5 grid grid-cols-3 gap-3">
          {resources.map(({ label, value }) => (
            <div key={label}>
              <div className="flex items-baseline justify-between text-[11px] text-text-secondary">
                <span>{label}</span>
                <span className="tabular-nums text-text-main">{value}%</span>
              </div>
              <div className="dash-meter mt-1">
                <span style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3.5">
          <p className="text-[11px] text-text-secondary">Stability, last 48 windows</p>
          <div className="mt-1.5 flex h-5 items-end gap-[2px]" aria-hidden="true">
            {status.stabilityTimeline.map((point) => (
              <span
                key={point.slot}
                className="flex-1 rounded-[1px]"
                style={{
                  height: `${30 + point.signal * 0.7}%`,
                  background: STATE_COLORS[point.state],
                }}
              />
            ))}
          </div>
        </div>
      </section>
    </Widget>
  );
};

export default SecuritySettingsWidget;
