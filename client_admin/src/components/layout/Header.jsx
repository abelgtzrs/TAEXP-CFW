import { Search, Bell, Mail, User, LogOut, CalendarDays, FileText, Save, History, Trash2, Target, Plus, Hash, Check, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { Link } from "react-router-dom";
import CalendarWidget from "../dashboard/CalendarWidget";
import {
  listDates,
  getHistory,
  getLatest,
  saveDraft,
  deleteVersion,
  formatDate,
} from "../../services/dailyDraftsService";

const Header = ({ forcedHeight }) => {
  const { user, logout, setUser } = useAuth();
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);
  const personaButtonRef = useRef(null);
  const [pokemonOpen, setPokemonOpen] = useState(false);
  const teamHoverTimer = useRef(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarHoverTimer = useRef(null);
  const [dailyOpen, setDailyOpen] = useState(false);
  const dailyHoverTimer = useRef(null);
  const [dailyDateStr, setDailyDateStr] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });
  const [dailyContent, setDailyContent] = useState("");
  const [dailyHistory, setDailyHistory] = useState([]);
  const [dailyAllDates, setDailyAllDates] = useState([]);
  const unlockedPersonas = user?.unlockedAbelPersonas || [];
  const activePersona = user?.activeAbelPersona || null;
  const activePersonaId = activePersona?._id || null;
  const [goalProgress, setGoalProgress] = useState(0);
  const [goals, setGoals] = useState([]);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const goalsHoverTimer = useRef(null);
  const [customIncrement, setCustomIncrement] = useState({ index: null, val: "" });

  // Construct the base URL for the server to correctly resolve image paths
  const serverBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").split("/api")[0];

  useEffect(() => {
    // Basic goal fetch for header summary
    const fetchGoalProgress = async () => {
      try {
        const res = await api.get("/users/me/goals");
        const userGoals = res.data.data || [];
        setGoals(userGoals);
        if (userGoals.length > 0) {
          const totalPct = userGoals.reduce((acc, g) => acc + Math.min(g.current / g.target, 1), 0);
          setGoalProgress(Math.round((totalPct / userGoals.length) * 100));
        } else {
            setGoalProgress(0);
        }
      } catch {}
    };
    fetchGoalProgress();
  }, [goalsOpen]); // Re-fetch when opened to ensure fresh data

  const getPokemonSprite = (basePokemon) => {
    if (!basePokemon) return null;
    const firstForm = basePokemon.forms?.[0];
    // Use Gen5 animated sprite specifically for header display
    const sprite = firstForm?.spriteGen5Animated || null;
    return sprite ? `${serverBaseUrl}${sprite}` : null;
  };

  const handleUpdateGoal = async (index, amountToAdd) => {
    const add = Number(amountToAdd);
    if (isNaN(add) || add <= 0) return;

    const updatedGoals = [...goals];
    const goal = updatedGoals[index];

    if (goal.current < goal.target) {
        goal.current = Math.min(Number(goal.current) + add, Number(goal.target));
        setGoals(updatedGoals); // Optimistic key update

        // Recalculate global header progress
        const totalPct = updatedGoals.reduce((acc, g) => acc + Math.min(g.current / g.target, 1), 0);
        setGoalProgress(Math.round((totalPct / updatedGoals.length) * 100));

        try {
            await api.put("/users/me/goals", { goals: updatedGoals });
        } catch (err) {
            console.error("Failed to update goal increment", err);
        }
    }
  };

  // --- Daily Drafts helpers ---
  const refreshDaily = () => {
    setDailyAllDates(listDates());
    setDailyHistory(getHistory(dailyDateStr));
    const latest = getLatest(dailyDateStr);
    setDailyContent(latest ? latest.content : "");
  };
  useEffect(() => {
    if (dailyOpen) refreshDaily();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyDateStr, dailyOpen]);

  // Close Daily Drafts on Escape when modal is open
  useEffect(() => {
    if (!dailyOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setDailyOpen(false);
      if (e.key === "ArrowLeft") setDailyDateStr((s) => offsetDateStr(s, -1));
      if (e.key === "ArrowRight") setDailyDateStr((s) => offsetDateStr(s, 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dailyOpen]);

  const offsetDateStr = (dateStr, delta) => {
    try {
      const d = new Date(`${dateStr}T00:00:00`);
      if (isNaN(d.getTime())) throw new Error("Invalid date");
      d.setDate(d.getDate() + delta);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } catch {
      return dateStr;
    }
  };

  const handleSelectPersona = async (personaId) => {
    if (personaId === activePersonaId) {
      setPersonaDropdownOpen(false);
      return;
    }
    try {
      const response = await api.put("/users/me/profile/active-persona", { personaId });
      setUser(response.data.data);
      setPersonaDropdownOpen(false);
    } catch (error) {
      alert("Could not set active persona.");
    }
  };

  // Keep header compact; Pokémon now render inside a popover
  const computedHeight = forcedHeight ? forcedHeight : 48;

  // Moving sprites state/logic
  const spriteSize = 72; // popover field; comfortable size
  const containerRef = useRef(null);
  const rafRef = useRef(0);
  const [actors, setActors] = useState([]);
  const mailButtonRef = useRef(null);

  // Initialize and run animation regardless of header expansion; size/wall adapt via state
  useEffect(() => {
    const team = (user?.displayedPokemon || []).slice(0, 6);
    const el = containerRef.current;
    if (!pokemonOpen || !el || team.length === 0) return;
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Distribute actors across vertical lanes to avoid all hugging the bottom/top
    const padding = 8; // keep off exact edges for nicer look
    const usableH = Math.max(height - spriteSize - padding * 2, 0);
    const laneCount = Math.max(team.length, 1);
    const laneStep = laneCount > 1 ? usableH / (laneCount - 1) : 0;
    const init = team.map((p, i) => {
      const x = Math.random() * Math.max(width - spriteSize, 0);
      // Evenly spaced lanes with a tiny jitter
      let baseY = padding + i * laneStep;
      const jitter = (Math.random() - 0.5) * 12; // +/- 6px
      let y = Math.min(Math.max(baseY + jitter, 0), Math.max(height - spriteSize, 0));
      const speed = 0.6 + Math.random() * 1.0; // px per frame
      const dir = Math.random() < 0.5 ? -1 : 1; // start left or right
      const vx = dir * speed;
      const vy = 0; // horizontal-only movement
      return { key: p?._id || p?.basePokemon?._id || `${i}`, x, y, vx, vy };
    });
    setActors(init);

    let lastTs = performance.now();
    const step = (ts) => {
      const dt = Math.min((ts - lastTs) / (1000 / 60), 2); // normalize to ~60fps steps, cap to avoid jumps
      lastTs = ts;
      setActors((prev) => {
        if (!el) return prev;
        const { width: w, height: h } = el.getBoundingClientRect();
        // Boundaries are simply the container edges inside the popover
        const rightLimit = Math.max(w - spriteSize, 0);
        const next = prev.map((a) => ({ ...a }));

        // Integrate motion (horizontal only)
        for (const a of next) {
          a.x += a.vx * dt;

          // Bounds with bounce (left/right)
          if (a.x < 0) {
            a.x = 0;
            a.vx = Math.abs(a.vx);
          } else if (a.x > rightLimit) {
            a.x = Math.max(rightLimit, 0);
            a.vx = -Math.abs(a.vx);
          }

          // Keep Y within bounds (no vertical motion, just clamp with padding)
          const pad = 8;
          if (a.y < pad) a.y = pad;
          if (a.y > h - spriteSize - pad) a.y = Math.max(h - spriteSize - pad, 0);
        }
        // Allow overlapping — no separation logic
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pokemonOpen, user?.displayedPokemon]);
  return (
    <header
      className="relative bg-black/20 backdrop-blur-xl border-b border-white/10 px-3 py-1.5 flex items-center justify-between sticky top-0 z-40 shadow-2xl shadow-black/50 transition-[height] duration-300 ease-out"
      style={{ height: computedHeight }}
    >
      {/* Left Side: Logo/Brand */}
      <div className="flex items-center">
        <div className="flex items-center space-x-2">
          <div className="hidden sm:block">
            <h1 className="text-white/90 font-bold text-base tracking-tight leading-tight"></h1>
            <p className="text-white/40 text-[10px] font-medium -mt-0.5"></p>
          </div>
        </div>
      </div>

      {/* Center: Global Search Bar (hidden on very small screens) */}
      <div className="hidden xs:flex justify-center flex-1 mx-3 sm:mx-6">
        <div className="relative w-full max-w-md">
          <input
            type="search"
            placeholder="Search..."
            className="w-full bg-black/30 backdrop-blur-sm border border-white/20 text-white/90 placeholder-white/40 rounded-2xl py-2 pl-9 pr-4 focus:ring-2 focus:ring-primary/40 focus:border-primary/40 focus:outline-none transition-all duration-300 hover:bg-black/40 focus:bg-black/40 shadow-inner text-sm"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-white/50" />
          </div>
        </div>
      </div>

      {/* Right Side: Action Icons and User Profile */}
      <div className="flex items-center space-x-2">
        <button
          ref={mailButtonRef}
          className="p-2 rounded-xl text-white/60 hover:bg-white/10 hover:text-primary transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <Mail size={16} />
        </button>
        {/* Daily Drafts modal trigger */}
        <div className="relative">
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={dailyOpen}
            onClick={() => setDailyOpen((v) => !v)}
            onKeyDown={(e) => e.key === "Escape" && setDailyOpen(false)}
            title="Daily Drafts"
            className={`p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
              dailyOpen
                ? "bg-primary/20 text-primary hover:bg-primary/30"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <FileText size={16} />
          </button>
          {dailyOpen &&
            createPortal(
              <div className="fixed inset-0 z-[1000] flex items-center justify-center">
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/60" onClick={() => setDailyOpen(false)} />
                {/* Modal */}
                <div className="relative w-[min(92vw,900px)] max-h-[80vh] overflow-auto rounded-xl bg-black/85 backdrop-blur-xl border border-white/15 shadow-2xl p-4">
                  {/* Header with date and navigation */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        className="px-3 py-1.5 rounded border text-sm text-white hover:bg-white/10"
                        style={{ borderColor: "var(--color-primary)" }}
                        onClick={() => setDailyDateStr((s) => offsetDateStr(s, -1))}
                        title="Previous day"
                      >
                        ◀
                      </button>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-300">Date</label>
                        <input
                          type="date"
                          className="rounded border px-2 py-1 text-sm bg-[var(--color-background)] text-text-main"
                          style={{ borderColor: "var(--color-primary)" }}
                          value={dailyDateStr}
                          onChange={(e) => setDailyDateStr(e.target.value)}
                        />
                        <button
                          className="px-3 py-1.5 rounded border text-sm text-white hover:bg-white/10"
                          style={{ borderColor: "var(--color-primary)" }}
                          onClick={() => {
                            const d = new Date();
                            const y = d.getFullYear();
                            const m = String(d.getMonth() + 1).padStart(2, "0");
                            const day = String(d.getDate()).padStart(2, "0");
                            setDailyDateStr(`${y}-${m}-${day}`);
                          }}
                          title="Jump to today"
                        >
                          Today
                        </button>
                      </div>
                      <button
                        className="px-3 py-1.5 rounded border text-sm text-white hover:bg-white/10"
                        style={{ borderColor: "var(--color-primary)" }}
                        onClick={() => setDailyDateStr((s) => offsetDateStr(s, 1))}
                        title="Next day"
                      >
                        ▶
                      </button>
                    </div>
                    <button
                      className="px-3 py-1.5 rounded border text-sm text-white hover:bg-white/10"
                      style={{ borderColor: "var(--color-primary)" }}
                      onClick={() => setDailyOpen(false)}
                      title="Close"
                    >
                      Close
                    </button>
                  </div>
                  {/* Body */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Editor */}
                    <div className="md:col-span-2">
                      <div className="text-sm text-gray-300 mb-2">Write today's draft and save versions.</div>
                      <textarea
                        value={dailyContent}
                        onChange={(e) => setDailyContent(e.target.value)}
                        rows={12}
                        className="w-full rounded border p-3 text-base bg-[var(--color-background)] text-text-main focus:outline-none"
                        style={{ borderColor: "var(--color-primary)" }}
                        placeholder="Draft today's events here..."
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          onClick={() => {
                            if (!dailyDateStr) return;
                            saveDraft(dailyDateStr, dailyContent || "");
                            refreshDaily();
                          }}
                          className="inline-flex items-center gap-1 px-4 py-2 rounded border text-sm bg-primary/20 hover:bg-primary/30 text-white"
                          style={{ borderColor: "var(--color-primary)" }}
                        >
                          <Save className="w-4 h-4" /> Save New Version
                        </button>
                      </div>
                    </div>
                    {/* History / Other dates */}
                    <div>
                      <div className="text-sm text-gray-300 mb-2 flex items-center gap-2">
                        <History className="w-4 h-4 text-primary" /> {dailyHistory.length} version(s)
                      </div>
                      {dailyHistory.length === 0 ? (
                        <div className="text-sm text-gray-400 mb-2">No history for this date.</div>
                      ) : (
                        <ul className="space-y-2 max-h-[280px] overflow-auto pr-1">
                          {dailyHistory.map((v) => (
                            <li
                              key={v.ts}
                              className="rounded border p-2 text-sm"
                              style={{ borderColor: "var(--color-primary)" }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-gray-300">{new Date(v.ts).toLocaleString()}</div>
                                <div className="flex items-center gap-2">
                                  <button
                                    className="px-2 py-0.5 rounded border text-xs hover:bg-primary/20 text-white"
                                    style={{ borderColor: "var(--color-primary)" }}
                                    onClick={() => setDailyContent(v.content || "")}
                                  >
                                    Load
                                  </button>
                                  <button
                                    className="px-2 py-0.5 rounded border text-xs hover:bg-red-900/40 text-red-300"
                                    style={{ borderColor: "var(--color-primary)" }}
                                    onClick={() => {
                                      if (!confirm("Delete this version?")) return;
                                      deleteVersion(dailyDateStr, v.ts);
                                      refreshDaily();
                                    }}
                                  >
                                    <Trash2 className="inline-block w-3.5 h-3.5 mr-1" /> Delete
                                  </button>
                                </div>
                              </div>
                              <pre className="mt-1 text-xs whitespace-pre-wrap break-words text-white max-h-20 overflow-auto">
                                {v.content}
                              </pre>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-3">
                        <div className="text-sm text-gray-300 mb-1">Other dates</div>
                        {dailyAllDates.length === 0 ? (
                          <div className="text-sm text-gray-400">No saved drafts yet.</div>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-h-[120px] overflow-auto pr-1">
                            {dailyAllDates.map((d) => (
                              <button
                                key={d}
                                className={`px-2 py-0.5 rounded border text-xs hover:bg-primary/20 text-white ${
                                  d === dailyDateStr ? "bg-primary/10" : ""
                                }`}
                                style={{ borderColor: "var(--color-primary)" }}
                                onClick={() => setDailyDateStr(d)}
                                title={formatDate(d)}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>,
              document.body
            )}
        </div>
        {/* Team toggle - Poké Ball icon with popover */}
        <div
          className="relative"
          onMouseEnter={() => {
            if (teamHoverTimer.current) {
              clearTimeout(teamHoverTimer.current);
              teamHoverTimer.current = null;
            }
          }}
          onMouseLeave={() => {
            teamHoverTimer.current = setTimeout(() => setPokemonOpen(false), 150);
          }}
        >
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={pokemonOpen}
            onClick={() => setPokemonOpen((v) => !v)}
            onKeyDown={(e) => e.key === "Escape" && setPokemonOpen(false)}
            title={pokemonOpen ? "Hide Pokémon team" : "Show Pokémon team"}
            className={`p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
              pokemonOpen
                ? "bg-primary/20 text-primary hover:bg-primary/30"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {/* Pokéball icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M12 3a9 9 0 0 0-8.485 6h4.146a4.5 4.5 0 0 1 8.678 0h4.146A9 9 0 0 0 12 3Zm0 18a9 9 0 0 0 8.485-6h-4.146a4.5 4.5 0 0 1-8.678 0H3.515A9 9 0 0 0 12 21Zm0-12a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
                fill="currentColor"
              />
            </svg>
          </button>
          {pokemonOpen && (
            <div
              role="dialog"
              aria-label="Pokémon Team"
              className="absolute right-0 mt-2 z-50"
              onMouseEnter={() => {
                if (teamHoverTimer.current) {
                  clearTimeout(teamHoverTimer.current);
                  teamHoverTimer.current = null;
                }
              }}
              onMouseLeave={() => {
                teamHoverTimer.current = setTimeout(() => setPokemonOpen(false), 150);
              }}
            >
              <div className="rounded-xl bg-black/85 backdrop-blur-xl border border-white/15 shadow-2xl p-2">
                {/* Responsive moving field */}
                <div className="relative w-[85vw] sm:w-[400px] h-[300px] overflow-hidden" ref={containerRef}>
                  {(user?.displayedPokemon || []).slice(0, 6).map((p, idx) => {
                    const base = p?.basePokemon;
                    const sprite = getPokemonSprite(base);
                    if (!sprite) return null;
                    const actor = actors[idx];
                    const x = actor?.x ?? 0;
                    const y = actor?.y ?? 0;
                    const vx = actor?.vx ?? 0.8;
                    const mirrorOnRight = vx > 0; // mirror when moving right
                    return (
                      <img
                        key={actor?.key || p?._id || base?._id || idx}
                        src={sprite}
                        alt={base?.name || "Pokemon"}
                        height={spriteSize}
                        className="pointer-events-none"
                        style={{
                          position: "absolute",
                          left: x,
                          top: y,
                          height: spriteSize,
                          width: "auto",
                          transform: mirrorOnRight ? "scaleX(-1)" : "none",
                          transformOrigin: "center",
                          imageRendering: "auto",
                          filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.5))",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Yearly Goals Tracker */}
        <div
          className="relative"
          onMouseEnter={() => {
            if (goalsHoverTimer.current) {
              clearTimeout(goalsHoverTimer.current);
              goalsHoverTimer.current = null;
            }
            setGoalsOpen(true);
          }}
          onMouseLeave={() => {
            goalsHoverTimer.current = setTimeout(() => setGoalsOpen(false), 200);
          }}
        >
          <Link
            to="/goals"
            className="relative p-2 block rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 group"
            title="Yearly Goals Tracker"
            onClick={() => setGoalsOpen(false)} // Close popover if navigating directly
          >
            <Target size={18} />
            {goalProgress > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-black border border-black shadow-sm group-hover:bg-emerald-400">
                {goalProgress < 100 ? goalProgress : "!"}
              </span>
            )}
          </Link>
          {goalsOpen && (
            <div
              role="dialog"
              aria-label="Yearly Goals"
              className="absolute right-0 mt-2 z-50 w-[300px]"
              onMouseEnter={() => {
                if (goalsHoverTimer.current) {
                  clearTimeout(goalsHoverTimer.current);
                  goalsHoverTimer.current = null;
                }
                setGoalsOpen(true);
              }}
              onMouseLeave={() => {
                goalsHoverTimer.current = setTimeout(() => setGoalsOpen(false), 200);
              }}
            >
              <div className="rounded-xl bg-black/85 backdrop-blur-xl border border-white/15 shadow-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h3 className="font-bold text-white text-sm">Yearly Targets</h3>
                  <span className="text-xs text-emerald-400 font-medium">{goalProgress}% Overall</span>
                </div>
                {goals.length === 0 ? (
                  <div className="text-xs text-slate-400 py-2">No goals set yet.</div>
                ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                        {goals.map((g, i) => {
                            const pct = Math.min(100, Math.round((g.current / g.target) * 100));
                            const isCompleted = g.current >= g.target;
                            const isEditing = customIncrement.index === i;

                            return (
                                <div key={i} className="space-y-1 group/item">
                                    <div className="flex justify-between text-xs items-center h-8">
                                        <span className="text-white/90 truncate pr-2 flex-1 font-medium">{g.name}</span>
                                        {isEditing ? (
                                            <div className="flex items-center gap-1 bg-black/60 rounded px-1.5 py-0.5 border border-white/20 animate-in fade-in zoom-in duration-200" onClick={(e) => e.preventDefault()}>
                                                <input 
                                                    type="number" 
                                                    className="w-12 bg-transparent text-white text-right focus:outline-none text-sm appearance-none font-bold placeholder-white/20"
                                                    value={customIncrement.val}
                                                    onChange={(e) => setCustomIncrement(prev => ({...prev, val: e.target.value}))}
                                                    placeholder="#"
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                    onKeyDown={(e) => {
                                                        if(e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleUpdateGoal(i, customIncrement.val);
                                                            setCustomIncrement({index: null, val: ""});
                                                        }
                                                    }}
                                                />
                                                <button onClick={(e) => {
                                                     e.preventDefault();
                                                     handleUpdateGoal(i, customIncrement.val);
                                                     setCustomIncrement({index: null, val: ""});
                                                }} className="w-6 h-6 flex items-center justify-center text-emerald-400 hover:text-emerald-300 hover:bg-white/10 rounded"><Check size={16} /></button>
                                                <button onClick={(e) => {
                                                    e.preventDefault();
                                                    setCustomIncrement({index: null, val: ""});
                                                }} className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-white/10 rounded"><X size={16} /></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400 text-[10px] font-mono tracking-tighter">{g.current}/{g.target}</span>
                                                {!isCompleted && (
                                                    <div className="flex gap-1.5 opacity-0 group-hover/item:opacity-100 transition-all duration-200">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleUpdateGoal(i, 1);
                                                            }}
                                                            className="w-7 h-7 flex items-center justify-center rounded-md bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black hover:border-emerald-400 transition-all text-emerald-400 shadow-sm"
                                                            title="Quick Add +1"
                                                        >
                                                            <Plus size={16} strokeWidth={2.5} />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setCustomIncrement({ index: i, val: "" });
                                                            }}
                                                            className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 border border-white/10 hover:bg-blue-500 hover:text-white hover:border-blue-400 transition-all text-slate-400 shadow-sm"
                                                            title="Add Custom Amount"
                                                        >
                                                            <Hash size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
                <div className="pt-2 border-t border-white/10">
                  <Link
                    to="/goals"
                    className="block w-full text-center py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-white rounded transition-colors"
                  >
                    View All Goals
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Calendar icon and popover - placed to the right of the Pokémon icon */}
        <div
          className="relative"
          onMouseEnter={() => {
            if (calendarHoverTimer.current) {
              clearTimeout(calendarHoverTimer.current);
              calendarHoverTimer.current = null;
            }
            setCalendarOpen(true);
          }}
          onMouseLeave={() => {
            calendarHoverTimer.current = setTimeout(() => setCalendarOpen(false), 120);
          }}
        >
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={calendarOpen}
            onClick={() => setCalendarOpen((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setCalendarOpen(false);
            }}
            title="Show calendar"
            className="p-2 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <CalendarDays size={16} />
          </button>
          {calendarOpen && (
            <div
              role="dialog"
              aria-label="Calendar"
              className="absolute right-0 mt-2 z-50 w-[85vw] sm:w-[400px]"
              onMouseEnter={() => {
                if (calendarHoverTimer.current) {
                  clearTimeout(calendarHoverTimer.current);
                  calendarHoverTimer.current = null;
                }
                setCalendarOpen(true);
              }}
              onMouseLeave={() => {
                calendarHoverTimer.current = setTimeout(() => setCalendarOpen(false), 120);
              }}
            >
              {/* Using the full CalendarWidget inside a lightweight container */}
              <div className="rounded-xl bg-black/85 backdrop-blur-xl border border-white/15 shadow-2xl p-2">
                <CalendarWidget />
              </div>
            </div>
          )}
        </div>
        <div className="h-6 w-px bg-white/15"></div>
        <div
          className="relative group"
          onMouseEnter={() => setPersonaDropdownOpen(true)}
          onMouseLeave={() => setPersonaDropdownOpen(false)}
        >
          <button
            ref={personaButtonRef}
            className="flex items-center space-x-2 px-2 py-1 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
          >
            <div className="relative w-8 h-8 sm:w-9 sm:h-9">
              <img
                src={
                  user?.profilePicture
                    ? `${serverBaseUrl}${user.profilePicture}`
                    : `https://api.dicebear.com/8.x/pixel-art/svg?seed=${user?.username || "user"}`
                }
                alt="User Avatar"
                className="w-full h-full rounded-full object-cover border border-primary/40 shadow-md shadow-primary/20 ring-1 ring-primary/10"
                style={{ filter: "drop-shadow(0 0 4px rgba(45, 212, 191, 0.25))" }}
              />
            </div>
            <div className="hidden md:block text-left leading-tight">
              <span className="text-xs font-medium block -mb-0.5">{user?.username || "User"}</span>
              <span className="text-[10px] text-white/40">Admin</span>
            </div>
          </button>
          <div
            className={`absolute right-0 mt-2 w-56 bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden transition-all duration-300 ${
              personaDropdownOpen ? "opacity-100 visible" : "opacity-0 invisible"
            }`}
          >
            <div className="py-2">
              {/* Persona Selector Dropdown */}
              <div className="border-b border-white/10 pb-2 mb-2">
                <div className="px-4 py-2 text-xs text-white/60 font-semibold">Persona Selector</div>
                <button
                  onClick={() => handleSelectPersona(null)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-all duration-200 border-b border-gray-700 last:border-b-0 ${
                    !activePersonaId ? "bg-primary/20" : ""
                  }`}
                >
                  <span className="text-sm font-bold text-text-main">Standard Issue</span>
                  {!activePersonaId && <span className="text-primary text-xs ml-2">●</span>}
                </button>
                {unlockedPersonas.map((persona) => {
                  const isActive = activePersonaId === persona._id;
                  return (
                    <button
                      key={persona._id}
                      onClick={() => handleSelectPersona(persona._id)}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-all duration-200 border-b border-gray-700 last:border-b-0 ${
                        isActive ? "bg-opacity-20" : ""
                      }`}
                      style={{ backgroundColor: isActive ? `${persona.colors?.primary}20` : "" }}
                    >
                      <span className="text-sm font-bold text-text-main">{persona.name}</span>
                      {isActive && (
                        <span className="text-xs ml-2" style={{ color: persona.colors?.primary || "#2DD4BF" }}>
                          ●
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <Link
                to="/profile"
                className="flex items-center w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200"
              >
                <User size={16} className="mr-3 text-primary/80" />
                Profile Settings
              </Link>
              <div className="mx-4 my-2 h-px bg-white/10"></div>
              <button
                onClick={logout}
                className="w-full flex items-center px-4 py-3 text-sm text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
              >
                <LogOut size={16} className="mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Pokémon sprites moved to popover above; no full-header overlay */}
    </header>
  );
};

export default Header;
