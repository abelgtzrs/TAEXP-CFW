import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLayout } from "../../context/LayoutContext";
import ClockWidget from "../dashboard/ClockWidget";
import WeatherWidget from "../dashboard/WeatherWidget";
import SpotifyWidget from "../dashboard/SpotifyWidget";
import api from "../../services/api";

// Small in-file popover to house gap & padding controls while in Edit Layout & Size mode
function RightSidebarControlsPopover({ gapPx, setGapPx, paddingPx, setPaddingPx }) {
  const [open, setOpen] = useState(false);
  const popRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (!popRef.current) return;
      if (!popRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDocClick, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <div className="absolute top-1 left-2 z-30" ref={popRef}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="px-2 py-1 text-[11px] bg-slate-800/80 border border-slate-600 text-white hover:bg-slate-700 transition-colors"
        title={open ? "Hide layout controls" : "Show layout controls"}
      >
        Layout
      </button>
      {open && (
        <div className="mt-1 bg-black/80 border border-white/10 p-2 w-[240px] shadow-xl">
          {/* Gap control */}
          <div className="flex items-center gap-1 mb-2">
            <span className="text-[10px] text-text-secondary w-[56px]">Gap</span>
            <button
              className="px-2 py-0.5 text-[10px] bg-slate-800/80 border border-slate-600 hover:bg-slate-700"
              title="Decrease gap (-2px)"
              onClick={() => setGapPx((g) => Math.max(0, g - 2))}
            >
              -
            </button>
            <span className="text-[10px] text-white min-w-[36px] text-center">{gapPx}px</span>
            <button
              className="px-2 py-0.5 text-[10px] bg-slate-800/80 border border-slate-600 hover:bg-slate-700"
              title="Increase gap (+2px)"
              onClick={() => setGapPx((g) => Math.min(40, g + 2))}
            >
              +
            </button>
            <div
              title="Drag to adjust gap"
              onMouseDown={(e) => {
                const startY = e.clientY;
                const startGap = gapPx;
                const onMove = (ev) => {
                  const dy = ev.clientY - startY;
                  const ng = Math.max(0, Math.min(40, Math.round(startGap + dy / 3)));
                  setGapPx(ng);
                };
                const onUp = () => {
                  window.removeEventListener("mousemove", onMove);
                  window.removeEventListener("mouseup", onUp);
                };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              }}
              className="ml-1 w-3 h-4 cursor-ns-resize bg-white/20"
            />
          </div>
          {/* Padding control */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-text-secondary w-[56px]">Padding</span>
            <button
              className="px-2 py-0.5 text-[10px] bg-slate-800/80 border border-slate-600 hover:bg-slate-700"
              title="Decrease padding (-2px)"
              onClick={() => setPaddingPx((p) => Math.max(0, p - 2))}
            >
              -
            </button>
            <span className="text-[10px] text-white min-w-[36px] text-center">{paddingPx}px</span>
            <button
              className="px-2 py-0.5 text-[10px] bg-slate-800/80 border border-slate-600 hover:bg-slate-700"
              title="Increase padding (+2px)"
              onClick={() => setPaddingPx((p) => Math.min(40, p + 2))}
            >
              +
            </button>
            <div
              title="Drag to adjust padding"
              onMouseDown={(e) => {
                const startY = e.clientY;
                const startPad = paddingPx;
                const onMove = (ev) => {
                  const dy = ev.clientY - startY;
                  const np = Math.max(0, Math.min(40, Math.round(startPad + dy / 3)));
                  setPaddingPx(np);
                };
                const onUp = () => {
                  window.removeEventListener("mousemove", onMove);
                  window.removeEventListener("mouseup", onUp);
                };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              }}
              className="ml-1 w-3 h-4 cursor-ns-resize bg-white/20"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Persistent right sidebar content. Assumes its parent positions and sizes the aside area.
export default function RightSidebar({ condensed = false }) {
  const { editMode } = useLayout();
  const draggingRef = useRef(false);
  // Adjustable vertical gap between widgets (in px)
  const [gapPx, setGapPx] = useState(() => {
    try {
      const v = Number(localStorage.getItem("tae.rightSidebar.gapPx") || 16);
      return isNaN(v) ? 16 : v;
    } catch {
      return 16;
    }
  });
  // Adjustable inner padding ("margins") for the sidebar container (in px)
  const [paddingPx, setPaddingPx] = useState(() => {
    try {
      const v = Number(localStorage.getItem("tae.rightSidebar.paddingPx") || 12);
      return isNaN(v) ? 12 : v;
    } catch {
      return 12;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("tae.rightSidebar.gapPx", String(gapPx));
    } catch {}
  }, [gapPx]);
  useEffect(() => {
    try {
      localStorage.setItem("tae.rightSidebar.paddingPx", String(paddingPx));
    } catch {}
  }, [paddingPx]);
  // Per-widget heights removed for flex layout

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!draggingRef.current) return;
      const vw = document.documentElement.clientWidth || window.innerWidth;
      const widthPx = Math.max(240, Math.min(vw - e.clientX, 640));
      const evt = new CustomEvent("tae:rightSidebar:resize", { detail: { widthPx } });
      window.dispatchEvent(evt);
    };
    const onMouseUp = () => {
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // Condensed content: minimal essentials (compact clock + now playing)
  const CondensedView = () => {
    const [now, setNow] = useState(() => new Date());
    const [track, setTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [uptime, setUptime] = useState(0);

    useEffect(() => {
      const t = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(t);
    }, []);

    useEffect(() => {
      const t = setInterval(() => setUptime((u) => u + 1), 1000);
      return () => clearInterval(t);
    }, []);

    // Poll minimal Spotify info
    useEffect(() => {
      let cancelled = false;
      const fetchNowPlaying = async () => {
        try {
          const resp = await api.get("/spotify/currently-playing");
          const d = resp?.data?.data;
          if (d && (d.item || d.track)) {
            const item = d.item || d.track;
            if (!cancelled) {
              setTrack({
                name: item?.name,
                artists: Array.isArray(item?.artists) ? item.artists.map((a) => a.name).join(", ") : "",
                albumArt: item?.album?.images?.[0]?.url || null,
                durationMs: item?.duration_ms || 0,
                progressMs: d?.progress_ms ?? 0,
              });
              setIsPlaying(!!d.is_playing);
            }
          } else {
            // fallback to last played
            const recent = await api.get("/spotify/recently-played?limit=1");
            const it = recent?.data?.items?.[0];
            if (it && !cancelled) {
              setTrack({ name: it.trackName, artists: it.artistName, albumArt: null, durationMs: 0, progressMs: 0 });
              setIsPlaying(false);
            }
          }
        } catch {
          // ignore errors in condensed view
        }
      };
      fetchNowPlaying();
      const interval = setInterval(fetchNowPlaying, 20000);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }, []);

    // Locally tick progress while playing for smoother bar updates
    useEffect(() => {
      if (!isPlaying || !track?.durationMs) return;
      const id = setInterval(() => {
        setTrack((t) => {
          if (!t) return t;
          const next = Math.min((t.progressMs || 0) + 1000, t.durationMs);
          return { ...t, progressMs: next };
        });
      }, 1000);
      return () => clearInterval(id);
    }, [isPlaying, track?.durationMs]);

    const hhmm = useMemo(
      () =>
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      [now]
    );
    const dateStr = useMemo(
      () =>
        now.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
        }),
      [now]
    );
    const tz = useMemo(() => {
      const parts = now.toLocaleTimeString("en-US", { timeZoneName: "short" }).split(" ");
      return parts[2] || parts.pop() || "";
    }, [now]);

    // Helpers for extra info
    const dayOfYear = useMemo(() => {
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - start.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      return Math.floor(diff / oneDay);
    }, [now]);
    const weekOfYear = useMemo(() => {
      const start = new Date(now.getFullYear(), 0, 1);
      const days = Math.floor((now - start) / (24 * 60 * 60 * 1000));
      return Math.ceil(days / 7);
    }, [now]);
    const daysLeft = useMemo(() => {
      const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
      return Math.ceil((endOfYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }, [now]);
    const nextHourIn = useMemo(() => {
      const m = 59 - now.getMinutes();
      const s = 59 - now.getSeconds();
      return `${m}:${s.toString().padStart(2, "0")}`;
    }, [now]);
    const unix = useMemo(() => Math.floor(now.getTime() / 1000), [now]);
    const weekPct = useMemo(() => {
      const d = now.getDay();
      const h = now.getHours();
      const m = now.getMinutes();
      const total = 7 * 24 * 60;
      const cur = d * 24 * 60 + h * 60 + m;
      return Math.round((cur / total) * 100);
    }, [now]);
    const yearPct = useMemo(() => {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear() + 1, 0, 1);
      return Math.round(((now - start) / (end - start)) * 100);
    }, [now]);
    const nyTime = useMemo(() => {
      try {
        return now.toLocaleTimeString("en-US", {
          timeZone: "America/New_York",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return "--:--";
      }
    }, [now]);
    const toMidnight = useMemo(() => {
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const ms = Math.max(0, midnight - now);
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      return `${h}h ${m}m`;
    }, [now]);
    const sinceMidnight = useMemo(() => {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const ms = Math.max(0, now - start);
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      return `${h}h ${m}m`;
    }, [now]);
    const online = typeof navigator !== "undefined" ? navigator.onLine : true;

    return (
      <div className="h-full p-0 relative">
        <div className="h-full bg-black/25 backdrop-blur-xl border border-white/10 p-2 flex flex-col gap-2 overflow-auto">
          {/* Clock mini */}
          <div className="border border-white/10 px-2 py-2 text-center">
            <div className="text-2xl font-mono font-bold text-white leading-none">{hhmm}</div>
            <div className="text-[10px] text-text-secondary mt-1 flex items-center justify-center gap-1">
              <span>{dateStr}</span>
              <span className="opacity-50">•</span>
              <span>{tz}</span>
            </div>
          </div>
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-1 text-center">
            <div className="border border-white/10 px-1 py-1">
              <div className="text-[11px] text-white font-semibold leading-none">{dayOfYear}</div>
              <div className="text-[9px] text-text-secondary leading-none mt-0.5">Day</div>
            </div>
            <div className="border border-white/10 px-1 py-1">
              <div className="text-[11px] text-white font-semibold leading-none">{weekOfYear}</div>
              <div className="text-[9px] text-text-secondary leading-none mt-0.5">Week</div>
            </div>
            <div className="border border-white/10 px-1 py-1">
              <div className="text-[11px] text-white font-semibold leading-none">{daysLeft}</div>
              <div className="text-[9px] text-text-secondary leading-none mt-0.5">Left</div>
            </div>
          </div>
          {/* Progress bars */}
          <div className="space-y-1">
            <div className="w-full h-[6px] border border-white/10">
              <div className="bg-secondary h-[6px]" style={{ width: `${weekPct}%` }} />
            </div>
            <div className="w-full h-[6px] border border-white/10">
              <div className="bg-primary h-[6px]" style={{ width: `${yearPct}%` }} />
            </div>
            <div className="flex justify-between text-[9px] text-text-secondary">
              <span>Week {weekPct}%</span>
              <span>Year {yearPct}%</span>
            </div>
          </div>
          {/* Time bits */}
          <div className="grid grid-cols-2 gap-1 text-[10px] text-text-secondary">
            <div className="border border-white/10 px-2 py-1 flex items-center justify-between">
              <span>Next hr</span>
              <span className="text-white">{nextHourIn}</span>
            </div>
            <div className="border border-white/10 px-2 py-1 flex items-center justify-between">
              <span>NY</span>
              <span className="text-white">{nyTime}</span>
            </div>
            <div className="border border-white/10 px-2 py-1 flex flex-col items-center justify-center">
              <div className="text-[9px] text-text-secondary">To 24:00</div>
              <div className="text-white leading-tight mt-0.5">{toMidnight}</div>
            </div>
            <div className="border border-white/10 px-2 py-1 flex flex-col items-center justify-center">
              <div className="text-[9px] text-text-secondary">Since 00:00</div>
              <div className="text-white leading-tight mt-0.5">{sinceMidnight}</div>
            </div>
            <div className="border border-white/10 px-2 py-1 flex items-center justify-between col-span-2">
              <span>Uptime</span>
              <span className="text-white">
                {String(Math.floor(uptime / 3600)).padStart(2, "0")}:
                {String(Math.floor((uptime % 3600) / 60)).padStart(2, "0")}:{String(uptime % 60).padStart(2, "0")}
              </span>
            </div>
            <div className="border border-white/10 px-2 py-1 flex items-center justify-between col-span-2">
              <span>Network</span>
              <span className={online ? "text-green-400" : "text-red-400"}>{online ? "Online" : "Offline"}</span>
            </div>
            {/* Unix full row */}
            <div className="border border-white/10 px-2 py-1 flex items-center justify-between col-span-2">
              <span>Unix</span>
              <span className="text-white">{unix}</span>
            </div>
          </div>
          {/* Now Playing mini */}
          <div className="border border-white/10 px-2 py-2">
            <div className="text-[10px] uppercase tracking-wide text-text-tertiary mb-1">Now Playing</div>
            {track ? (
              <div className="flex items-center gap-2 min-w-0">
                {track.albumArt ? (
                  <img src={track.albumArt} alt="Album art" className="w-10 h-10 object-cover" />
                ) : (
                  <div className="w-10 h-10 border border-white/10 flex items-center justify-center text-[10px] text-text-secondary">
                    ♪
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate" title={track.name}>
                    {isPlaying ? "▶ " : "⏸ "}
                    {track.name}
                  </div>
                  {track.artists ? (
                    <div className="text-[10px] text-text-secondary truncate" title={track.artists}>
                      {track.artists}
                    </div>
                  ) : null}
                  {isPlaying && track?.durationMs ? (
                    <div className="w-full h-[6px] border border-white/10 mt-1">
                      <div
                        className="bg-emerald-500 h-[6px]"
                        style={{
                          width: `${Math.max(0, Math.min(100, ((track.progressMs || 0) / track.durationMs) * 100))}%`,
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-text-secondary">No data</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (condensed) {
    return <CondensedView />;
  }

  return (
    <div className="h-full p-0 relative">
      {/* Edit controls trigger + popover */}
      {editMode && (
        <RightSidebarControlsPopover
          gapPx={gapPx}
          setGapPx={setGapPx}
          paddingPx={paddingPx}
          setPaddingPx={setPaddingPx}
        />
      )}
      <div
        className="h-full bg-black/25 backdrop-blur-xl border border-white/10 flex flex-col overflow-y-auto scrollbar-hide"
        style={{ gap: `${gapPx}px`, padding: `${paddingPx}px` }}
      >
        {/* Clock */}
        <div className="relative w-full flex-shrink-0 min-h-[400px]">
          <div className="w-full h-full overflow-hidden">
            <div
              className="origin-top-left h-full"
              style={{ transform: "scale(0.85)", transformOrigin: "top left", width: "calc(100% / 0.85)" }}
            >
              <ClockWidget />
            </div>
          </div>
        </div>

        {/* Weather */}
        <div className="relative w-full flex-shrink-0 min-h-[350px]">
          <div className="w-full h-full overflow-hidden">
            <div
              className="origin-top-left h-full"
              style={{ transform: "scale(0.85)", transformOrigin: "top left", width: "calc(100% / 0.85)" }}
            >
              <WeatherWidget />
            </div>
          </div>
        </div>

        {/* Spotify */}
        <div className="relative w-full flex-shrink-0 min-h-[250px]">
          <div className="w-full h-full overflow-hidden">
            <div
              className="origin-top-left h-full"
              style={{ transform: "scale(0.85)", transformOrigin: "top left", width: "calc(100% / 0.85)" }}
            >
              <SpotifyWidget />
            </div>
          </div>
        </div>
      </div>
      {/* Left-edge drag handle appears in Edit Layout & Size mode; disabled in condensed */}
      {editMode && !condensed && (
        <div
          title="Drag to resize sidebar width"
          onMouseDown={(e) => {
            draggingRef.current = true;
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
            e.preventDefault();
          }}
          className="absolute left-[-4px] top-0 h-full w-2 cursor-col-resize bg-transparent"
          style={{
            // subtle visual affordance
            boxShadow: "inset -1px 0 0 0 rgba(255,255,255,0.06)",
          }}
        />
      )}
    </div>
  );
}
