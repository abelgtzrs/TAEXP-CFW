import { useEffect, useMemo, useState } from "react";
import { calendarService } from "../services/calendarService";
import MonthlyCalendar from "../components/calendar/MonthlyCalendar";
import {
  Edit2,
  Trash2,
  X,
  Plus,
  DollarSign,
  Calendar as CalendarIcon,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const MONTH_OPTIONS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MOBILE_TABS = [
  { id: "overview", label: "Overview" },
  { id: "event", label: "Add Event" },
  { id: "bills", label: "Bills" },
  { id: "yearly", label: "Yearly" },
];

const BILL_CATEGORY_OPTIONS = ["debt", "bill", "subscription"];
const BILL_CATEGORY_COLOR_STORAGE_KEY = "calendar.billCategoryColors.v1";
const DEFAULT_BILL_CATEGORY_COLORS = {
  debt: "#ef4444",
  bill: "#f59e0b",
  subscription: "#22c55e",
};

export default function CalendarAdminPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [activeFormTab, setActiveFormTab] = useState("event");

  const [events, setEvents] = useState([]);
  const [bills, setBills] = useState([]);
  const [monthlyFeed, setMonthlyFeed] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeMobileTab, setActiveMobileTab] = useState("overview");
  const [isMdUp, setIsMdUp] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 768px)").matches;
  });

  const [showBillList, setShowBillList] = useState(true);
  const [editingBillId, setEditingBillId] = useState(null);
  const [billCategoryColors, setBillCategoryColors] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_BILL_CATEGORY_COLORS;
    try {
      const raw = window.localStorage.getItem(BILL_CATEGORY_COLOR_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return { ...DEFAULT_BILL_CATEGORY_COLORS, ...(parsed || {}) };
    } catch {
      return DEFAULT_BILL_CATEGORY_COLORS;
    }
  });

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    allDay: true,
    category: "personal",
    color: "#4f46e5",
  });

  const [billForm, setBillForm] = useState({
    name: "",
    amount: 0,
    dueDay: 1,
    category: "bill",
    notes: "",
    autoPay: false,
    isActive: true,
  });

  const [yearlyForm, setYearlyForm] = useState({
    title: "",
    month,
    day: 1,
    category: "birthday",
    color: "#10b981",
    notes: "",
    isActive: true,
  });

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const handleChange = (e) => setIsMdUp(e.matches);
    setIsMdUp(media.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (["event", "bills", "yearly"].includes(activeMobileTab)) {
      setActiveFormTab(activeMobileTab);
    }
  }, [activeMobileTab]);

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const [ev, bi] = await Promise.all([calendarService.listEvents(), calendarService.listBills()]);
      setEvents(ev);
      setBills(bi);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const monthlyItems = useMemo(() => ({ year, month }), [year, month]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(BILL_CATEGORY_COLOR_STORAGE_KEY, JSON.stringify(billCategoryColors));
  }, [billCategoryColors]);

  useEffect(() => {
    calendarService
      .getMonthlySchedule(monthlyItems)
      .then((items) => {
        const withCategoryColors = (items || []).map((it) => {
          if (it.type !== "bill") return it;
          const categoryKey = BILL_CATEGORY_OPTIONS.includes(it.category) ? it.category : "bill";
          return {
            ...it,
            category: categoryKey,
            color: billCategoryColors[categoryKey] || DEFAULT_BILL_CATEGORY_COLORS.bill,
          };
        });
        setMonthlyFeed(withCategoryColors);
      })
      .catch(() => setMonthlyFeed([]));
  }, [monthlyItems, events, bills, billCategoryColors]);

  const resetBillForm = () => {
    setBillForm({
      name: "",
      amount: 0,
      dueDay: 1,
      category: "bill",
      notes: "",
      autoPay: false,
      isActive: true,
    });
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await calendarService.createEvent({ ...eventForm, date: new Date(eventForm.date) });
      setEventForm({ title: "", description: "", date: "", allDay: true, category: "personal", color: "#4f46e5" });
      await refresh();
      setActiveMobileTab("overview");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to create event");
    }
  };

  const handleCreateOrUpdateBill = async (e) => {
    e.preventDefault();
    try {
      if (editingBillId) {
        await calendarService.updateBill(editingBillId, billForm);
      } else {
        await calendarService.createBill(billForm);
      }
      resetBillForm();
      setEditingBillId(null);
      await refresh();
      setActiveMobileTab("overview");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to save bill");
    }
  };

  const handleEditBill = (bill) => {
    const category = BILL_CATEGORY_OPTIONS.includes(bill.category) ? bill.category : "bill";
    setBillForm({ ...bill, category });
    setEditingBillId(bill._id);
    setActiveMobileTab("bills");
  };

  const handleCancelEditBill = () => {
    resetBillForm();
    setEditingBillId(null);
  };

  const handleDeleteBill = async (id) => {
    if (!window.confirm("Are you sure you want to delete this bill?")) return;
    try {
      await calendarService.deleteBill(id);
      await refresh();
    } catch (err) {
      setError(err?.message || "Failed to delete bill");
    }
  };

  const handleCreateYearly = async (e) => {
    e.preventDefault();
    try {
      await calendarService.createYearly(yearlyForm);
      setYearlyForm({ title: "", month, day: 1, category: "birthday", color: "#10b981", notes: "", isActive: true });
      await refresh();
      setActiveMobileTab("overview");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to create yearly event");
    }
  };

  const goToMonth = (delta) => {
    const current = new Date(year, month - 1, 1);
    current.setMonth(current.getMonth() + delta);
    setYear(current.getFullYear());
    setMonth(current.getMonth() + 1);
    setYearlyForm((prev) => ({ ...prev, month: current.getMonth() + 1 }));
  };

  const handleCalendarQuickAdd = ({ action, year: y, month: m, day: d }) => {
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    if (action === "bill") {
      setEditingBillId(null);
      setBillForm((prev) => ({ ...prev, dueDay: d }));
      setShowBillList(true);
      setActiveFormTab("bills");
      setActiveMobileTab("bills");
      return;
    }

    if (action === "event") {
      setEventForm((prev) => ({ ...prev, date: dateStr }));
      setActiveFormTab("event");
      setActiveMobileTab("event");
      return;
    }

    if (action === "yearly") {
      setYearlyForm((prev) => ({ ...prev, month: m, day: d }));
      setActiveFormTab("yearly");
      setActiveMobileTab("yearly");
    }
  };

  const activeBillsCount = useMemo(() => bills.filter((bill) => bill.isActive !== false).length, [bills]);
  const monthlyItemCount = monthlyFeed.length;
  const monthlyBillCount = monthlyFeed.filter((it) => it.type === "bill").length;

  const cardClass =
    "relative overflow-hidden rounded-[30px] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--color-surface),black_6%),color-mix(in_srgb,var(--color-bg),black_2%))] ring-1 ring-emerald-400/10 backdrop-blur-xl shadow-[0_22px_44px_rgba(0,0,0,0.28)]";
  const panelClass =
    "rounded-[24px] bg-[linear-gradient(170deg,color-mix(in_srgb,var(--color-surface),black_8%),color-mix(in_srgb,var(--color-bg),black_3%))] ring-1 ring-emerald-400/8 backdrop-blur-md shadow-[0_14px_30px_rgba(0,0,0,0.22)]";
  const sectionTitleClass = "text-base sm:text-lg font-semibold text-text-main tracking-tight";
  const subsectionTitleClass = "text-sm font-semibold text-text-main tracking-tight";
  const inputClass =
    "w-full rounded-2xl bg-[color-mix(in_srgb,var(--color-bg),black_4%)] ring-1 ring-emerald-400/12 text-text-main placeholder:text-text-secondary px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/24 transition";
  const labelClass = "text-xs uppercase tracking-[0.14em] text-text-secondary font-semibold";

  const visibleOnMobile = (tabId) => (activeMobileTab === tabId || isMdUp ? "block" : "hidden");
  const visibleForm = (tabId) =>
    activeFormTab === tabId && (isMdUp || activeMobileTab === tabId) ? "block" : "hidden";

  return (
    <div className="relative isolate space-y-6 pb-20 md:pb-12 xl:pb-6 xl:h-[calc(100vh-64px)] xl:flex xl:flex-col xl:overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-48 left-[8%] h-[28rem] w-[28rem] rounded-full bg-emerald-400/12 blur-[110px]" />
        <div className="absolute top-[28%] right-[6%] h-80 w-80 rounded-full bg-cyan-400/10 blur-[100px]" />
        <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-teal-400/10 blur-[90px]" />
      </div>

      {/* Header Section */}
      <section className={`${cardClass} p-6 sm:p-8 xl:p-7`}>
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 xl:gap-8 mb-6">
          <div className="flex-1">
            <h1 className="text-4xl sm:text-5xl xl:text-[3.3rem] leading-[0.95] font-bold tracking-tight text-text-main mb-2">
              Calendar
            </h1>
            <p className="max-w-2xl text-sm sm:text-base text-text-secondary/90">
              Plan events, automate bills, and track yearly milestones from one focused control surface.
            </p>
          </div>
          <div className="flex lg:justify-end">
            <div className="w-full lg:max-w-[320px] rounded-[22px] bg-[linear-gradient(150deg,color-mix(in_srgb,var(--color-bg),black_3%),color-mix(in_srgb,var(--color-surface),black_8%))] p-4 ring-1 ring-emerald-300/14 shadow-[0_14px_30px_rgba(0,0,0,0.22)]">
              <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-text-secondary mb-2">
                Focused Month
              </p>
              <p className="text-xl font-semibold text-text-main leading-tight">
                {MONTH_OPTIONS[month - 1]} {year}
              </p>
              <p className="text-xs text-text-secondary mt-2">{monthlyItemCount} scheduled entries in view</p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl bg-emerald-400/10 px-5 py-4 text-sm font-medium text-text-main shadow-[0_8px_16px_rgba(0,0,0,0.18)] ring-1 ring-emerald-300/18 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Navigation & Controls */}
      <section className={`${cardClass} p-5 sm:p-6 xl:p-5`}>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className={subsectionTitleClass}>Navigate Calendar</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToMonth(-1)}
                className="h-10 w-10 rounded-full bg-[color-mix(in_srgb,var(--color-bg),black_3%)] text-text-secondary hover:text-text-main hover:bg-emerald-400/12 ring-1 ring-emerald-400/12 transition flex items-center justify-center"
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => {
                  setYear(now.getFullYear());
                  setMonth(now.getMonth() + 1);
                }}
                className="rounded-full bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-300/16 hover:bg-emerald-400/16 transition"
              >
                Today
              </button>
              <button
                onClick={() => goToMonth(1)}
                className="h-10 w-10 rounded-full bg-[color-mix(in_srgb,var(--color-bg),black_3%)] text-text-secondary hover:text-text-main hover:bg-emerald-400/12 ring-1 ring-emerald-400/12 transition flex items-center justify-center"
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:max-w-sm">
            <select value={month} onChange={(e) => setMonth(parseInt(e.target.value, 10))} className={inputClass}>
              {MONTH_OPTIONS.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value || now.getFullYear(), 10))}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Mobile Navigation Tabs */}
      <div className="flex md:hidden gap-2 px-2 overflow-x-auto pb-2">
        {MOBILE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveMobileTab(tab.id)}
            className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold tracking-wide transition ${
              activeMobileTab === tab.id
                ? "bg-emerald-400/16 text-text-main shadow-[0_4px_12px_rgba(0,0,0,0.2)] ring-1 ring-emerald-300/14"
                : "bg-[color-mix(in_srgb,var(--color-bg),black_3%)] text-text-secondary hover:bg-emerald-400/8 ring-1 ring-emerald-400/8"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:flex-1 xl:min-h-0 px-2 sm:px-0">
        {/* Left: Calendar */}
        <section className="xl:col-span-7 space-y-4 xl:min-h-0">
          <div className={`${cardClass} p-4 sm:p-5 xl:h-full xl:flex xl:flex-col ${visibleOnMobile("overview")}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={sectionTitleClass}>Monthly Schedule</h2>
              {loading && <span className="text-xs text-emerald-400 font-medium">Syncing...</span>}
            </div>
            <div className="xl:flex-1 xl:min-h-0">
              <MonthlyCalendar year={year} month={month} items={monthlyFeed} onQuickAdd={handleCalendarQuickAdd} />
            </div>
          </div>
        </section>

        {/* Right: Forms */}
        <section className="xl:col-span-5 space-y-4 xl:min-h-0 xl:overflow-y-auto xl:pr-2">
          {/* Form Tabs */}
          <div className={`${panelClass} p-2`}>
            <div className="grid grid-cols-3 gap-1.5 bg-[color-mix(in_srgb,var(--color-bg),black_2%)] rounded-2xl p-1.5 ring-1 ring-emerald-400/8">
              {[
                { id: "event", label: "Events", icon: CalendarIcon },
                { id: "bills", label: "Bills", icon: DollarSign },
                { id: "yearly", label: "Yearly", icon: null },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveFormTab(tab.id);
                    if (!isMdUp) setActiveMobileTab(tab.id);
                  }}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-xs font-semibold transition ${
                    activeFormTab === tab.id
                      ? "bg-emerald-400/12 text-text-main shadow-[0_4px_10px_rgba(0,0,0,0.18)] ring-1 ring-emerald-300/16"
                      : "text-text-secondary hover:bg-emerald-400/8"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Event Form Panel */}
          <form onSubmit={handleCreateEvent} className={`${panelClass} p-5 sm:p-6 space-y-5 ${visibleForm("event")}`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon size={16} className="text-emerald-400" />
                <h3 className={subsectionTitleClass}>Create Event</h3>
              </div>
              <p className="text-xs text-text-secondary">Add a new event to your calendar</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Event Title</label>
                <input
                  placeholder="Morning workout, client call..."
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className={`${inputClass} mt-2`}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  placeholder="Add notes, links, reminders..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className={`${inputClass} mt-2 min-h-[90px] resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>Date</label>
                <input
                  type="date"
                  value={eventForm.date}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                  className={`${inputClass} mt-2`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className={`${inputClass} mt-2`}
                  >
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                    <option value="bill">Bill</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Color</label>
                  <div className="mt-2">
                    <input
                      type="color"
                      value={eventForm.color}
                      onChange={(e) => setEventForm({ ...eventForm, color: e.target.value })}
                      className="h-[44px] w-full rounded-2xl bg-[color-mix(in_srgb,var(--color-bg),black_3%)] px-2 py-2 cursor-pointer ring-1 ring-emerald-400/14"
                    />
                  </div>
                </div>
              </div>

              <label className="inline-flex items-center gap-2.5 text-sm text-text-secondary cursor-pointer p-3 rounded-xl bg-[color-mix(in_srgb,var(--color-bg),black_2%)] ring-1 ring-emerald-400/10">
                <input
                  type="checkbox"
                  checked={eventForm.allDay}
                  onChange={(e) => setEventForm({ ...eventForm, allDay: e.target.checked })}
                  className="rounded border-emerald-400/16 bg-[color-mix(in_srgb,var(--color-bg),black_3%)] text-emerald-400 focus:ring-emerald-400/20"
                />
                Mark as all-day event
              </label>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-emerald-400/12 py-3 text-sm font-semibold text-text-main hover:bg-emerald-400/16 transition shadow-[0_6px_16px_rgba(0,0,0,0.2)] ring-1 ring-emerald-300/16"
            >
              Create Event
            </button>
          </form>

          {/* Bills Form Panel */}
          <div className={`${panelClass} overflow-hidden flex flex-col ${visibleForm("bills")}`}>
            {/* Bills Header */}
            <div className="p-5 sm:p-6 border-b border-emerald-400/10">
              <button
                className="w-full flex items-center justify-between gap-3 group"
                onClick={() => setShowBillList((v) => !v)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <div className="text-left">
                    <h3 className={subsectionTitleClass}>Monthly Bills</h3>
                    <p className="text-xs text-text-secondary mt-0.5">{bills.length} bills configured</p>
                  </div>
                </div>
                {showBillList ? (
                  <ChevronUp size={20} className="text-text-secondary group-hover:text-text-main transition" />
                ) : (
                  <ChevronDown size={20} className="text-text-secondary group-hover:text-text-main transition" />
                )}
              </button>
            </div>

            {/* Bills Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {showBillList && (
                <div className="flex-1 overflow-y-auto flex flex-col">
                  {bills.length === 0 ? (
                    <div className="p-5 sm:p-6 flex items-center justify-center min-h-[120px] text-sm italic text-text-secondary">
                      No bills configured yet
                    </div>
                  ) : (
                    <div className="p-4 sm:p-5 space-y-2 flex-1">
                      {bills.map((bill) => (
                        <div
                          key={bill._id}
                          className="rounded-xl bg-[color-mix(in_srgb,var(--color-bg),black_2%)] p-3 flex items-start justify-between gap-3 ring-1 ring-emerald-400/10 hover:ring-emerald-300/18 transition"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-text-main text-sm truncate">{bill.name}</p>
                            <p className="text-xs text-text-secondary mt-1 space-x-2">
                              <span className="text-emerald-400 font-semibold">${bill.amount}</span>
                              <span>•</span>
                              <span>Day {bill.dueDay}</span>
                              <span>•</span>
                              <span
                                className="font-semibold"
                                style={{
                                  color: billCategoryColors[bill.category] || DEFAULT_BILL_CATEGORY_COLORS.bill,
                                }}
                              >
                                {(bill.category || "bill").toUpperCase()}
                              </span>
                              {bill.autoPay && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-400/70">AutoPay</span>
                                </>
                              )}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => handleEditBill(bill)}
                              className="p-1.5 rounded-lg hover:bg-emerald-400/20 text-text-secondary hover:text-text-main transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteBill(bill._id)}
                              className="p-1.5 rounded-lg hover:bg-emerald-400/20 text-text-secondary hover:text-text-main transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add/Edit Bill Form */}
                  <div className="p-4 sm:p-5 border-t border-emerald-400/10 space-y-4">
                    <div className="rounded-xl bg-[color-mix(in_srgb,var(--color-bg),black_2%)] p-3 ring-1 ring-emerald-400/10">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-text-secondary font-semibold mb-2">
                        Bill Category Colors
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {BILL_CATEGORY_OPTIONS.map((category) => (
                          <label key={category} className="text-xs text-text-secondary">
                            <span className="block mb-1 font-semibold uppercase tracking-[0.08em]">{category}</span>
                            <input
                              type="color"
                              value={billCategoryColors[category] || DEFAULT_BILL_CATEGORY_COLORS[category]}
                              onChange={(e) =>
                                setBillCategoryColors((prev) => ({
                                  ...prev,
                                  [category]: e.target.value,
                                }))
                              }
                              className="h-9 w-full rounded-lg bg-[color-mix(in_srgb,var(--color-bg),black_3%)] px-1 cursor-pointer ring-1 ring-emerald-400/14"
                            />
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className={labelClass}>{editingBillId ? "Edit Bill" : "Add New Bill"}</label>
                        {editingBillId && (
                          <button
                            type="button"
                            onClick={handleCancelEditBill}
                            className="text-xs text-text-secondary hover:text-text-main inline-flex items-center gap-1"
                          >
                            <X size={12} /> Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    <form onSubmit={handleCreateOrUpdateBill} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          placeholder="Bill name"
                          value={billForm.name}
                          onChange={(e) => setBillForm({ ...billForm, name: e.target.value })}
                          className={inputClass}
                          required
                        />
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-text-secondary text-sm">$</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Amount"
                            value={billForm.amount}
                            onChange={(e) => setBillForm({ ...billForm, amount: parseFloat(e.target.value || 0) })}
                            className={`${inputClass} pl-7`}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="number"
                          min="1"
                          max="31"
                          placeholder="Due day"
                          value={billForm.dueDay}
                          onChange={(e) => setBillForm({ ...billForm, dueDay: parseInt(e.target.value || 1, 10) })}
                          className={inputClass}
                          required
                        />
                        <select
                          value={billForm.category}
                          onChange={(e) => setBillForm({ ...billForm, category: e.target.value })}
                          className={inputClass}
                        >
                          {BILL_CATEGORY_OPTIONS.map((category) => (
                            <option key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <label className="inline-flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                          <input
                            type="checkbox"
                            checked={billForm.autoPay}
                            onChange={(e) => setBillForm({ ...billForm, autoPay: e.target.checked })}
                            className="rounded border-emerald-400/16 bg-[color-mix(in_srgb,var(--color-bg),black_3%)] text-emerald-400"
                          />
                          Auto-Pay
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                          <input
                            type="checkbox"
                            checked={billForm.isActive}
                            onChange={(e) => setBillForm({ ...billForm, isActive: e.target.checked })}
                            className="rounded border-emerald-400/16 bg-[color-mix(in_srgb,var(--color-bg),black_3%)] text-emerald-400"
                          />
                          Active
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="w-full rounded-xl py-2.5 text-sm font-semibold bg-emerald-400/10 text-text-main hover:bg-emerald-400/14 transition ring-1 ring-emerald-300/14"
                      >
                        <span className="inline-flex items-center justify-center gap-2">
                          {editingBillId ? <RefreshCw size={14} /> : <Plus size={14} />}
                          {editingBillId ? "Update" : "Add Bill"}
                        </span>
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Yearly Events Form Panel */}
          <form onSubmit={handleCreateYearly} className={`${panelClass} p-5 sm:p-6 space-y-5 ${visibleForm("yearly")}`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <h3 className={subsectionTitleClass}>Create Yearly Event</h3>
              </div>
              <p className="text-xs text-text-secondary">Add birthdays, anniversaries, and milestones</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Event Title</label>
                <input
                  placeholder="Birthday, anniversary, milestone..."
                  value={yearlyForm.title}
                  onChange={(e) => setYearlyForm({ ...yearlyForm, title: e.target.value })}
                  className={`${inputClass} mt-2`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Month</label>
                  <select
                    value={yearlyForm.month}
                    onChange={(e) => setYearlyForm({ ...yearlyForm, month: parseInt(e.target.value, 10) })}
                    className={`${inputClass} mt-2`}
                  >
                    {MONTH_OPTIONS.map((name, idx) => (
                      <option key={name} value={idx + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Day</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={yearlyForm.day}
                    onChange={(e) => setYearlyForm({ ...yearlyForm, day: parseInt(e.target.value || 1, 10) })}
                    className={`${inputClass} mt-2`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Category</label>
                  <select
                    value={yearlyForm.category}
                    onChange={(e) => setYearlyForm({ ...yearlyForm, category: e.target.value })}
                    className={`${inputClass} mt-2`}
                  >
                    <option value="birthday">Birthday</option>
                    <option value="anniversary">Anniversary</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Color</label>
                  <div className="mt-2">
                    <input
                      type="color"
                      value={yearlyForm.color}
                      onChange={(e) => setYearlyForm({ ...yearlyForm, color: e.target.value })}
                      className="h-[44px] w-full rounded-2xl bg-[color-mix(in_srgb,var(--color-bg),black_3%)] px-2 py-2 cursor-pointer ring-1 ring-emerald-400/14"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-emerald-400/12 py-3 text-sm font-semibold text-text-main hover:bg-emerald-400/16 transition shadow-[0_6px_16px_rgba(0,0,0,0.2)] ring-1 ring-emerald-300/16"
            >
              Create Yearly Event
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
