import { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import Widget from "../ui/Widget";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CalendarWidget = ({ compact = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bills, setBills] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [pendingToggles, setPendingToggles] = useState({});
  const [openClickPopoverKey, setOpenClickPopoverKey] = useState(null);
  const [editingBillId, setEditingBillId] = useState(null);
  const [savingBillId, setSavingBillId] = useState(null);
  const [clickPopoverError, setClickPopoverError] = useState("");
  const [editDraft, setEditDraft] = useState({
    name: "",
    amount: "",
    dueDay: "",
    category: "general",
    notes: "",
    autoPay: false,
    isActive: true,
  });
  const clickPopoverRef = useRef(null);

  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const response = await api.get("/calendar/bills");
        const items = response?.data?.items || response?.data?.data || [];
        setBills(items.filter((item) => item && item.isActive !== false));
      } catch (error) {
        console.error("Failed to fetch bills for calendar:", error);
      }
    };
    fetchBills();
  }, []);

  useEffect(() => {
    if (!openClickPopoverKey) return;

    const handleOutsideClick = (event) => {
      if (clickPopoverRef.current && !clickPopoverRef.current.contains(event.target)) {
        setOpenClickPopoverKey(null);
        setEditingBillId(null);
        setClickPopoverError("");
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpenClickPopoverKey(null);
        setEditingBillId(null);
        setClickPopoverError("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openClickPopoverKey]);

  const getBillColor = (amount) => {
    if (amount < 20) return "bg-green-500";
    if (amount <= 100) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getDayKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const handleDayClick = (date, hasBills) => {
    setSelectedDate(date);
    if (!hasBills) {
      setOpenClickPopoverKey(null);
      setEditingBillId(null);
      setClickPopoverError("");
      return;
    }

    const key = getDayKey(date);
    setOpenClickPopoverKey((prev) => (prev === key ? null : key));
    setEditingBillId(null);
    setClickPopoverError("");
  };

  const startEditBill = (bill) => {
    setEditingBillId(bill._id);
    setEditDraft({
      name: bill.name || "",
      amount: String(bill.amount ?? ""),
      dueDay: String(bill.dueDay ?? ""),
      category: bill.category || "general",
      notes: bill.notes || "",
      autoPay: !!bill.autoPay,
      isActive: bill.isActive !== false,
    });
    setClickPopoverError("");
  };

  const handleTogglePaid = async (bill, nextPaid) => {
    setPendingToggles((prev) => ({ ...prev, [bill._id]: true }));
    const previousBills = bills;

    setBills((prev) =>
      prev.map((item) => {
        if (item._id !== bill._id) return item;
        const monthSet = new Set(item.paidForMonths || []);
        if (nextPaid) monthSet.add(currentMonthKey);
        else monthSet.delete(currentMonthKey);
        return { ...item, paidForMonths: [...monthSet] };
      }),
    );

    try {
      await api.put(`/calendar/bills/${bill._id}/toggle-paid`, {
        monthKey: currentMonthKey,
        isPaid: nextPaid,
      });
    } catch (error) {
      setBills(previousBills);
    } finally {
      setPendingToggles((prev) => {
        const copy = { ...prev };
        delete copy[bill._id];
        return copy;
      });
    }
  };

  const handleSaveEdit = async (billId) => {
    const parsedAmount = Number(editDraft.amount);
    const parsedDueDay = Number(editDraft.dueDay);

    if (!editDraft.name.trim()) {
      setClickPopoverError("Name is required.");
      return;
    }
    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
      setClickPopoverError("Amount must be a valid number.");
      return;
    }
    if (Number.isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
      setClickPopoverError("Due day must be between 1 and 31.");
      return;
    }

    const payload = {
      name: editDraft.name.trim(),
      amount: parsedAmount,
      dueDay: parsedDueDay,
      category: editDraft.category || "general",
      notes: editDraft.notes || "",
      autoPay: !!editDraft.autoPay,
      isActive: !!editDraft.isActive,
    };

    setSavingBillId(billId);
    setClickPopoverError("");
    const previousBills = bills;

    setBills((prev) => prev.map((item) => (item._id === billId ? { ...item, ...payload } : item)));

    try {
      const response = await api.put(`/calendar/bills/${billId}`, payload);
      const updated = response?.data?.item;
      if (updated) {
        setBills((prev) => prev.map((item) => (item._id === billId ? updated : item)));
      }
      setEditingBillId(null);
    } catch (error) {
      setBills(previousBills);
      setClickPopoverError(error?.response?.data?.message || "Failed to update item.");
    } finally {
      setSavingBillId(null);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setOpenClickPopoverKey(null);
    setEditingBillId(null);
    setClickPopoverError("");
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setOpenClickPopoverKey(null);
    setEditingBillId(null);
    setClickPopoverError("");
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-2">
        <button onClick={handlePrevMonth} className="p-1 rounded-full hover:bg-gray-700">
          <ChevronLeft size={16} />
        </button>
        <h2 className="text-base font-semibold text-white">
          {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
        </h2>
        <button onClick={handleNextMonth} className="p-1 rounded-full hover:bg-gray-700">
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="grid grid-cols-7 text-center text-xs text-text-secondary mb-1">
        {weekdays.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay());
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));
    const totalDaysInGrid = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalRows = Math.ceil(totalDaysInGrid / 7);

    const rows = [];
    let days = [];
    let day = startDate;
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    while (day <= endDate) {
      const rowIndex = rows.length;
      for (let i = 0; i < 7; i++) {
        const cloneDay = new Date(day);
        const dayKey = getDayKey(cloneDay);
        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
        const isToday = day.getTime() === today.getTime();
        const isSelected =
          selectedDate &&
          day.getTime() ===
            new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime();
        const isDetailedPopoverOpen = openClickPopoverKey === dayKey;

        const billsForDay = bills.filter((b) => b.dueDay === day.getDate());
        const openUpward = rowIndex >= totalRows - 2;
        const horizontalPosition = i <= 1 ? "left-0" : i >= 5 ? "right-0" : "left-1/2 -translate-x-1/2";
        const verticalPosition = openUpward ? "bottom-full mb-1" : "top-full mt-1";

        days.push(
          <div
            className={`p-1 h-12 flex flex-col items-center justify-start cursor-pointer border rounded-lg transition-colors
              ${!isCurrentMonth ? "text-text-tertiary border-transparent" : "text-text-main border-transparent"}
              ${isToday ? "bg-primary/30 ring-2 ring-primary/70" : ""}
              ${isSelected ? "border-primary" : ""}
              hover:bg-gray-700/50 relative`}
            key={dayKey}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <div className="relative inline-flex">
              <span
                className={`peer cursor-pointer text-xs ${isToday ? "font-bold text-white" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDayClick(cloneDay, isCurrentMonth && billsForDay.length > 0);
                }}
              >
                {day.getDate()}
              </span>

              {isCurrentMonth && billsForDay.length > 0 && (
                <div
                  className={`pointer-events-none opacity-0 peer-hover:opacity-100 transition-all duration-200 absolute ${horizontalPosition} ${verticalPosition} z-20 w-72 rounded-xl border border-primary/45 bg-gradient-to-b from-[#0f1513] to-[#0a0f0d] shadow-2xl ring-1 ring-black/40 p-3 text-left backdrop-blur-sm`}
                >
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-700/70">
                    <div className="text-[11px] uppercase tracking-[0.08em] text-text-secondary font-semibold">
                      Due on day {day.getDate()}
                    </div>
                    <div className="text-[11px] font-semibold text-primary">{billsForDay.length} total</div>
                  </div>
                  <ul className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {billsForDay.map((bill) => {
                      const isPaid = bill.paidForMonths?.includes(currentMonthKey);
                      const pending = !!pendingToggles[bill._id];
                      return (
                        <li
                          key={`popover-${bill._id}`}
                          className={`rounded-lg border px-2 py-1.5 flex items-center gap-2.5 text-xs ${
                            isPaid ? "border-emerald-700/60 bg-emerald-900/20" : "border-gray-700/80 bg-black/20"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isPaid}
                            disabled={pending}
                            onClick={(e) => e.stopPropagation()}
                            onChange={async (e) => {
                              e.stopPropagation();
                              await handleTogglePaid(bill, e.target.checked);
                            }}
                            className="h-4 w-4 accent-green-500"
                          />
                          <span
                            className={`flex-grow truncate font-medium ${
                              isPaid ? "line-through text-gray-400" : "text-gray-100"
                            }`}
                          >
                            {bill.name}
                          </span>
                          <span className={`font-mono text-[12px] ${isPaid ? "text-gray-400" : "text-white"}`}>
                            ${bill.amount.toFixed(2)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-0.5 mt-0.5">
              {isCurrentMonth &&
                billsForDay.map((bill) => (
                  <div
                    key={bill._id}
                    className={`w-1.5 h-1.5 rounded-full ${getBillColor(bill.amount)}`}
                    title={`${bill.name} - $${bill.amount}`}
                  ></div>
                ))}
            </div>

            {isCurrentMonth && billsForDay.length > 0 && isDetailedPopoverOpen && (
              <div
                ref={isDetailedPopoverOpen ? clickPopoverRef : null}
                className={`absolute ${horizontalPosition} ${verticalPosition} z-30 w-[24rem] max-w-[min(24rem,calc(100vw-1.5rem))] rounded-xl border border-primary/50 bg-gradient-to-b from-[#101b18] to-[#0b110f] shadow-2xl ring-1 ring-black/50 p-3 text-left`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-2 flex items-center justify-between border-b border-gray-700/70 pb-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary">
                      {cloneDay.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                    </p>
                    <p className="text-[11px] text-text-tertiary">Detailed items and editing</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenClickPopoverKey(null);
                      setEditingBillId(null);
                      setClickPopoverError("");
                    }}
                    className="rounded-md border border-gray-600/60 px-2 py-1 text-[11px] text-text-secondary hover:bg-black/30"
                  >
                    Close
                  </button>
                </div>

                {clickPopoverError && <p className="mb-2 text-xs text-red-300">{clickPopoverError}</p>}

                <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {billsForDay.map((bill) => {
                    const isPaid = bill.paidForMonths?.includes(currentMonthKey);
                    const pending = !!pendingToggles[bill._id];
                    const isEditing = editingBillId === bill._id;

                    return (
                      <li key={`detailed-${bill._id}`} className="rounded-lg border border-gray-700/80 bg-black/25 p-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-white">{bill.name}</p>
                            <p className="text-[11px] text-text-secondary">
                              ${Number(bill.amount || 0).toFixed(2)} | due day {bill.dueDay} |{" "}
                              {bill.category || "general"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isEditing) {
                                setEditingBillId(null);
                                setClickPopoverError("");
                              } else {
                                startEditBill(bill);
                              }
                            }}
                            className="rounded-md border border-primary/40 px-2 py-1 text-[11px] text-primary hover:bg-primary/10"
                          >
                            {isEditing ? "Cancel" : "Edit"}
                          </button>
                        </div>

                        <label className="mt-2 flex cursor-pointer items-center gap-2 text-[11px] text-text-secondary">
                          <input
                            type="checkbox"
                            checked={isPaid}
                            disabled={pending}
                            onClick={(e) => e.stopPropagation()}
                            onChange={async (e) => {
                              e.stopPropagation();
                              await handleTogglePaid(bill, e.target.checked);
                            }}
                            className="h-3.5 w-3.5 accent-green-500"
                          />
                          {isPaid ? "Marked as paid this month" : "Not paid this month"}
                        </label>

                        {isEditing && (
                          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-gray-700/70 pt-2">
                            <label className="col-span-2 text-[11px] text-text-secondary">
                              Name
                              <input
                                type="text"
                                value={editDraft.name}
                                onChange={(e) => setEditDraft((prev) => ({ ...prev, name: e.target.value }))}
                                className="mt-1 w-full rounded-md border border-gray-600/70 bg-black/30 px-2 py-1 text-xs text-white outline-none focus:border-primary"
                              />
                            </label>

                            <label className="text-[11px] text-text-secondary">
                              Amount
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editDraft.amount}
                                onChange={(e) => setEditDraft((prev) => ({ ...prev, amount: e.target.value }))}
                                className="mt-1 w-full rounded-md border border-gray-600/70 bg-black/30 px-2 py-1 text-xs text-white outline-none focus:border-primary"
                              />
                            </label>

                            <label className="text-[11px] text-text-secondary">
                              Due Day
                              <input
                                type="number"
                                min="1"
                                max="31"
                                value={editDraft.dueDay}
                                onChange={(e) => setEditDraft((prev) => ({ ...prev, dueDay: e.target.value }))}
                                className="mt-1 w-full rounded-md border border-gray-600/70 bg-black/30 px-2 py-1 text-xs text-white outline-none focus:border-primary"
                              />
                            </label>

                            <label className="col-span-2 text-[11px] text-text-secondary">
                              Category
                              <select
                                value={editDraft.category}
                                onChange={(e) => setEditDraft((prev) => ({ ...prev, category: e.target.value }))}
                                className="mt-1 w-full rounded-md border border-gray-600/70 bg-black/30 px-2 py-1 text-xs text-white outline-none focus:border-primary"
                              >
                                <option value="bill">Bill</option>
                                <option value="debt">Debt</option>
                                <option value="subscription">Subscription</option>
                                <option value="general">General</option>
                              </select>
                            </label>

                            <label className="col-span-2 text-[11px] text-text-secondary">
                              Notes
                              <textarea
                                rows={2}
                                value={editDraft.notes}
                                onChange={(e) => setEditDraft((prev) => ({ ...prev, notes: e.target.value }))}
                                className="mt-1 w-full resize-none rounded-md border border-gray-600/70 bg-black/30 px-2 py-1 text-xs text-white outline-none focus:border-primary"
                              />
                            </label>

                            <label className="flex items-center gap-2 text-[11px] text-text-secondary">
                              <input
                                type="checkbox"
                                checked={editDraft.autoPay}
                                onChange={(e) => setEditDraft((prev) => ({ ...prev, autoPay: e.target.checked }))}
                                className="h-3.5 w-3.5 accent-green-500"
                              />
                              Auto Pay
                            </label>

                            <label className="flex items-center gap-2 text-[11px] text-text-secondary">
                              <input
                                type="checkbox"
                                checked={editDraft.isActive}
                                onChange={(e) => setEditDraft((prev) => ({ ...prev, isActive: e.target.checked }))}
                                className="h-3.5 w-3.5 accent-green-500"
                              />
                              Active
                            </label>

                            <div className="col-span-2 mt-1 flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingBillId(null);
                                  setClickPopoverError("");
                                }}
                                className="rounded-md border border-gray-600/70 px-2 py-1 text-[11px] text-text-secondary hover:bg-black/30"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={savingBillId === bill._id}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await handleSaveEdit(bill._id);
                                }}
                                className="rounded-md border border-primary/50 bg-primary/20 px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/30 disabled:opacity-60"
                              >
                                {savingBillId === bill._id ? "Saving..." : "Save"}
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>,
        );
        day.setDate(day.getDate() + 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1" key={day}>
          {days}
        </div>,
      );
      days = [];
    }
    return <div className="overflow-visible">{rows}</div>;
  };

  const renderSelectedDayInfo = () => {
    if (!selectedDate) return null;

    const billsForSelectedDay = bills.filter((b) => Number(b.dueDay) === selectedDate.getDate());

    return (
      <div className={`${compact ? "mt-2 pt-2" : "mt-3 pt-3"} border-t border-gray-700/50`}>
        <h3 className="font-semibold text-white mb-1 text-sm">
          Events for: {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
        </h3>
        {billsForSelectedDay.length > 0 ? (
          <ul className="space-y-1">
            {billsForSelectedDay.map((bill) => (
              <li key={bill._id} className="flex items-center text-xs">
                <div className={`w-2 h-2 rounded-full mr-2 ${getBillColor(bill.amount)}`}></div>
                <span className="flex-grow text-text-secondary">{bill.name}</span>
                <span className="font-mono text-white text-xs">${bill.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-text-tertiary">No bills, debts, or subscriptions due on this day.</p>
        )}
        {/* Placeholder for other scheduled events */}
      </div>
    );
  };

  const monthlyTotal = bills.reduce((acc, bill) => acc + Number(bill.amount || 0), 0);
  const monthlyPaid = bills
    .filter((bill) => bill.paidForMonths?.includes(currentMonthKey))
    .reduce((acc, bill) => acc + Number(bill.amount || 0), 0);
  const monthlyRemaining = monthlyTotal - monthlyPaid;

  return (
    <Widget title="Monthly Schedule" className="flex flex-col h-auto" padding={compact ? "p-3" : "p-6"}>
      <div className="flex-grow relative overflow-visible">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>
      <div className="mt-2 rounded-lg border border-gray-700/50 bg-gray-900/60 px-3 py-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Monthly Bills Remaining</span>
          <span className="font-mono text-white">${monthlyRemaining.toFixed(2)}</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-700/60 overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${monthlyTotal ? (monthlyPaid / monthlyTotal) * 100 : 0}%` }}
          />
        </div>
      </div>
      {renderSelectedDayInfo()}
    </Widget>
  );
};

export default CalendarWidget;
