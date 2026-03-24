import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Battery,
  Calendar,
  Chrome,
  Clock,
  Flower,
  Globe,
  Laptop,
  Leaf,
  MapPin,
  Monitor,
  Moon,
  Server,
  Smartphone,
  Snowflake,
  Sun,
  Sunrise,
  Sunset,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import Widget from "../ui/Widget";

const AnalogClock = ({ time }) => {
  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  const secondHandRotation = seconds * 6;
  const minuteHandRotation = minutes * 6 + seconds * 0.1;
  const hourHandRotation = (hours % 12) * 30 + minutes * 0.5;

  return (
    <div className="w-24 h-24 rounded-xl border border-white/15 bg-black/40 p-1.5 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="clockGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#131a23" />
            <stop offset="100%" stopColor="#06090f" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="47" fill="url(#clockGlow)" stroke="#ffffff22" strokeWidth="2" />
        {[...Array(12)].map((_, i) => {
          const deg = i * 30;
          return (
            <line
              key={i}
              x1="50"
              y1="8"
              x2="50"
              y2={i % 3 === 0 ? "15" : "12"}
              stroke={i % 3 === 0 ? "#d1d5db" : "#6b7280"}
              strokeWidth={i % 3 === 0 ? "2" : "1"}
              transform={`rotate(${deg} 50 50)`}
            />
          );
        })}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="28"
          stroke="#d1d5db"
          strokeWidth="4"
          strokeLinecap="round"
          transform={`rotate(${hourHandRotation} 50 50)`}
        />
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="17"
          stroke="#f8fafc"
          strokeWidth="2.5"
          strokeLinecap="round"
          transform={`rotate(${minuteHandRotation} 50 50)`}
        />
        <line
          x1="50"
          y1="53"
          x2="50"
          y2="14"
          stroke="#34d399"
          strokeWidth="1.5"
          strokeLinecap="round"
          transform={`rotate(${secondHandRotation} 50 50)`}
        />
        <circle cx="50" cy="50" r="3.5" fill="#34d399" />
      </svg>
    </div>
  );
};

const Sparkline = ({ values = [], color = "#34d399" }) => {
  if (!values.length) return <div className="h-8 w-full" />;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-8 w-full">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

const RingGauge = ({ value = 0, color = "#22d3ee", label = "", sublabel = "" }) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5">
      <div
        className="h-9 w-9 rounded-full grid place-items-center text-[10px] font-semibold text-white"
        style={{
          background: `conic-gradient(${color} ${clamped * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
        }}
      >
        <div className="h-6 w-6 rounded-full bg-black/80 grid place-items-center">{clamped}</div>
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-white/50">{label}</div>
        <div className="text-[10px] text-white/80 truncate">{sublabel}</div>
      </div>
    </div>
  );
};

const BinaryClockRow = ({ label, value, bits = 6 }) => {
  const bin = value.toString(2).padStart(bits, "0");
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-white/55 w-6">{label}</span>
      <div className="flex items-center gap-1">
        {bin.split("").map((bit, i) => (
          <span
            key={`${label}-${i}`}
            className={`h-2.5 w-2.5 rounded-sm border ${
              bit === "1" ? "bg-emerald-400 border-emerald-300/60" : "bg-black/50 border-white/15"
            }`}
          />
        ))}
      </div>
      <span className="font-mono text-[10px] text-white/80 w-6 text-right">{value}</span>
    </div>
  );
};

const ClockWidget = () => {
  const [time, setTime] = useState(new Date());
  const [uptime, setUptime] = useState(0);
  const [perf, setPerf] = useState({ memory: 48, fps: 60 });
  const [latency, setLatency] = useState(28);
  const [perfHistory, setPerfHistory] = useState({ memory: [], fps: [], latency: [] });
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine ? "online" : "offline");

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    const uptimeTimer = setInterval(() => setUptime((prev) => prev + 1), 1000);
    return () => clearInterval(uptimeTimer);
  }, []);

  useEffect(() => {
    const performanceTimer = setInterval(() => {
      const nextMemory = Math.floor(Math.random() * 22) + 40;
      const nextFps = Math.floor(Math.random() * 12) + 54;
      const nextLatency = Math.floor(Math.random() * 55) + 15;
      setPerf({ memory: nextMemory, fps: nextFps });
      setLatency(nextLatency);
      setPerfHistory((prev) => ({
        memory: [...prev.memory.slice(-35), nextMemory],
        fps: [...prev.fps.slice(-35), nextFps],
        latency: [...prev.latency.slice(-35), nextLatency],
      }));
    }, 2000);

    const updateNetworkStatus = () => setNetworkStatus(navigator.onLine ? "online" : "offline");
    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);

    return () => {
      clearInterval(performanceTimer);
      window.removeEventListener("online", updateNetworkStatus);
      window.removeEventListener("offline", updateNetworkStatus);
    };
  }, []);

  const getDayOfYear = (date) => {
    const start = new Date(date.getFullYear(), 0, 0);
    return Math.floor((date - start) / (1000 * 60 * 60 * 24));
  };

  const getWeekOfYear = (date) => {
    const start = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date - start) / (24 * 60 * 60 * 1000));
    return Math.ceil(days / 7);
  };

  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getMoonPhase = (date) => {
    const cycles = 29.530588853;
    const known = new Date(2000, 0, 6);
    const days = (date - known) / (1000 * 60 * 60 * 24);
    const phase = (days % cycles) / cycles;
    if (phase < 0.125) return "New";
    if (phase < 0.25) return "Waxing Crescent";
    if (phase < 0.375) return "First Quarter";
    if (phase < 0.5) return "Waxing Gibbous";
    if (phase < 0.625) return "Full";
    if (phase < 0.75) return "Waning Gibbous";
    if (phase < 0.875) return "Last Quarter";
    return "Waning Crescent";
  };

  const getSeason = (date) => {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return { icon: Flower, name: "Spring" };
    if (month >= 5 && month <= 7) return { icon: Sun, name: "Summer" };
    if (month >= 8 && month <= 10) return { icon: Leaf, name: "Autumn" };
    return { icon: Snowflake, name: "Winter" };
  };

  const getTimeUntilNextHour = (date) => {
    const minutes = 59 - date.getMinutes();
    const seconds = 59 - date.getSeconds();
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getConnectionType = () => {
    if ("connection" in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      return connection?.effectiveType || "unknown";
    }
    return "ethernet";
  };

  const getDaysUntilNewYear = (date) => {
    const endOfYear = new Date(date.getFullYear() + 1, 0, 1);
    return Math.ceil((endOfYear - date) / (1000 * 60 * 60 * 24));
  };

  const getWeekProgress = (date) => {
    const currentMinutes = date.getDay() * 24 * 60 + date.getHours() * 60 + date.getMinutes();
    return Math.round((currentMinutes / (7 * 24 * 60)) * 100);
  };

  const getYearProgress = (date) => {
    const start = new Date(date.getFullYear(), 0, 1);
    const end = new Date(date.getFullYear() + 1, 0, 1);
    return Math.round(((date - start) / (end - start)) * 100);
  };

  const getSunInfo = (date) => {
    const dayOfYear = getDayOfYear(date);
    const sunriseHour = Math.round(6 + 2 * Math.sin((dayOfYear / 365) * 2 * Math.PI));
    const sunsetHour = Math.round(18 + 2 * Math.sin((dayOfYear / 365) * 2 * Math.PI));
    const sunriseMinutes = Math.floor((dayOfYear * 7) % 60);
    const sunsetMinutes = Math.floor((dayOfYear * 11) % 60);
    return {
      sunrise: `${sunriseHour.toString().padStart(2, "0")}:${sunriseMinutes.toString().padStart(2, "0")}`,
      sunset: `${sunsetHour.toString().padStart(2, "0")}:${sunsetMinutes.toString().padStart(2, "0")}`,
    };
  };

  const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    if (ua.includes("Edg")) return { icon: Globe, text: "Edge" };
    if (ua.includes("Firefox")) return { icon: Globe, text: "Firefox" };
    if (ua.includes("Chrome")) return { icon: Chrome, text: "Chromium" };
    if (ua.includes("Safari")) return { icon: Globe, text: "Safari" };
    return { icon: Globe, text: "Browser" };
  };

  const getDeviceInfo = () => {
    const platform = navigator.platform;
    if (platform.includes("Win")) return { icon: Monitor, text: "Windows" };
    if (platform.includes("Mac")) return { icon: Laptop, text: "macOS" };
    if (platform.includes("Linux")) return { icon: Server, text: "Linux" };
    if (platform.includes("iPhone") || platform.includes("iPad")) return { icon: Smartphone, text: "iOS" };
    if (platform.includes("Android")) return { icon: Smartphone, text: "Android" };
    return { icon: Monitor, text: "Device" };
  };

  const getBatteryInfo = () => ("getBattery" in navigator ? "Battery API" : "AC Power");

  const getMonthProgress = (date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return Math.round(((date - start) / (end - start)) * 100);
  };

  const getDayProgress = (date) => {
    const mins = date.getHours() * 60 + date.getMinutes();
    return Math.round((mins / (24 * 60)) * 100);
  };

  const getQuarter = (date) => Math.floor(date.getMonth() / 3) + 1;

  const zoneTime = (timeZone) =>
    time.toLocaleTimeString("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

  const timezone = useMemo(() => {
    const parts = time.toLocaleTimeString("en-US", { timeZoneName: "short" }).split(" ");
    return parts[2] || parts.pop() || "";
  }, [time]);

  const season = getSeason(time);
  const SeasonIcon = season.icon;
  const browser = getBrowserInfo();
  const BrowserIcon = browser.icon;
  const device = getDeviceInfo();
  const DeviceIcon = device.icon;
  const weekProgress = getWeekProgress(time);
  const yearProgress = getYearProgress(time);
  const monthProgress = getMonthProgress(time);
  const dayProgress = getDayProgress(time);
  const sun = getSunInfo(time);
  const hexTime = [time.getHours(), time.getMinutes(), time.getSeconds()]
    .map((n) => n.toString(16).padStart(2, "0").toUpperCase())
    .join(":");
  const timeMatrix = [
    { label: "Local", tz: undefined },
    { label: "UTC", tz: "UTC" },
    { label: "London", tz: "Europe/London" },
    { label: "New York", tz: "America/New_York" },
    { label: "Mexico", tz: "America/Mexico_City" },
    { label: "Tokyo", tz: "Asia/Tokyo" },
  ];

  return (
    <Widget title="Temporal Ops Console" className="h-full" variant="plain">
      <div className="h-full overflow-y-auto scrollbar-hide rounded-xl border border-white/10 bg-gradient-to-b from-black/35 to-black/55 p-2.5 space-y-2">
        <div className="grid grid-cols-[auto,1fr] gap-2 rounded-xl border border-white/10 bg-black/35 p-2">
          <AnalogClock time={time} />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">Local Time</div>
            <div className="font-mono text-2xl sm:text-3xl font-semibold text-white leading-none mt-1">
              {zoneTime(undefined)}
            </div>
            <div className="mt-1 text-[11px] text-white/70 truncate">
              {time.toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "2-digit",
              })}
            </div>
            <div className="mt-1 grid grid-cols-3 gap-1 text-[10px]">
              <div className="rounded-md bg-black/40 px-1.5 py-1 border border-white/10">
                <div className="text-white/45">UTC</div>
                <div className="font-mono text-white/90">{zoneTime("UTC")}</div>
              </div>
              <div className="rounded-md bg-black/40 px-1.5 py-1 border border-white/10">
                <div className="text-white/45">NYC</div>
                <div className="font-mono text-white/90">{zoneTime("America/New_York")}</div>
              </div>
              <div className="rounded-md bg-black/40 px-1.5 py-1 border border-white/10">
                <div className="text-white/45">TOK</div>
                <div className="font-mono text-white/90">{zoneTime("Asia/Tokyo")}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-black/35 p-2">
            <div className="flex items-center justify-between text-[10px] text-white/55 uppercase tracking-wide">
              <span>Week Progress</span>
              <span className="text-white/85">{weekProgress}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                style={{ width: `${weekProgress}%` }}
              />
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/35 p-2">
            <div className="flex items-center justify-between text-[10px] text-white/55 uppercase tracking-wide">
              <span>Year Progress</span>
              <span className="text-white/85">{yearProgress}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-cyan-400 transition-all duration-700"
                style={{ width: `${yearProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <RingGauge value={dayProgress} color="#34d399" label="Day Cycle" sublabel={`${dayProgress}% elapsed`} />
            <RingGauge
              value={monthProgress}
              color="#38bdf8"
              label="Month Cycle"
              sublabel={`${monthProgress}% elapsed`}
            />
            <RingGauge value={yearProgress} color="#a78bfa" label="Year Cycle" sublabel={`${yearProgress}% elapsed`} />
          </div>
          <div className="rounded-xl border border-white/10 bg-black/35 p-2 space-y-1.5">
            <div className="text-[10px] uppercase tracking-wide text-white/50">Encoded Time</div>
            <div className="rounded-md border border-white/10 bg-black/40 px-2 py-1">
              <div className="text-[10px] text-white/45">Hex Clock</div>
              <div className="font-mono text-[12px] text-cyan-300">{hexTime}</div>
            </div>
            <div className="rounded-md border border-white/10 bg-black/40 px-2 py-1 space-y-1">
              <div className="text-[10px] text-white/45">Binary Clock</div>
              <BinaryClockRow label="H" value={time.getHours()} bits={5} />
              <BinaryClockRow label="M" value={time.getMinutes()} bits={6} />
              <BinaryClockRow label="S" value={time.getSeconds()} bits={6} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5 text-[10px]">
          <div className="rounded-lg border border-white/10 bg-black/30 p-1.5">
            <div className="text-white/45">DOY</div>
            <div className="mt-0.5 text-white font-semibold flex items-center gap-1">
              <Calendar size={11} /> {getDayOfYear(time)}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 p-1.5">
            <div className="text-white/45">Week</div>
            <div className="mt-0.5 text-white font-semibold">{getWeekOfYear(time)}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 p-1.5">
            <div className="text-white/45">Unix</div>
            <div className="mt-0.5 text-white font-semibold truncate">{Math.floor(time.getTime() / 1000)}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 p-1.5">
            <div className="text-white/45">To NY</div>
            <div className="mt-0.5 text-white font-semibold">{getDaysUntilNewYear(time)}d</div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-1.5">
            <div className="text-white/45">Quarter</div>
            <div className="mt-0.5 text-white font-semibold">Q{getQuarter(time)}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 p-1.5">
            <div className="text-white/45">Latency</div>
            <div className="mt-0.5 text-amber-300 font-semibold">{latency} ms</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 p-1.5">
            <div className="text-white/45">Month</div>
            <div className="mt-0.5 text-white font-semibold">
              {time.toLocaleDateString("en-US", { month: "short" })}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 p-1.5">
            <div className="text-white/45">ISO Date</div>
            <div className="mt-0.5 text-white font-semibold truncate">{time.toISOString().slice(0, 10)}</div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-1.5">
            <div className="text-white/45">Next Hr</div>
            <div className="mt-0.5 text-white font-semibold flex items-center gap-1">
              <Clock size={11} /> {getTimeUntilNextHour(time)}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 p-1.5">
            <div className="text-white/45">Zone</div>
            <div className="mt-0.5 text-white font-semibold flex items-center gap-1">
              <MapPin size={11} /> {timezone}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 p-1.5">
            <div className="text-white/45">Memory</div>
            <div className="mt-0.5 text-emerald-300 font-semibold">{perf.memory} MB</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 p-1.5">
            <div className="text-white/45">FPS</div>
            <div className="mt-0.5 text-cyan-300 font-semibold">{perf.fps}</div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-white/45 mb-1">FPS Trend</div>
              <Sparkline values={perfHistory.fps} color="#22d3ee" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-white/45 mb-1">Memory Trend</div>
              <Sparkline values={perfHistory.memory} color="#34d399" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-white/45 mb-1">Latency Trend</div>
              <Sparkline values={perfHistory.latency} color="#f59e0b" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <div className="text-[10px] uppercase tracking-wide text-white/50 mb-1">Timezone Matrix</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
            {timeMatrix.map((row) => (
              <div key={row.label} className="flex items-center justify-between border-b border-white/5 pb-0.5">
                <span className="text-white/60">{row.label}</span>
                <span className="font-mono text-white/85">{zoneTime(row.tz)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-xl border border-white/10 bg-black/35 p-2 space-y-1">
            <div className="text-[10px] uppercase tracking-wide text-white/50">Astronomy</div>
            <div className="flex items-center justify-between text-white/80">
              <span className="flex items-center gap-1">
                <Sunrise size={12} /> Sunrise
              </span>
              <span className="font-mono">{sun.sunrise}</span>
            </div>
            <div className="flex items-center justify-between text-white/80">
              <span className="flex items-center gap-1">
                <Sunset size={12} /> Sunset
              </span>
              <span className="font-mono">{sun.sunset}</span>
            </div>
            <div className="flex items-center justify-between text-white/80">
              <span className="flex items-center gap-1">
                <Moon size={12} /> Moon
              </span>
              <span>{getMoonPhase(time)}</span>
            </div>
            <div className="flex items-center justify-between text-white/80">
              <span className="flex items-center gap-1">
                <SeasonIcon size={12} /> Season
              </span>
              <span>{season.name}</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/35 p-2 space-y-1">
            <div className="text-[10px] uppercase tracking-wide text-white/50">System Signals</div>
            <div className="flex items-center justify-between text-white/80">
              <span className="flex items-center gap-1">
                <DeviceIcon size={12} /> Device
              </span>
              <span>{device.text}</span>
            </div>
            <div className="flex items-center justify-between text-white/80">
              <span className="flex items-center gap-1">
                <BrowserIcon size={12} /> Browser
              </span>
              <span>{browser.text}</span>
            </div>
            <div className="flex items-center justify-between text-white/80">
              <span className="flex items-center gap-1">
                <Battery size={12} /> Power
              </span>
              <span>{getBatteryInfo()}</span>
            </div>
            <div className="flex items-center justify-between text-white/80">
              <span className="flex items-center gap-1">
                {networkStatus === "online" ? <Wifi size={12} /> : <WifiOff size={12} />} Network
              </span>
              <span className={networkStatus === "online" ? "text-emerald-300" : "text-red-300"}>
                {networkStatus.toUpperCase()} • {getConnectionType().toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/35 p-2 grid grid-cols-3 gap-2 text-[10px]">
          <div className="flex items-center gap-1.5 text-emerald-300">
            <Activity size={12} /> API Online
          </div>
          <div className="flex items-center gap-1.5 text-cyan-300">
            <Zap size={12} /> WS Connected
          </div>
          <div className="flex items-center gap-1.5 text-white/80 justify-end">
            <Clock size={12} /> Uptime {formatUptime(uptime)}
          </div>
        </div>
      </div>
    </Widget>
  );
};

export default ClockWidget;
