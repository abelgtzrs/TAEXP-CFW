import { useState, useEffect } from "react";
import api from "../../services/api";
import Widget from "../ui/Widget";
import { Check, ChevronLeft, ChevronRight, Pencil, X } from "lucide-react";

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

  // Tier colour as a dot: solid when unpaid, outlined once paid.
  const TIER_DOT = {
    low: "bg-emerald-400 border-emerald-400",
    medium: "bg-amber-300 border-amber-300",
    high: "bg-rose-400 border-rose-400",
  };
  const billDotClass = (bill, paid) =>
    `inline-block h-1.5 w-1.5 shrink-0 rounded-full border ${TIER_DOT[getBillTier(bill.amount)]} ${paid ? "!bg-transparent opacity-60" : ""}`;

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

  const monthlyTotal = bills.reduce((acc, bill) => acc + Number(bill.amount || 0), 0);
  const monthlyPaid = bills
    .filter((bill) => isBillPaidForCurrentMonth(bill))
    .reduce((acc, bill) => acc + Number(bill.amount || 0), 0);
  const monthlyRemaining = Math.max(monthlyTotal - monthlyPaid, 0);
  const paidProgress = monthlyTotal ? (monthlyPaid / monthlyTotal) * 100 : 0;


  const closeEditor = () => {
    setEditingBillId(null);
    setClickPopoverError("");
  };

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const renderHeader = () => (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-lg font-semibold tracking-tight text-text-main">
        {currentDate.toLocaleString("default", { month: "long" })}{" "}
        <span className="font-normal text-text-secondary">{currentDate.getFullYear()}</span>
      </h2>
      <div className="flex gap-1">
        <button type="button" onClick={handlePrevMonth} className="dash-btn dash-btn-icon" aria-label="Previous month">
          <ChevronLeft size={15} />
        </button>
        <button type="button" onClick={handleNextMonth} className="dash-btn dash-btn-icon" aria-label="Next month">
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="mt-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-text-secondary">Left to pay</span>
        <span className="dash-value text-xl">{formatCurrency(monthlyRemaining)}</span>
      </div>
      <div className="dash-meter mt-2">
        <span style={{ width: `${paidProgress}%`, background: "#34d399" }} />
      </div>
      <div className="mt-1.5 flex justify-between gap-2 text-[11px] tabular-nums text-text-secondary">
        <span>{formatCurrency(monthlyPaid)} paid</span>
        <span>
          {paidBillCount} of {totalBillCount} bills
        </span>
      </div>
    </div>
  );

  const renderDays = () => {
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="mt-4 mb-1 grid grid-cols-7 text-center text-[10px] font-medium text-text-secondary">
        {weekdays.map((day) => (
          <abbr key={day} title={day} className="no-underline">
            {day[0]}
          </abbr>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const day = new Date(monthStart);
    day.setDate(day.getDate() - monthStart.getDay());
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));
    const today = new Date();

    const cells = [];
    while (day <= endDate) {
      const cloneDay = new Date(day);
      const isCurrentMonth = cloneDay.getMonth() === currentDate.getMonth();
      const isToday = sameDay(cloneDay, today);
      const isSelected = selectedDate && sameDay(cloneDay, selectedDate);
      const billsForDay = isCurrentMonth ? bills.filter((b) => Number(b.dueDay) === cloneDay.getDate()) : [];
      const hasUnpaid = billsForDay.some((bill) => !isBillPaidForCurrentMonth(bill));
      const dateLabel = cloneDay.toLocaleDateString("en-US", { month: "long", day: "numeric" });

      cells.push(
        <button
          type="button"
          key={cloneDay.toISOString()}
          onClick={() => handleDayClick(cloneDay)}
          aria-pressed={!!isSelected}
          aria-label={billsForDay.length ? `${dateLabel}, ${billsForDay.length} due` : dateLabel}
          className={`flex ${compact ? "h-9" : "h-11"} flex-col items-center justify-center gap-1 rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary
            ${isSelected ? "bg-white/[0.06] ring-1 ring-inset ring-primary/50" : "hover:bg-white/[0.04]"}`}
        >
          <span
            className={`grid h-6 w-6 place-items-center rounded-full text-xs tabular-nums
              ${isToday ? "bg-primary font-semibold text-white" : ""}
              ${!isToday && !isCurrentMonth ? "text-text-secondary/30" : ""}
              ${!isToday && isCurrentMonth ? (hasUnpaid ? "font-medium text-text-main" : "text-text-secondary") : ""}`}
          >
            {cloneDay.getDate()}
          </span>
          <span className="flex h-1.5 gap-0.5" aria-hidden="true">
            {billsForDay.slice(0, 3).map((bill) => (
              <span key={bill._id} className={billDotClass(bill, isBillPaidForCurrentMonth(bill))} />
            ))}
          </span>
        </button>,
      );
      day.setDate(day.getDate() + 1);
    }

    return <div className="grid grid-cols-7 gap-0.5">{cells}</div>;
  };

  const renderEditForm = (bill) => {
    const field = (key) => ({
      value: editDraft[key],
      onChange: (e) => setEditDraft((prev) => ({ ...prev, [key]: e.target.value })),
      className: "dash-input mt-1 w-full",
      style: { fontSize: 16 }, // keeps iOS from zooming on focus
    });
    const toggle = (key) => ({
      type: "checkbox",
      checked: editDraft[key],
      onChange: (e) => setEditDraft((prev) => ({ ...prev, [key]: e.target.checked })),
      className: "h-3.5 w-3.5 accent-emerald-400",
    });

    return (
      <div className="mt-2.5 grid grid-cols-2 gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] text-text-secondary">
        <label className="col-span-2">
          Name
          <input type="text" {...field("name")} />
        </label>
        <label>
          Amount
          <input type="number" min="0" step="0.01" {...field("amount")} />
        </label>
        <label>
          Due day
          <input type="number" min="1" max="31" {...field("dueDay")} />
        </label>
        <label className="col-span-2">
          Category
          <select {...field("category")}>
            <option value="bill">Bill</option>
            <option value="debt">Debt</option>
            <option value="subscription">Subscription</option>
            <option value="general">General</option>
          </select>
        </label>
        <label className="col-span-2">
          Notes
          <textarea rows={2} {...field("notes")} className="dash-input mt-1 w-full resize-none" />
        </label>
        <label className="flex items-center gap-2">
          <input {...toggle("autoPay")} />
          Auto-pay
        </label>
        <label className="flex items-center gap-2">
          <input {...toggle("isActive")} />
          Active
        </label>
        <div className="col-span-2 mt-1 flex justify-end gap-2">
          <button type="button" onClick={closeEditor} className="dash-btn">
            Cancel
          </button>
          <button
            type="button"
            disabled={savingBillId === bill._id}
            onClick={() => handleSaveEdit(bill._id)}
            className="dash-btn dash-btn-primary"
          >
            {savingBillId === bill._id ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    );
  };

  const renderSelectedDayInfo = () => {
    if (!selectedDate) return null;

    const billsForSelectedDay = bills.filter((b) => Number(b.dueDay) === selectedDate.getDate());
    const unpaidForSelectedDay = billsForSelectedDay.filter((bill) => !isBillPaidForCurrentMonth(bill));
    const selectedDayUnpaidTotal = unpaidForSelectedDay.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
    const sortedBills = [...billsForSelectedDay].sort((a, b) => {
      const aPaid = isBillPaidForCurrentMonth(a);
      const bPaid = isBillPaidForCurrentMonth(b);
      if (aPaid !== bPaid) return aPaid ? 1 : -1;
      return Number(b.amount || 0) - Number(a.amount || 0);
    });

    return (
      <div className={`${compact ? "mt-3 pt-3" : "mt-4 pt-4"} border-t border-white/[0.06]`}>
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-medium text-text-main">
            {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </h3>
          {billsForSelectedDay.length > 0 && (
            <span className="text-xs tabular-nums text-text-secondary">
              {unpaidForSelectedDay.length ? `${formatCurrency(selectedDayUnpaidTotal)} unpaid` : "All paid"}
            </span>
          )}
        </div>

        {clickPopoverError && <p className="mt-2 text-xs text-rose-300">{clickPopoverError}</p>}

        {sortedBills.length > 0 ? (
          <ul className="dash-rows mt-2">
            {sortedBills.map((bill) => {
              const isPaid = isBillPaidForCurrentMonth(bill);
              const pending = !!pendingToggles[bill._id];
              const isEditing = editingBillId === bill._id;

              return (
                <li key={bill._id} className="py-2.5">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleTogglePaid(bill, !isPaid)}
                      aria-pressed={isPaid}
                      aria-label={isPaid ? `Mark ${bill.name} as unpaid` : `Mark ${bill.name} as paid`}
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors disabled:opacity-50 ${
                        isPaid
                          ? "border-emerald-400 bg-emerald-400 text-black"
                          : "border-white/25 text-transparent hover:border-emerald-400/70 hover:text-emerald-400/70"
                      }`}
                    >
                      <Check size={12} strokeWidth={3} />
                    </button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-[13px] ${
                          isPaid ? "text-text-secondary line-through decoration-white/20" : "font-medium text-text-main"
                        }`}
                      >
                        {bill.name}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-text-secondary">
                        <span className={billDotClass(bill, isPaid)} />
                        <span className="capitalize">{bill.category || "general"}</span>
                        {bill.autoPay && <span className="dash-tag">Auto-pay</span>}
                      </p>
                    </div>

                    <span className={`dash-value text-[13px] ${isPaid ? "!font-normal !text-text-secondary" : ""}`}>
                      {formatCurrency(bill.amount)}
                    </span>

                    <button
                      type="button"
                      onClick={() => (isEditing ? closeEditor() : startEditBill(bill))}
                      className="dash-btn dash-btn-icon"
                      aria-label={isEditing ? "Close editor" : `Edit ${bill.name}`}
                    >
                      {isEditing ? <X size={13} /> : <Pencil size={13} />}
                    </button>
                  </div>

                  {isEditing && renderEditForm(bill)}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="dash-empty mt-2">Nothing due this day.</p>
        )}
      </div>
    );
  };

  return (
    <Widget title="Monthly Bills Calendar" className="flex h-auto flex-col" padding={compact ? "p-3" : "p-4"}>
      {renderHeader()}
      {renderSummary()}
      {renderDays()}
      {renderCells()}
      {renderSelectedDayInfo()}
    </Widget>
  );
};

export default CalendarWidget;
