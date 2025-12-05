import { useEffect, useMemo, useState } from "react";
import Widget from "../components/ui/Widget";
import { Save, History, Trash2, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { listDates, getHistory, getLatest, saveDraft, deleteVersion, formatDate } from "../services/dailyDraftsService";

function toYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Parse a YYYY-MM-DD as a local Date (avoid UTC parsing quirks)
function parseYMD(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return new Date();
  const [y, m, d] = dateStr.split("-").map((v) => parseInt(v, 10));
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d, 12, 0, 0, 0); // noon to avoid DST edge cases
}

const DailyDraftsPage = () => {
  const [dateStr, setDateStr] = useState(() => toYMD(new Date()));
  const [content, setContent] = useState("");
  const [history, setHistory] = useState([]);
  const [allDates, setAllDates] = useState([]);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth()); // 0-11

  const humanDate = useMemo(() => formatDate(dateStr), [dateStr]);

  const refresh = () => {
    setAllDates(listDates());
    setHistory(getHistory(dateStr));
    const latest = getLatest(dateStr);
    setContent(latest ? latest.content : "");
  };

  useEffect(() => {
    refresh();
    // keep calendar in sync with selected date's month (use local parse)
    try {
      const d = parseYMD(dateStr);
      setCalYear(d.getFullYear());
      setCalMonth(d.getMonth());
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr]);

  const handleSave = () => {
    if (!dateStr) return;
    saveDraft(dateStr, content || "");
    refresh();
  };

  const handleLoadVersion = (v) => {
    setContent(v.content || "");
  };

  const handleDeleteVersion = (v) => {
    if (!confirm("Delete this version?")) return;
    deleteVersion(dateStr, v.ts);
    refresh();
  };

  // Navigation helpers
  const goPrevDay = () => {
    const d = parseYMD(dateStr);
    d.setDate(d.getDate() - 1);
    setDateStr(toYMD(d));
  };
  const goNextDay = () => {
    const d = parseYMD(dateStr);
    d.setDate(d.getDate() + 1);
    setDateStr(toYMD(d));
  };
  const allDatesSet = useMemo(() => new Set(allDates), [allDates]);

  // Calendar grid for calYear/calMonth
  const buildCalendar = () => {
    const first = new Date(calYear, calMonth, 1);
    const startDay = (first.getDay() + 6) % 7; // make Monday=0
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const prevMonthDays = new Date(calYear, calMonth, 0).getDate();
    const cells = [];
    // Leading days from previous month
    for (let i = startDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const d = new Date(calYear, calMonth - 1, day);
      cells.push({ d, inMonth: false });
    }
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(calYear, calMonth, day);
      cells.push({ d, inMonth: true });
    }
    // Trailing days to fill 6x7 = 42 cells
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].d;
      const d = new Date(last);
      d.setDate(d.getDate() + 1);
      cells.push({ d, inMonth: false });
    }
    while (cells.length < 42) {
      const last = cells[cells.length - 1].d;
      const d = new Date(last);
      d.setDate(d.getDate() + 1);
      cells.push({ d, inMonth: false });
    }
    return cells;
  };
  const calCells = useMemo(buildCalendar, [calYear, calMonth]);

  return (
    <div className="space-y-3 min-w-0">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" /> Daily Drafts
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Editor */}
        <Widget title={`Draft for ${humanDate}`} className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs text-text-secondary">Date</label>
            <div className="inline-flex items-center gap-1">
              <button
                className="p-1 rounded border hover:bg-white/5"
                style={{ borderColor: "var(--color-primary)" }}
                onClick={goPrevDay}
                title="Previous day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                className="rounded border px-2 py-1 text-xs bg-[var(--color-background)]"
                style={{ borderColor: "var(--color-primary)" }}
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
              />
              <button
                className="p-1 rounded border hover:bg-white/5"
                style={{ borderColor: "var(--color-primary)" }}
                onClick={goNextDay}
                title="Next day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="text-[11px] text-text-tertiary">Each day starts a new text entry and logs the date.</div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={18}
            className="w-full rounded border p-2 text-sm bg-[var(--color-background)] focus:outline-none"
            style={{ borderColor: "var(--color-primary)" }}
            placeholder="Draft today's events here..."
          />

          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded border text-xs bg-primary/20 hover:bg-primary/30"
              style={{ borderColor: "var(--color-primary)" }}
            >
              <Save className="w-4 h-4" /> Save New Version
            </button>
          </div>
        </Widget>

        {/* History + Calendar */}
        <Widget title="History" className="lg:col-span-1">
          {/* Calendar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-text-secondary">
                {new Date(calYear, calMonth, 1).toLocaleString(undefined, { month: "long", year: "numeric" })}
              </div>
              <div className="inline-flex items-center gap-1">
                <button
                  className="p-1 rounded border hover:bg-white/5"
                  style={{ borderColor: "var(--color-primary)" }}
                  onClick={() => {
                    const d = new Date(calYear, calMonth, 1);
                    d.setMonth(d.getMonth() - 1);
                    setCalYear(d.getFullYear());
                    setCalMonth(d.getMonth());
                  }}
                  title="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  className="p-1 rounded border hover:bg-white/5"
                  style={{ borderColor: "var(--color-primary)" }}
                  onClick={() => {
                    const d = new Date(calYear, calMonth, 1);
                    d.setMonth(d.getMonth() + 1);
                    setCalYear(d.getFullYear());
                    setCalMonth(d.getMonth());
                  }}
                  title="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-[10px] text-text-tertiary mb-1">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="text-center">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calCells.map(({ d, inMonth }, idx) => {
                const ymd = toYMD(d);
                const isSelected = ymd === dateStr;
                const hasDraft = allDatesSet.has(ymd);
                return (
                  <button
                    key={`${ymd}-${idx}`}
                    className={`relative aspect-square rounded border text-[11px] flex items-center justify-center transition ${
                      isSelected ? "bg-primary/20" : "hover:bg-white/5"
                    } ${inMonth ? "" : "opacity-40"}`}
                    style={{ borderColor: "var(--color-primary)" }}
                    onClick={() => setDateStr(ymd)}
                    title={`${formatDate(ymd)}${hasDraft ? " • Has draft" : ""}`}
                  >
                    {d.getDate()}
                    {hasDraft && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="text-[11px] text-text-secondary mb-2 flex items-center gap-2">
            <History className="w-4 h-4 text-primary" /> {history.length} version(s)
          </div>
          {history.length === 0 ? (
            <div className="text-[12px] text-text-tertiary">No history for this date. Save a new version.</div>
          ) : (
            <ul className="space-y-2 max-h-[520px] overflow-auto pr-1">
              {history.map((v) => (
                <li key={v.ts} className="rounded border p-2 text-xs" style={{ borderColor: "var(--color-primary)" }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-text-secondary">{new Date(v.ts).toLocaleString()}</div>
                    <div className="flex items-center gap-2">
                      <button
                        className="px-2 py-0.5 rounded border text-[11px] hover:bg-primary/20"
                        style={{ borderColor: "var(--color-primary)" }}
                        onClick={() => handleLoadVersion(v)}
                      >
                        Load
                      </button>
                      <button
                        className="px-2 py-0.5 rounded border text-[11px] hover:bg-red-900/40 text-red-300"
                        style={{ borderColor: "var(--color-primary)" }}
                        onClick={() => handleDeleteVersion(v)}
                      >
                        <Trash2 className="inline-block w-3.5 h-3.5 mr-1" /> Delete
                      </button>
                    </div>
                  </div>
                  <pre className="mt-1 text-[11px] whitespace-pre-wrap break-words text-text-main max-h-24 overflow-auto">
                    {v.content}
                  </pre>
                </li>
              ))}
            </ul>
          )}

          {/* Other dates quick list */}
          <div className="mt-3">
            <div className="text-[11px] text-text-secondary mb-1">Other dates</div>
            {allDates.length === 0 ? (
              <div className="text-[12px] text-text-tertiary">No saved drafts yet.</div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {allDates.map((d) => (
                  <button
                    key={d}
                    className={`px-2 py-0.5 rounded border text-[11px] hover:bg-primary/20 ${
                      d === dateStr ? "bg-primary/10" : ""
                    }`}
                    style={{ borderColor: "var(--color-primary)" }}
                    onClick={() => setDateStr(d)}
                    title={formatDate(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Widget>
      </div>
    </div>
  );
};

export default DailyDraftsPage;
