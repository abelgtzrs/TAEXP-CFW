import { useEffect, useMemo, useState } from "react";

// Simple monthly grid calendar that accepts items [{date, title, color, type, amount}]
export default function MonthlyCalendar({ year, month, items = [], onQuickAdd }) {
  // month is 1-12
  const firstDay = useMemo(() => new Date(year, month - 1, 1), [year, month]);
  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
  const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Mon=0..Sun=6

  const grid = [];
  for (let i = 0; i < startDayOfWeek; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);

  const itemsByDay = useMemo(() => {
    const map = new Map();
    items.forEach((it) => {
      const dt = new Date(it.date);
      const day = dt.getDate();
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(it);
    });
    return map;
  }, [items]);

  const isToday = (day) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;
  };

  const firstDayWithItems = useMemo(() => {
    for (let d = 1; d <= daysInMonth; d++) {
      if ((itemsByDay.get(d) || []).length > 0) return d;
    }
    return null;
  }, [daysInMonth, itemsByDay]);

  const initialSelectedDay = useMemo(() => {
    const today = new Date();
    if (today.getFullYear() === year && today.getMonth() + 1 === month) return today.getDate();
    return firstDayWithItems || 1;
  }, [firstDayWithItems, month, year]);

  const [selectedDay, setSelectedDay] = useState(initialSelectedDay);

  useEffect(() => {
    setSelectedDay(initialSelectedDay);
  }, [initialSelectedDay]);

  const selectedItems = useMemo(() => itemsByDay.get(selectedDay) || [], [itemsByDay, selectedDay]);

  const totalMonthItems = useMemo(() => items.length, [items]);
  const totalDaysWithItems = useMemo(() => {
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      if ((itemsByDay.get(d) || []).length > 0) count += 1;
    }
    return count;
  }, [daysInMonth, itemsByDay]);

  const formatItemLine = (it) => (it.type === "bill" ? `${it.title} $${it.amount}` : it.title);

  const triggerQuickAdd = (action) => {
    if (!onQuickAdd) return;
    onQuickAdd({ action, year, month, day: selectedDay });
  };

  const daysWithItems = useMemo(() => {
    const rows = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const list = itemsByDay.get(d) || [];
      if (list.length > 0) rows.push({ day: d, list });
    }
    return rows;
  }, [daysInMonth, itemsByDay]);

  return (
    <div
      className="rounded-2xl border border-primary/30 shadow-sm overflow-hidden"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-primary)" }}
    >
      <div className="px-3 sm:px-4 pt-3 pb-2 border-b border-primary/25 bg-[color-mix(in_srgb,var(--color-surface),var(--color-primary)_8%)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-text-secondary font-semibold">
              Month Snapshot
            </div>
            <div className="text-sm font-semibold text-text-main mt-1">
              {totalMonthItems} entries across {totalDaysWithItems} day(s)
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-[0.12em] text-text-secondary">Selected Day</div>
            <div className="text-base font-bold text-primary">{selectedDay}</div>
          </div>
        </div>
      </div>

      <div
        className="grid grid-cols-7 text-center text-[10px] sm:text-xs uppercase px-2 pt-2"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayLabel) => (
          <div key={dayLabel} className="px-1 py-1.5 font-semibold tracking-wide">
            <span className="hidden sm:inline">{dayLabel}</span>
            <span className="sm:hidden">{dayLabel.slice(0, 1)}</span>
          </div>
        ))}
      </div>

      <div
        className="grid grid-cols-7 gap-px p-2"
        style={{ backgroundColor: "var(--color-background)", opacity: 0.82 }}
      >
        {grid.map((day, idx) => {
          const todayDay = day ? isToday(day) : false;
          const dayItems = day ? itemsByDay.get(day) || [] : [];
          const isSelected = !!day && selectedDay === day;

          if (!day) {
            return (
              <div
                key={idx}
                className="min-h-[70px] sm:min-h-[70px] rounded"
                style={{ backgroundColor: "var(--color-background)" }}
              />
            );
          }

          return (
            <button
              type="button"
              key={idx}
              onClick={() => setSelectedDay(day)}
              className={`min-h-[70px] sm:min-h-[100px] p-1.5 sm:p-2 rounded text-left transition-all duration-200 ${
                isSelected ? "ring-2 ring-primary/70 bg-primary/15" : "hover:bg-primary/10"
              } ${todayDay ? "outline outline-1 outline-primary/60" : ""}`}
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div
                    className={`text-[11px] sm:text-xs ${todayDay ? "font-bold text-primary" : "text-text-secondary"}`}
                  >
                    {todayDay ? "Today" : ""}
                  </div>
                  <div
                    className={`text-right text-[11px] sm:text-xs ${isSelected ? "font-bold text-text-main" : "text-text-secondary"}`}
                  >
                    {day}
                  </div>
                </div>

                <div className="hidden sm:block mt-1.5 space-y-1">
                  {dayItems.slice(0, 2).map((it, i) => (
                    <div
                      key={i}
                      className="px-2 py-2 rounded text-[11px] truncate"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${it.color || "var(--color-primary)"}, transparent 72%)`,
                        color: "var(--color-text-main)",
                      }}
                    >
                      {formatItemLine(it)}
                    </div>
                  ))}
                  {dayItems.length > 2 && (
                    <div className="text-[10px] text-text-secondary">+{dayItems.length - 2} more</div>
                  )}
                </div>

                <div className="sm:hidden mt-2 flex items-center justify-end">
                  {dayItems.length > 0 ? (
                    <span className="inline-flex min-w-4 h-4 px-1 rounded-full bg-primary/30 text-[10px] font-semibold text-text-main items-center justify-center">
                      {dayItems.length}
                    </span>
                  ) : (
                    <span className="inline-flex min-w-1.5 h-1.5 rounded-full bg-text-secondary/35" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="hidden sm:block border-t border-primary/25 p-3 bg-[var(--color-bg)]">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-text-secondary">Day Details</div>
          <div className="text-sm font-semibold text-text-main">Day {selectedDay}</div>
        </div>
        <div className="mb-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => triggerQuickAdd("bill")}
            className="rounded-lg border border-primary/40 bg-primary/15 px-2 py-1.5 text-[11px] font-semibold text-text-main hover:bg-primary/25 transition"
          >
            + Monthly Bill
          </button>
          <button
            type="button"
            onClick={() => triggerQuickAdd("event")}
            className="rounded-lg border border-primary/40 bg-primary/15 px-2 py-1.5 text-[11px] font-semibold text-text-main hover:bg-primary/25 transition"
          >
            + One-Time Event
          </button>
          <button
            type="button"
            onClick={() => triggerQuickAdd("yearly")}
            className="rounded-lg border border-primary/40 bg-primary/15 px-2 py-1.5 text-[11px] font-semibold text-text-main hover:bg-primary/25 transition"
          >
            + Yearly Event
          </button>
        </div>
        {selectedItems.length === 0 ? (
          <div className="rounded-xl border border-primary/25 bg-[var(--color-surface)] p-3 text-sm text-text-secondary">
            No entries for this day.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
            {selectedItems.map((it, i) => (
              <div
                key={`${selectedDay}-${i}`}
                className="rounded-xl border border-primary/25 bg-[var(--color-surface)] p-2.5"
              >
                <div className="text-sm font-semibold text-text-main truncate">{it.title}</div>
                <div className="text-xs text-text-secondary mt-1">
                  {it.type === "bill" ? `Bill • $${it.amount}` : it.type || "Event"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile agenda list */}
      <div className="sm:hidden border-t border-primary/25 px-3 py-3 bg-[var(--color-bg)]">
        <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-text-secondary mb-2">
          Day {selectedDay} Agenda
        </div>
        <div className="mb-3 grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => triggerQuickAdd("bill")}
            className="rounded-lg border border-primary/40 bg-primary/15 px-3 py-2 text-xs font-semibold text-text-main text-left hover:bg-primary/25 transition"
          >
            + Add Monthly Bill
          </button>
          <button
            type="button"
            onClick={() => triggerQuickAdd("event")}
            className="rounded-lg border border-primary/40 bg-primary/15 px-3 py-2 text-xs font-semibold text-text-main text-left hover:bg-primary/25 transition"
          >
            + Add One-Time Event
          </button>
          <button
            type="button"
            onClick={() => triggerQuickAdd("yearly")}
            className="rounded-lg border border-primary/40 bg-primary/15 px-3 py-2 text-xs font-semibold text-text-main text-left hover:bg-primary/25 transition"
          >
            + Add Yearly Event
          </button>
        </div>
        {selectedItems.length === 0 ? (
          <div className="text-xs text-text-secondary">No scheduled items for this day.</div>
        ) : (
          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {selectedItems.map((it, i) => (
              <div
                key={`${selectedDay}-${i}`}
                className="rounded-xl border border-primary/25 bg-[var(--color-surface)] p-2.5"
              >
                <div className="text-xs font-semibold text-text-main truncate">{it.title}</div>
                <div className="text-[11px] text-text-secondary mt-1">
                  {it.type === "bill" ? `Bill • $${it.amount}` : it.type || "Event"}
                </div>
              </div>
            ))}
          </div>
        )}

        {daysWithItems.length > 0 && (
          <div className="mt-3 pt-3 border-t border-primary/20">
            <div className="text-[10px] uppercase tracking-[0.13em] text-text-secondary mb-2">Quick Jump</div>
            <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
              {daysWithItems.map(({ day, list }) => (
                <button
                  key={`jump-${day}`}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`px-2 py-1 rounded-lg text-[11px] border transition ${
                    selectedDay === day
                      ? "border-primary/45 bg-primary/20 text-text-main"
                      : "border-primary/25 bg-[var(--color-surface)] text-text-secondary"
                  }`}
                >
                  {day} ({list.length})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
