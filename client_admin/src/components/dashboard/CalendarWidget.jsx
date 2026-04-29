import { useState, useEffect } from "react";
import api from "../../services/api";
import Widget from "../ui/Widget";
import { ChevronLeft, ChevronRight, CircleDollarSign } from "lucide-react";

const CalendarWidget = ({ compact = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bills, setBills] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [pendingToggles, setPendingToggles] = useState({});
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

  const getBillTier = (amount) => {
    const parsedAmount = Number(amount || 0);
    if (parsedAmount < 20) return "low";
    if (parsedAmount > 100) return "high";
    return "medium";
  };

  const getBillColor = (amount) => {
    const tier = getBillTier(amount);
    if (tier === "low") return "bg-green-500";
    if (tier === "high") return "bg-red-500";
    return "bg-yellow-500";
  };

  const getBillIconColor = (amount) => {
    const tier = getBillTier(amount);
    if (tier === "low") return "text-emerald-400";
    if (tier === "high") return "text-red-400";
    return "text-yellow-400";
  };

  const formatCurrency = (value) => {
    const parsed = Number(value || 0);
    return `$${parsed.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const isBillPaidForCurrentMonth = (bill) => {
    return bill.paidForMonths?.includes(currentMonthKey);
  };

  const handleDayClick = (date) => {
    setSelectedDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
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
    const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(previousMonth);
    setSelectedDate(previousMonth);
    setEditingBillId(null);
    setClickPopoverError("");
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(nextMonth);
    setSelectedDate(nextMonth);
    setEditingBillId(null);
    setClickPopoverError("");
  };

  const totalBillCount = bills.length;
  const paidBillCount = bills.filter((bill) => isBillPaidForCurrentMonth(bill)).length;
  const remainingBillCount = Math.max(totalBillCount - paidBillCount, 0);

  const monthlyTotal = bills.reduce((acc, bill) => acc + Number(bill.amount || 0), 0);
  const monthlyPaid = bills
    .filter((bill) => isBillPaidForCurrentMonth(bill))
    .reduce((acc, bill) => acc + Number(bill.amount || 0), 0);
  const monthlyRemaining = Math.max(monthlyTotal - monthlyPaid, 0);
  const paidProgress = monthlyTotal ? (monthlyPaid / monthlyTotal) * 100 : 0;

  const renderHeader = () => {
    return (
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="rounded border border-gray-700/50 bg-black/10 p-2 text-text-secondary hover:border-primary/30 hover:text-white"
        >
          <ChevronLeft size={16} />
        </button>
        <h2 className="flex-1 text-center text-base font-semibold tracking-wide text-white">
          {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
        </h2>
        <button
          type="button"
          onClick={handleNextMonth}
          className="rounded border border-gray-700/50 bg-black/10 p-2 text-text-secondary hover:border-primary/30 hover:text-white"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-text-secondary">
        {weekdays.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    const endDate = new Date(monthEnd);
    startDate.setDate(startDate.getDate() - monthStart.getDay());
    endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));

    const rows = [];
    const day = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    while (day <= endDate) {
      const rowIndex = rows.length;
      const cells = [];

      for (let i = 0; i < 7; i++) {
        const cloneDay = new Date(day);
        const dayKey = `${cloneDay.getFullYear()}-${String(cloneDay.getMonth() + 1).padStart(2, "0")}-${String(cloneDay.getDate()).padStart(2, "0")}`;
        const isCurrentMonth = cloneDay.getMonth() === currentDate.getMonth();
        const isToday = cloneDay.getTime() === today.getTime();
        const isSelected =
          selectedDate &&
          cloneDay.getTime() ===
            new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime();

        const billsForDay = bills.filter((b) => Number(b.dueDay) === cloneDay.getDate());
        const hasBillsInCurrentMonth = isCurrentMonth && billsForDay.length > 0;
        const visibleBillIcons = billsForDay.slice(0, 3);

        cells.push(
          <button
            type="button"
            key={dayKey}
            onClick={() => handleDayClick(cloneDay)}
            className={`min-h-[3.5rem] rounded border px-1.5 py-1 text-left transition-colors
              ${!isCurrentMonth ? "border-transparent text-text-tertiary/50" : "border-transparent bg-black/10 text-text-main"}
              ${isCurrentMonth ? "hover:border-primary/40" : ""}
              ${isToday ? "border-primary/50" : ""}
              ${isSelected ? "ring-1 ring-primary/60 border-primary/50" : ""}`}
          >
            <div
              className={`mb-0.5 text-xs font-semibold ${isToday ? "bg-primary/15 text-white rounded px-1" : "text-text-secondary"}`}
            >
              {cloneDay.getDate()}
            </div>

            {hasBillsInCurrentMonth ? (
              <div className="flex items-center gap-0.5">
                {visibleBillIcons.map((bill) => {
                  const isPaid = isBillPaidForCurrentMonth(bill);
                  return (
                    <CircleDollarSign
                      key={`bill-icon-${dayKey}-${bill._id}`}
                      size={14}
                      strokeWidth={2.2}
                      className={`${getBillIconColor(bill.amount)} ${isPaid ? "opacity-30" : "opacity-90"}`}
                    />
                  );
                })}
                {billsForDay.length > 3 && (
                  <span className="pl-0.5 text-[10px] text-text-tertiary">+{billsForDay.length - 3}</span>
                )}
              </div>
            ) : null}
          </button>,
        );

        day.setDate(day.getDate() + 1);
      }

      rows.push(
        <div className="grid grid-cols-7 gap-1" key={`row-${rowIndex}`}>
          {cells}
        </div>,
      );
    }

    return <div className="space-y-1">{rows}</div>;
  };

  const renderSelectedDayInfo = () => {
    if (!selectedDate) return null;

    const billsForSelectedDay = bills.filter((b) => Number(b.dueDay) === selectedDate.getDate());
    const unpaidForSelectedDay = billsForSelectedDay.filter((bill) => !isBillPaidForCurrentMonth(bill));
    const selectedDayTotal = billsForSelectedDay.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
    const selectedDayUnpaidTotal = unpaidForSelectedDay.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
    const sortedBills = [...billsForSelectedDay].sort((a, b) => {
      const aPaid = isBillPaidForCurrentMonth(a);
      const bPaid = isBillPaidForCurrentMonth(b);
      if (aPaid !== bPaid) return aPaid ? 1 : -1;
      return Number(b.amount || 0) - Number(a.amount || 0);
    });

    return (
      <div className={`${compact ? "mt-2 pt-2" : "mt-3 pt-3"} border-t border-gray-700/50`}>
        <div className="mb-2 rounded-lg border border-gray-700/40 bg-black/5 p-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold text-white">
              {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </h3>
            {billsForSelectedDay.length > 0 ? (
              <span className="inline-flex items-center rounded-full border border-rose-400/30 bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-200">
                {unpaidForSelectedDay.length} unpaid
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-gray-600/40 bg-black/20 px-2 py-0.5 text-xs font-semibold text-text-secondary">
                No bills
              </span>
            )}
          </div>

          {billsForSelectedDay.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded border border-gray-700/40 bg-black/10 px-2 py-1.5">
                <p className="text-[10px] uppercase tracking-wide text-text-secondary">Due</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-white">{formatCurrency(selectedDayTotal)}</p>
              </div>
              <div className="rounded border border-rose-400/25 bg-rose-900/10 px-2 py-1.5">
                <p className="text-[10px] uppercase tracking-wide text-rose-200/70">Unpaid</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-rose-100">
                  {formatCurrency(selectedDayUnpaidTotal)}
                </p>
              </div>
            </div>
          )}
        </div>

        {clickPopoverError && <p className="mb-2 text-xs text-red-300">{clickPopoverError}</p>}

        {sortedBills.length > 0 ? (
          <ul className="space-y-1.5">
            {sortedBills.map((bill) => {
              const isPaid = isBillPaidForCurrentMonth(bill);
              const pending = !!pendingToggles[bill._id];
              const isEditing = editingBillId === bill._id;

              return (
                <li
                  key={bill._id}
                  className={`rounded border px-3 py-2.5 text-xs ${
                    isPaid ? "border-emerald-700/40 bg-emerald-900/10" : "border-rose-400/35 bg-rose-900/12"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${getBillColor(bill.amount)}`}></span>
                        <p
                          className={`truncate text-sm font-semibold ${isPaid ? "text-emerald-100/70 line-through" : "text-white"}`}
                        >
                          {bill.name}
                        </p>
                      </div>
                      <p className="mt-0.5 text-[10px] text-text-tertiary">
                        Day {bill.dueDay} · {bill.category || "general"}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-xs font-semibold ${
                          isPaid ? "bg-emerald-500/15 text-emerald-100" : "bg-rose-500/25 text-rose-100"
                        }`}
                      >
                        {formatCurrency(bill.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditing) {
                            setEditingBillId(null);
                            setClickPopoverError("");
                          } else {
                            startEditBill(bill);
                          }
                        }}
                        className="min-h-[32px] min-w-[32px] rounded border border-primary/40 px-2 py-1 text-xs text-primary hover:bg-primary/5"
                      >
                        {isEditing ? "✕" : "✎"}
                      </button>
                    </div>
                  </div>

                  <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-text-tertiary">
                    <input
                      type="checkbox"
                      checked={isPaid}
                      disabled={pending}
                      onChange={async (e) => {
                        await handleTogglePaid(bill, e.target.checked);
                      }}
                      className={`h-4 w-4 ${isPaid ? "accent-green-500" : "accent-rose-500"}`}
                      style={{ minWidth: 16, minHeight: 16 }}
                    />
                    <span className={isPaid ? "text-emerald-300" : "text-rose-300"}>
                      {isPaid ? "Paid" : "Mark as paid"}
                    </span>
                  </label>

                  {isEditing && (
                    <div className="mt-1.5 grid grid-cols-2 gap-1 border-t border-gray-700/40 pt-1.5">
                      <label className="col-span-2 text-xs text-text-secondary">
                        Name
                        <input
                          type="text"
                          value={editDraft.name}
                          onChange={(e) => setEditDraft((prev) => ({ ...prev, name: e.target.value }))}
                          className="mt-1 w-full rounded border border-gray-600/50 bg-black/20 px-2 py-1.5 text-white outline-none focus:border-primary"
                          style={{ fontSize: 16 }}
                        />
                      </label>

                      <label className="text-xs text-text-secondary">
                        Amount
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editDraft.amount}
                          onChange={(e) => setEditDraft((prev) => ({ ...prev, amount: e.target.value }))}
                          className="mt-1 w-full rounded border border-gray-600/50 bg-black/20 px-2 py-1.5 text-white outline-none focus:border-primary"
                          style={{ fontSize: 16 }}
                        />
                      </label>

                      <label className="text-xs text-text-secondary">
                        Due Day
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={editDraft.dueDay}
                          onChange={(e) => setEditDraft((prev) => ({ ...prev, dueDay: e.target.value }))}
                          className="mt-1 w-full rounded border border-gray-600/50 bg-black/20 px-2 py-1.5 text-white outline-none focus:border-primary"
                          style={{ fontSize: 16 }}
                        />
                      </label>

                      <label className="col-span-2 text-xs text-text-secondary">
                        Category
                        <select
                          value={editDraft.category}
                          onChange={(e) => setEditDraft((prev) => ({ ...prev, category: e.target.value }))}
                          className="mt-1 w-full rounded border border-gray-600/50 bg-black/20 px-2 py-1.5 text-white outline-none focus:border-primary"
                          style={{ fontSize: 16 }}
                        >
                          <option value="bill">Bill</option>
                          <option value="debt">Debt</option>
                          <option value="subscription">Subscription</option>
                          <option value="general">General</option>
                        </select>
                      </label>

                      <label className="col-span-2 text-xs text-text-secondary">
                        Notes
                        <textarea
                          rows={2}
                          value={editDraft.notes}
                          onChange={(e) => setEditDraft((prev) => ({ ...prev, notes: e.target.value }))}
                          className="mt-1 w-full resize-none rounded border border-gray-600/50 bg-black/20 px-2 py-1.5 text-white outline-none focus:border-primary"
                          style={{ fontSize: 16 }}
                        />
                      </label>

                      <label className="flex items-center gap-2 text-xs text-text-secondary">
                        <input
                          type="checkbox"
                          checked={editDraft.autoPay}
                          onChange={(e) => setEditDraft((prev) => ({ ...prev, autoPay: e.target.checked }))}
                          className="h-4 w-4 accent-green-500"
                        />
                        Auto-pay
                      </label>

                      <label className="flex items-center gap-2 text-xs text-text-secondary">
                        <input
                          type="checkbox"
                          checked={editDraft.isActive}
                          onChange={(e) => setEditDraft((prev) => ({ ...prev, isActive: e.target.checked }))}
                          className="h-4 w-4 accent-green-500"
                        />
                        Active
                      </label>

                      <div className="col-span-2 mt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBillId(null);
                            setClickPopoverError("");
                          }}
                          className="min-h-[36px] rounded border border-gray-600/50 px-3 py-1.5 text-xs text-text-secondary hover:bg-black/30"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={savingBillId === bill._id}
                          onClick={async () => {
                            await handleSaveEdit(bill._id);
                          }}
                          className="min-h-[36px] rounded border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/25 disabled:opacity-50"
                        >
                          {savingBillId === bill._id ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-[9px] text-text-tertiary">No bills due.</p>
        )}
      </div>
    );
  };

  return (
    <Widget title="Monthly Bills Calendar" className="flex h-auto flex-col" padding={compact ? "p-3" : "p-6"}>
      <div className="relative flex-grow">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>

      <div className={`mt-2 rounded px-2 py-2 ${monthlyRemaining > 0 ? "bg-rose-900/8" : "bg-emerald-900/8"}`}>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs uppercase tracking-widest text-text-secondary">Remaining this month</p>
          <p className="text-xl font-mono font-semibold text-white">{formatCurrency(monthlyRemaining)}</p>
        </div>
        <div className="mt-1.5 flex gap-3 text-xs text-text-tertiary">
          <span>{paidBillCount} paid</span>
          <span>·</span>
          <span>{remainingBillCount} unpaid</span>
        </div>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-700/30">
          <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${paidProgress}%` }} />
        </div>
      </div>

      {renderSelectedDayInfo()}
    </Widget>
  );
};

export default CalendarWidget;
