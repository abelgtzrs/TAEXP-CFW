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

  const normalizeAmount = (amount) => {
    const value = Number(amount);
    return Number.isFinite(value) ? value : 0;
  };

  const formatMoney = (amount) => `$${normalizeAmount(amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  const totalMonthBills = useMemo(() => {
    let count = 0;
    items.forEach((it) => {
      if (it.type === "bill") count += 1;
    });
    return count;
  }, [items]);

  const totalMonthBillAmount = useMemo(() => {
    let total = 0;
    items.forEach((it) => {
      if (it.type === "bill") total += normalizeAmount(it.amount);
    });
    return total;
  }, [items]);

  const selectedDayBillCount = useMemo(() => {
    let count = 0;
    selectedItems.forEach((it) => {
      if (it.type === "bill") count += 1;
    });
    return count;
  }, [selectedItems]);

  const triggerQuickAdd = (action) => {
    if (!onQuickAdd) return;
    onQuickAdd({ action, year, month, day: selectedDay });
  };

  const daysWithItems = useMemo(() => {
    const rows = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const list = itemsByDay.get(d) || [];
      if (list.length > 0) {
        let billCount = 0;
        list.forEach((it) => {
          if (it.type === "bill") billCount += 1;
        });
        rows.push({ day: d, list, billCount });
      }
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
            {totalMonthBills > 0 ? (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-rose-400/50 bg-rose-500/20 px-2.5 py-1 text-[11px] font-semibold text-text-main">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                <span>
                  {totalMonthBills} bill{totalMonthBills > 1 ? "s" : ""}
                </span>
                <span className="rounded-full bg-rose-500/35 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {formatMoney(totalMonthBillAmount)}
                </span>
              </div>
            ) : (
              <div className="mt-2 text-[11px] text-text-secondary">No bills due this month</div>
            )}
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
          const dayBillCount = dayItems.reduce((count, it) => (it.type === "bill" ? count + 1 : count), 0);
          const hiddenBillCount = dayItems.slice(2).reduce((count, it) => (it.type === "bill" ? count + 1 : count), 0);
          const hasBills = dayBillCount > 0;
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
                isSelected
                  ? hasBills
                    ? "ring-2 ring-rose-400/80 bg-rose-500/15"
                    : "ring-2 ring-primary/70 bg-primary/15"
                  : hasBills
                    ? "hover:bg-rose-500/12"
                    : "hover:bg-primary/10"
              } ${todayDay ? "outline outline-1 outline-primary/60" : ""} ${hasBills ? "border border-rose-400/35" : ""}`}
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div
                    className={`text-[11px] sm:text-xs ${
                      todayDay
                        ? "font-bold text-primary"
                        : hasBills
                          ? "font-semibold text-rose-100"
                          : "text-text-secondary"
                    }`}
                  >
                    {todayDay ? "Today" : hasBills ? `${dayBillCount} bill${dayBillCount > 1 ? "s" : ""}` : ""}
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
                      className={`px-2 py-2 rounded text-[11px] border ${
                        it.type === "bill" ? "border-rose-400/55 shadow-sm" : "border-primary/20"
                      }`}
                      style={{
                        backgroundColor:
                          it.type === "bill"
                            ? "color-mix(in srgb, #fb7185, var(--color-surface) 65%)"
                            : `color-mix(in srgb, ${it.color || "var(--color-primary)"}, transparent 72%)`,
                        color: "var(--color-text-main)",
                      }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate font-semibold">{it.title}</span>
                        {it.type === "bill" && (
                          <span className="shrink-0 rounded-full bg-rose-500 px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wide text-white">
                            Bill
                          </span>
                        )}
                      </div>
                      {it.type === "bill" && (
                        <div className="mt-1 text-[10px] font-bold text-rose-100">{formatMoney(it.amount)}</div>
                      )}
                    </div>
                  ))}
                  {dayItems.length > 2 && (
                    <div className="text-[10px] text-text-secondary">
                      +{dayItems.length - 2} more
                      {hiddenBillCount > 0 ? ` (${hiddenBillCount} bill${hiddenBillCount > 1 ? "s" : ""})` : ""}
                    </div>
                  )}
                </div>

                <div className="sm:hidden mt-2 flex items-center justify-end">
                  {dayItems.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <span className="inline-flex min-w-4 h-4 px-1 rounded-full bg-primary/30 text-[10px] font-semibold text-text-main items-center justify-center">
                        {dayItems.length}
                      </span>
                      {dayBillCount > 0 && (
                        <span className="inline-flex min-w-5 h-4 px-1 rounded-full bg-rose-500/90 text-[10px] font-semibold text-white items-center justify-center">
                          B{dayBillCount}
                        </span>
                      )}
                    </div>
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
          <div className="text-right">
            <div className="text-sm font-semibold text-text-main">Day {selectedDay}</div>
            {selectedDayBillCount > 0 && (
              <div className="mt-1 inline-flex items-center rounded-full border border-rose-400/45 bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                {selectedDayBillCount} bill{selectedDayBillCount > 1 ? "s" : ""} due
              </div>
            )}
          </div>
        </div>
        <div className="mb-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => triggerQuickAdd("bill")}
            className="rounded-lg border border-rose-400/60 bg-rose-500/20 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-rose-500/30 transition"
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
                className={`rounded-xl border p-2.5 ${
                  it.type === "bill"
                    ? "border-rose-400/55 shadow-[0_0_0_1px_rgba(251,113,133,0.25)]"
                    : "border-primary/25"
                }`}
                style={{
                  backgroundColor:
                    it.type === "bill"
                      ? "color-mix(in srgb, #fb7185, var(--color-surface) 78%)"
                      : "var(--color-surface)",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold text-text-main truncate">{it.title}</div>
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                      it.type === "bill" ? "bg-rose-500/90 text-white" : "bg-primary/20 text-text-main"
                    }`}
                  >
                    {it.type === "bill" ? "Bill" : it.type || "Event"}
                  </span>
                </div>
                {it.type === "bill" ? (
                  <div className="mt-1.5 text-sm font-bold text-rose-100">{formatMoney(it.amount)}</div>
                ) : (
                  <div className="text-xs text-text-secondary mt-1">Scheduled {it.type || "event"}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile agenda list */}
      <div className="sm:hidden border-t border-primary/25 px-3 py-3 bg-[var(--color-bg)]">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-text-secondary">
            Day {selectedDay} Agenda
          </div>
          {selectedDayBillCount > 0 && (
            <div className="inline-flex items-center rounded-full border border-rose-400/45 bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-white">
              {selectedDayBillCount} bill{selectedDayBillCount > 1 ? "s" : ""}
            </div>
          )}
        </div>
        <div className="mb-3 grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => triggerQuickAdd("bill")}
            className="rounded-lg border border-rose-400/60 bg-rose-500/20 px-3 py-2 text-xs font-semibold text-white text-left hover:bg-rose-500/30 transition"
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
                className={`rounded-xl border p-2.5 ${
                  it.type === "bill"
                    ? "border-rose-400/55 shadow-[0_0_0_1px_rgba(251,113,133,0.25)]"
                    : "border-primary/25"
                }`}
                style={{
                  backgroundColor:
                    it.type === "bill"
                      ? "color-mix(in srgb, #fb7185, var(--color-surface) 78%)"
                      : "var(--color-surface)",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-semibold text-text-main truncate">{it.title}</div>
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${
                      it.type === "bill" ? "bg-rose-500/90 text-white" : "bg-primary/20 text-text-main"
                    }`}
                  >
                    {it.type === "bill" ? "Bill" : it.type || "Event"}
                  </span>
                </div>
                {it.type === "bill" ? (
                  <div className="mt-1 text-xs font-bold text-rose-100">{formatMoney(it.amount)}</div>
                ) : (
                  <div className="text-[11px] text-text-secondary mt-1">Scheduled {it.type || "event"}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {daysWithItems.length > 0 && (
          <div className="mt-3 pt-3 border-t border-primary/20">
            <div className="text-[10px] uppercase tracking-[0.13em] text-text-secondary mb-2">Quick Jump</div>
            <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
              {daysWithItems.map(({ day, list, billCount }) => (
                <button
                  key={`jump-${day}`}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`px-2 py-1 rounded-lg text-[11px] border transition ${
                    selectedDay === day
                      ? billCount > 0
                        ? "border-rose-400/60 bg-rose-500/25 text-text-main"
                        : "border-primary/45 bg-primary/20 text-text-main"
                      : billCount > 0
                        ? "border-rose-300/55 bg-rose-500/10 text-text-main"
                        : "border-primary/25 bg-[var(--color-surface)] text-text-secondary"
                  }`}
                >
                  {day} ({list.length}){billCount > 0 ? ` B${billCount}` : ""}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
