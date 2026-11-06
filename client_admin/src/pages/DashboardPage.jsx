import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLayout } from "../context/LayoutContext";
import api from "../services/api";
import { emitToast } from "../utils/toastBus";

// UI Components
import PageHeader from "../components/ui/PageHeader";

// Dashboard Widgets
import StatBoxRow from "../components/dashboard/StatBoxRow";
import StatBox from "../components/dashboard/StatBox";
import LoreChartWidget from "../components/dashboard/LoreChartWidget";
import SecuritySettingsWidget from "../components/dashboard/SecuritySettingsWidget";
import CurrencySourceWidget from "../components/dashboard/CurrencySourceWidget";
import GoalsWidget from "../components/dashboard/GoalsWidget";
import RecentAcquisitionsWidget from "../components/dashboard/RecentAcquisitionsWidget";
import SpotifyWidget from "../components/dashboard/SpotifyWidget";
import TopProductsWidget from "../components/dashboard/TopProductsWidget";
import HabitTrackerWidget from "../components/dashboard/HabitTrackerWidget";
import BookTrackerWidget from "../components/dashboard/BookTrackerWidget";
import WorkoutTrackerWidget from "../components/dashboard/WorkoutTrackerWidget";
// Right sidebar widgets moved to AdminLayout persistently
// import ClockWidget from "../components/dashboard/ClockWidget";
// import WeatherWidget from "../components/dashboard/WeatherWidget";
import PersonaWidget from "../components/dashboard/PersonaWidget";
import CalendarWidget from "../components/dashboard/CalendarWidget";
import StrokesLyricsWidget from "../components/dashboard/StrokesLyricsWidget";
import LeftColumns from "../components/dashboard/layout/LeftColumns";

const getMaxUsefulColumnsForVisibleWidgets = (visibleWidgetCount) => {
  if (visibleWidgetCount <= 1) return 1;
  if (visibleWidgetCount <= 4) return 2;
  if (visibleWidgetCount <= 8) return 3;
  return 4;
};

const DashboardPage = () => {
  const { setUser } = useAuth();
  const { activeColumnCount, applyLayoutProfile, getAutoColumnCountForWidth, columns, widgetVisibility } = useLayout();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [streakStatus, setStreakStatus] = useState({ countedToday: true, currentLoginStreak: 0 });
  const [ticking, setTicking] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const dashboardWidthRef = useRef(null);
  const activeColumnCountRef = useRef(activeColumnCount);
  // Stable ref so the ResizeObserver effect never re-runs just because applyLayoutProfile
  // got a new function identity after a LayoutContext re-render (which it does on every call).
  const applyLayoutProfileRef = useRef(applyLayoutProfile);
  // Team popover moved to global Header; local state removed
  const todayLabel = useMemo(
    () => new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
    []
  );

  const visibleWidgetCount = useMemo(() => {
    const allColumns = ["col1", "col2", "col3", "col4"];
    return allColumns.reduce((total, colId) => {
      const visibleInColumn = (columns[colId] || []).filter((item) => widgetVisibility[item.id] !== false).length;
      return total + visibleInColumn;
    }, 0);
  }, [columns, widgetVisibility]);

  useEffect(() => {
    activeColumnCountRef.current = activeColumnCount;
  }, [activeColumnCount]);

  useEffect(() => {
    applyLayoutProfileRef.current = applyLayoutProfile;
  }, [applyLayoutProfile]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, streakRes] = await Promise.all([
          api.get("/users/me/dashboard-stats"),
          api.get("/users/me/streak/status"),
        ]);
        setStats(statsRes.data.data);
        setStreakStatus(streakRes.data.data);
        // If the new day started (per backend status), prompt via modal
        setShowStreakModal(!streakRes.data?.data?.countedToday);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleTickStreak = async () => {
    try {
      setTicking(true);
      const res = await api.post("/users/me/streak/tick");
      const data = res.data?.data || {};
      setStreakStatus((prev) => ({ ...prev, ...data }));
      setShowStreakModal(false);
      if (data.awardedBadge && (data.awardedBadge.name || data.awardedBadge.badgeId)) {
        const serverBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").split("/api")[0];
        const img = data.awardedBadge.spriteSmallUrl || data.awardedBadge.imageUrl || "";
        const imageUrl = img?.startsWith("http") ? img : img ? `${serverBaseUrl}${img}` : undefined;
        emitToast({
          title: "Badge Unlocked!",
          message: data.awardedBadge.name || data.awardedBadge.badgeId,
          imageUrl,
          tag: "BADGE",
        });

        // Keep auth context in sync so Profile shows newly obtained badges immediately.
        try {
          const meRes = await api.get("/auth/me");
          setUser(meRes.data?.data || null);
        } catch (syncErr) {
          console.warn("Failed to sync user after badge award:", syncErr);
        }
      }
      // Refresh dashboard stats to reflect new streak immediately
      const statsRes = await api.get("/users/me/dashboard-stats");
      setStats(statsRes.data.data);
    } catch (err) {
      console.error("Failed to tick streak:", err);
    } finally {
      setTicking(false);
    }
  };

  // --- Midnight (America/New_York) refresh scheduler ---
  // Schedule a refresh at 0:00 America/New_York and show the modal if needed
  useEffect(() => {
    // Utility: extract current NY time parts using Intl (handles EST/EDT automatically)
    const getNYParts = () => {
      const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
      const hour = parseInt(parts.hour || "0", 10);
      const minute = parseInt(parts.minute || "0", 10);
      const second = parseInt(parts.second || "0", 10);
      return { hour, minute, second };
    };

    const msUntilNextNYMidnight = () => {
      const { hour, minute, second } = getNYParts();
      const secondsToday = hour * 3600 + minute * 60 + second;
      const remaining = 24 * 3600 - secondsToday;
      // add a small buffer to cross the boundary safely
      return Math.max(remaining * 1000 + 500, 1000);
    };

    let timerId = setTimeout(async function midnightTick() {
      try {
        const streakRes = await api.get("/users/me/streak/status");
        setStreakStatus(streakRes.data.data);
        setShowStreakModal(!streakRes.data?.data?.countedToday);
      } catch (e) {
        console.error("Midnight streak refresh failed:", e);
      } finally {
        // schedule the next midnight tick again
        timerId = setTimeout(midnightTick, msUntilNextNYMidnight());
      }
    }, msUntilNextNYMidnight());

    return () => clearTimeout(timerId);
  }, []);

  // Automatically adapt widget column count to page width.
  // IMPORTANT: applyLayoutProfile is intentionally accessed via ref (not listed as a dep)
  // because calling it updates LayoutContext state, which gives it a new function identity,
  // which would otherwise re-run this effect and restart the ResizeObserver — creating an
  // oscillation loop where the observer fires immediately on every re-attach.
  useEffect(() => {
    const target = dashboardWidthRef.current;
    if (!target) return undefined;

    let frameId = null;

    const applyCountForWidth = (width) => {
      const widthBasedCount = getAutoColumnCountForWidth(width);
      const maxUsefulColumns = getMaxUsefulColumnsForVisibleWidgets(visibleWidgetCount);
      const nextCount = Math.min(widthBasedCount, maxUsefulColumns);
      if (nextCount === activeColumnCountRef.current) return;
      applyLayoutProfileRef.current(nextCount);
      activeColumnCountRef.current = nextCount;
    };

    const scheduleApply = (width) => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => applyCountForWidth(width));
    };

    const initialWidth = target.getBoundingClientRect().width || target.clientWidth || window.innerWidth;
    applyCountForWidth(initialWidth);

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        // Use offsetWidth (border box) to match getBoundingClientRect().width used for
        // the initial measurement. contentRect.width strips padding, which puts us below
        // the 1600px threshold even when the element is at full 1600px width.
        scheduleApply(target.offsetWidth || window.innerWidth);
      });

      observer.observe(target);

      return () => {
        if (frameId) cancelAnimationFrame(frameId);
        observer.disconnect();
      };
    }

    const onResize = () => scheduleApply(target.clientWidth || window.innerWidth);
    window.addEventListener("resize", onResize);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
    };
  }, [getAutoColumnCountForWidth, visibleWidgetCount]);

  return (
    <div
      ref={dashboardWidthRef}
      className="dashboard-home relative isolate max-w-[1800px] mx-auto"
    >
      <div className="relative space-y-6 flex flex-col">
        <div className="dashboard-toolbar">
          <PageHeader
            title="Dashboard"
            className="!m-0 !pl-0"
            subtitle={
              <span className="dashboard-meta">
                <span>{todayLabel}</span>
                <span>
                  <span className={`dashboard-status-dot ${loading ? "is-pending" : ""}`} aria-hidden="true" />
                  {loading ? "Syncing" : "Live"}
                </span>
                <span className="tabular-nums">Streak {streakStatus.currentLoginStreak || 0}d</span>
              </span>
            }
          />
          <Link to="/dashboard/layout-editor" className="admin-toolbar-button">
            <SlidersHorizontal size={14} aria-hidden="true" /> Configure widgets
          </Link>
        </div>
        {/* --- Main Dashboard Grid --- */}
        <div className="relative flex flex-col gap-8">
          {/* Row 1: Full-width Stat Box */}
          <div className="admin-overview-enter">
            <div className="dashboard-section-heading">
              <h2>Overview</h2>
              <span>vs yesterday</span>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full md:grid-cols-4 auto-rows-fr">
              {Array.isArray(stats.statBoxes) ? (
                stats.statBoxes.map((stat, idx) => (
                  <div key={stat.id || idx} className="w-full h-full">
                    <StatBox {...stat} compact loading={loading} showDivider={false} />
                  </div>
                ))
              ) : (
                <div className="col-span-full min-w-0">
                  <StatBoxRow stats={stats} loading={loading} />
                </div>
              )}
            </div>
          </div>

          {/* --- Precise Widget Placement --- */}
          {/* Main content: first 3 columns (all other widgets) */}
          <div className="min-w-0">
            <div className="dashboard-section-heading">
              <h2>Workspace</h2>
              <span>{visibleWidgetCount} visible</span>
            </div>
            <LeftColumns
              extraProps={{
                goals: stats.goals,
                allGoals: stats.allGoals,
                loading,
                acquisitions: stats.recentAcquisitions,
                products: stats.topProducts,
              }}
            />

            {/* All additional widgets now participate in the LeftColumns layout via registry */}
          </div>

        </div>

        {/* Streak Modal (appears at 0:00 America/New_York if not yet counted) */}
        {showStreakModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowStreakModal(false)} />
            <div className="relative z-10 widget-container rounded-xl p-6 w-[92%] max-w-md border border-white/10">
              <h3 className="text-lg font-semibold text-white">New Day! Count Your Login</h3>
              <p className="mt-2 text-sm text-slate-300">
                It just turned 12:00 AM (New York). Count today’s login to continue your streak.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handleTickStreak}
                  disabled={ticking}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 text-white px-4 py-2 text-xl hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed shadow"
                  title="Count today's login toward your streak"
                >
                  {ticking ? "Updating…" : "Count today’s login"}
                </button>
                <button
                  onClick={() => setShowStreakModal(false)}
                  className="inline-flex items-center gap-2 rounded-md bg-white/10 text-white px-3 py-2 text-sm hover:bg-white/15 border border-white/10"
                >
                  Not now
                </button>
              </div>
              <div className="mt-3 text-xl text-slate-400">Current streak: {streakStatus.currentLoginStreak || 0}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
