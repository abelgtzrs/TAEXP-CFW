import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { emitToast } from "../utils/toastBus";

// UI Components
import PageHeader from "../components/ui/PageHeader";

// Dashboard Widgets
import StatBoxRow from "../components/dashboard/StatBoxRow";
import StatBox from "../components/dashboard/StatBox";
import LoreChartWidget from "../components/dashboard/LoreChartWidget";
import SingleLoreChartWidget from "../components/dashboard/SingleLoreChartWidget";
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

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [streakStatus, setStreakStatus] = useState({ countedToday: true, currentLoginStreak: 0 });
  const [ticking, setTicking] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  // Team popover moved to global Header; local state removed

  // Resolve server base for images
  const serverBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").split("/api")[0];

  const getPokemonSprite = (basePokemon) => {
    if (!basePokemon) return null;
    const firstForm = basePokemon.forms?.[0];
    const sprite = firstForm?.spriteGen6Animated || firstForm?.spriteGen5Animated || null;
    return sprite ? `${serverBaseUrl}${sprite}` : null;
  };

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

  // Schedule a refresh at 0:00 America/New_York and show the modal if needed
  useEffect(() => {
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

  return (
    <div className="max-w-[1800px] mx-auto px-2 md:px-4 h-full min-h-0 overflow-y-auto md:overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="space-y-3 h-full min-h-0 flex flex-col"
        style={{ zoom: "0.75", transformOrigin: "top left" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-shrink-0"
        >
          <PageHeader
            title="Dashboard"
            subtitle={`Cognitive Framework Status for ${user.username || "Admin"}.`}
            className="mt-1 mb-1 pl-4"
          />
          {/* Layout edit toggle is in the sidebar footer above Customize UI */}
          {/* Current streak hint below header with countdown to next NY midnight */}
          {!loading && <StreakCountdown streak={streakStatus.currentLoginStreak || 0} />}
        </motion.div>

        {/* --- Main Dashboard Grid --- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-8 gap-3 -mt-1 grid-flow-row-dense flex-1 min-h-0 overflow-y-auto md:overflow-hidden"
        >
          {/* Row 1: Full-width Stat Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="col-span-1 md:col-span-8 order-1 md:order-1"
          >
            <div className="grid grid-cols-2 gap-1 w-full md:grid-cols-8 md:gap-3 auto-rows-fr">
              {Array.isArray(stats.statBoxes) ? (
                stats.statBoxes.map((stat, idx) => (
                  <div key={stat.id || idx} className="w-full h-full">
                    <StatBox stat={stat} loading={loading} className="w-full h-full" />
                  </div>
                ))
              ) : (
                <div className="col-span-full">
                  <StatBoxRow stats={stats} loading={loading} />
                </div>
              )}
            </div>
          </motion.div>

          {/* --- Precise Widget Placement --- */}
          {/* Main content: first 3 columns (all other widgets) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="col-span-1 md:col-span-8 md:col-start-1 order-3 md:order-3 h-full min-h-0 md:overflow-y-auto scrollbar-hide pr-1"
          >
            <LeftColumns
              extraProps={{
                goals: stats.goals,
                loading,
                acquisitions: stats.recentAcquisitions,
                products: stats.topProducts,
              }}
            />

            {/* All additional widgets now participate in the LeftColumns layout via registry */}
          </motion.div>
        </motion.div>

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
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 text-white px-4 py-2 text-sm hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed shadow"
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
              <div className="mt-3 text-xs text-slate-400">Current streak: {streakStatus.currentLoginStreak || 0}</div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DashboardPage;

// Lightweight countdown component (America/New_York midnight)
const StreakCountdown = ({ streak }) => {
  const [remaining, setRemaining] = useState(getRemaining());

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining()), 1000);
    return () => clearInterval(id);
  }, []);

  function getRemaining() {
    try {
      const tz = "America/New_York";
      const now = new Date();
      // Current NY parts
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
        .formatToParts(now)
        .reduce((acc, p) => {
          if (p.type !== "literal") acc[p.type] = p.value;
          return acc;
        }, {});
      const y = parseInt(parts.year, 10);
      const m = parseInt(parts.month, 10) - 1;
      const d = parseInt(parts.day, 10);
      // Next midnight NY time -> create Date in NY by constructing local then offsetting via target UTC difference
      const nextLocalMidnightNY = new Date(Date.UTC(y, m, d + 1, 5, 0, 0));
      // Explanation: Midnight in New York relative to UTC varies (EST=UTC-5, EDT=UTC-4).
      // Instead of hard-coding offset we derive it by getting current NY offset.
      const currentOffsetMinutes = -now.getTimezoneOffset(); // local offset, not NY
      // We can't rely on local offset. Simpler approach: compute actual NY midnight by using Date for now in NY then constructing next day and formatting back to UTC.
      const nowNY = new Date(new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(now)); // This fallback may produce local interpretation; we use a safer relative method below.
      // Simpler robust approach: compute seconds until next midnight using NY parts.
      const secNow = parseInt(parts.hour, 10) * 3600 + parseInt(parts.minute, 10) * 60 + parseInt(parts.second, 10);
      const secLeft = 24 * 3600 - secNow;
      return Math.max(secLeft, 0);
    } catch {
      return 0;
    }
  }

  const format = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
  };

  return (
    <div className="px-4 text-xs opacity-70 flex items-center gap-3" aria-live="polite">
      <span>Current streak: {streak}</span>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10">
        Reset in {format(remaining)}
      </span>
    </div>
  );
};
