import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

function getRemainingNYMidnightSeconds() {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(now)
      .reduce((acc, p) => {
        if (p.type !== "literal") acc[p.type] = p.value;
        return acc;
      }, {});

    const secNow = parseInt(parts.hour, 10) * 3600 + parseInt(parts.minute, 10) * 60 + parseInt(parts.second, 10);
    return Math.max(24 * 3600 - secNow, 0);
  } catch {
    return 0;
  }
}

function formatClock(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

const PHASES = [
  { name: "Ignition", ring: "ring-emerald-300/40", glow: "bg-emerald-400/30", meter: "from-emerald-300 to-cyan-300" },
  { name: "Spark", ring: "ring-teal-300/40", glow: "bg-teal-400/30", meter: "from-teal-300 to-cyan-300" },
  { name: "Ember", ring: "ring-cyan-300/40", glow: "bg-cyan-400/30", meter: "from-cyan-300 to-sky-300" },
  { name: "Core", ring: "ring-sky-300/45", glow: "bg-sky-400/30", meter: "from-sky-300 to-blue-300" },
  { name: "Surge", ring: "ring-blue-300/45", glow: "bg-blue-400/30", meter: "from-blue-300 to-indigo-300" },
  { name: "Radiant", ring: "ring-indigo-300/45", glow: "bg-indigo-400/35", meter: "from-indigo-300 to-violet-300" },
  { name: "Nova", ring: "ring-violet-300/45", glow: "bg-violet-400/35", meter: "from-violet-300 to-fuchsia-300" },
  { name: "Apex", ring: "ring-fuchsia-300/50", glow: "bg-fuchsia-400/35", meter: "from-fuchsia-300 to-pink-300" },
  { name: "Mythic", ring: "ring-rose-300/50", glow: "bg-rose-400/35", meter: "from-rose-300 to-amber-300" },
  { name: "Ascendant", ring: "ring-amber-300/55", glow: "bg-amber-400/40", meter: "from-amber-300 to-yellow-300" },
  {
    name: "Legend",
    ring: "ring-yellow-300/60",
    glow: "bg-yellow-300/45",
    meter: "from-yellow-300 via-amber-200 to-orange-300",
  },
];

function StreakConsoleCard({
  phase,
  evolutionLevel,
  streakValue,
  isUrgent,
  remaining,
  signal,
  metrics,
  milestone,
  toMilestone,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`relative w-[320px] md:w-[360px] overflow-hidden rounded-xl ring-1 ${phase.ring} bg-[linear-gradient(145deg,rgba(2,6,23,0.96),rgba(15,23,42,0.95))] font-mono text-emerald-100 shadow-[0_10px_26px_rgba(0,0,0,0.45)]`}
      aria-live="polite"
    >
      <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.14)_0px,rgba(255,255,255,0.14)_1px,transparent_2px,transparent_4px)] pointer-events-none" />
      <div className={`absolute -right-8 -top-10 h-24 w-24 rounded-full ${phase.glow} blur-2xl`} />

      <div className="relative px-3 py-2.5">
        <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.18em] text-emerald-100/75">
          <span>Streak Console</span>
          <span>Lv {String(evolutionLevel).padStart(2, "0")}</span>
        </div>

        <div className="mt-1.5 flex items-end justify-between gap-2">
          <div className="flex items-end gap-1.5">
            <span className="text-3xl leading-none font-black text-emerald-100">{streakValue}</span>
            <span className="text-[11px] uppercase tracking-[0.14em] text-emerald-100/75 pb-0.5">days</span>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.14em] text-emerald-100/70">{phase.name}</div>
            <div className={`text-xs font-bold ${isUrgent ? "text-amber-300" : "text-emerald-200"}`}>
              {formatClock(remaining)}
            </div>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2">
          <svg viewBox="0 0 100 100" className="h-8 w-full">
            <path d="M0,50 L100,50" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <path
              d={signal}
              fill="none"
              stroke="rgba(52,211,153,0.95)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
          <div className="text-[10px] text-emerald-100/70">SYNC {Math.round(metrics.sync)}%</div>
        </div>

        <div className="mt-1.5 space-y-1">
          <div className="h-1.5 rounded bg-emerald-100/10 overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${phase.meter}`} style={{ width: `${metrics.resonance}%` }} />
          </div>
          <div className="h-1.5 rounded bg-emerald-100/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-300 to-blue-300"
              style={{ width: `${metrics.stability}%` }}
            />
          </div>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] text-emerald-100/70">
          <span>{streakValue >= 100 ? "Legend cap reached" : `${toMilestone} to Day ${milestone}`}</span>
          <span>L:{Math.round(metrics.legend)}%</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function StreakCompactPreview({ streak = 0, mode = "card" }) {
  const [remaining, setRemaining] = useState(getRemainingNYMidnightSeconds());

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemainingNYMidnightSeconds()), 1000);
    return () => clearInterval(id);
  }, []);

  const streakValue = Math.max(0, Number(streak) || 0);
  const evolutionLevel = Math.min(Math.floor(streakValue / 10), 10);
  const phase = PHASES[evolutionLevel];
  const dayElapsed = 1 - Math.max(0, Math.min(1, remaining / 86400));

  const metrics = useMemo(() => {
    const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, v));
    const resonance = clamp(20 + streakValue * 0.88 + evolutionLevel * 1.7);
    const stability = clamp(95 - dayElapsed * 28 + evolutionLevel * 1.3);
    const sync = clamp(55 + (1 - Math.abs(0.5 - dayElapsed) * 2) * 32 + evolutionLevel);
    return { resonance, stability, sync, legend: clamp((streakValue / 100) * 100) };
  }, [dayElapsed, evolutionLevel, streakValue]);

  const isUrgent = remaining <= 3600;
  const milestone = streakValue >= 100 ? 100 : (Math.floor(streakValue / 10) + 1) * 10;
  const toMilestone = Math.max(0, milestone - streakValue);

  const signal = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => {
      const waveA = Math.sin((i + streakValue * 0.25) * 0.62) * 18;
      const waveB = Math.cos((i * 1.21 + remaining / 2500) * 0.5) * 12;
      const y = Math.max(8, Math.min(92, 50 + waveA + waveB));
      const x = (i / 17) * 100;
      return `${i === 0 ? "M" : "L"}${x},${100 - y}`;
    }).join(" ");
  }, [remaining, streakValue]);

  if (mode === "inline") {
    return (
      <div className="relative group">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-emerald-300/45 bg-slate-950/80 px-3 py-1.5 text-[13px] font-mono font-semibold text-emerald-100 shadow-[0_3px_10px_rgba(0,0,0,0.4)] transition-colors hover:bg-slate-900/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70"
          title="Hover to open streak console"
        >
          <span className="uppercase tracking-[0.16em] text-emerald-200/95 text-[15px]">Streak</span>
          <span className="font-black text-emerald-100 text-[20px] leading-none">{streakValue} Days</span>
          <span className={`text-[13px] leading-none ${isUrgent ? "text-amber-300" : "text-emerald-100/90"}`}>
            {formatClock(remaining)}
          </span>
        </button>

        <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto">
          <StreakConsoleCard
            phase={phase}
            evolutionLevel={evolutionLevel}
            streakValue={streakValue}
            isUrgent={isUrgent}
            remaining={remaining}
            signal={signal}
            metrics={metrics}
            milestone={milestone}
            toMilestone={toMilestone}
          />
        </div>
      </div>
    );
  }

  return (
    <StreakConsoleCard
      phase={phase}
      evolutionLevel={evolutionLevel}
      streakValue={streakValue}
      isUrgent={isUrgent}
      remaining={remaining}
      signal={signal}
      metrics={metrics}
      milestone={milestone}
      toMilestone={toMilestone}
    />
  );
}
