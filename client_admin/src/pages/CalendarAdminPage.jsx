import { useEffect, useMemo, useState } from "react";
import { calendarService } from "../services/calendarService";
import MonthlyCalendar from "../components/calendar/MonthlyCalendar";
import { Edit2, Trash2, Check, X, Plus, DollarSign, Calendar as CalendarIcon, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

export default function CalendarAdminPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12

  const [events, setEvents] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // View toggle
  const [showBillList, setShowBillList] = useState(true);

  // Bill Editing
  const [editingBillId, setEditingBillId] = useState(null);

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
    category: "general",
    notes: "",
    autoPay: false,
    isActive: true,
  });
  const [yearlyForm, setYearlyForm] = useState({
    title: "",
    month: month,
    day: 1,
    category: "birthday",
    color: "#10b981",
    notes: "",
    isActive: true,
  });

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
  const [monthlyFeed, setMonthlyFeed] = useState([]);
  useEffect(() => {
    calendarService
      .getMonthlySchedule(monthlyItems)
      .then(setMonthlyFeed)
      .catch(() => setMonthlyFeed([]));
  }, [monthlyItems.year, monthlyItems.month, events, bills]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await calendarService.createEvent({ ...eventForm, date: new Date(eventForm.date) });
      setEventForm({ title: "", description: "", date: "", allDay: true, category: "personal", color: "#4f46e5" });
      await refresh();
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
      setBillForm({ name: "", amount: 0, dueDay: 1, category: "general", notes: "", autoPay: false, isActive: true });
      setEditingBillId(null);
      await refresh();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to save bill");
    }
  };

  const handleEditBill = (bill) => {
    setBillForm({ ...bill });
    setEditingBillId(bill._id);
    // Scroll to form if needed, or maybe put form in a modal later. For now, inline is fine.
  };

  const handleCancelEditBill = () => {
    setBillForm({ name: "", amount: 0, dueDay: 1, category: "general", notes: "", autoPay: false, isActive: true });
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
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to create yearly event");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 w-full">
        <h1 className="text-3xl font-bold text-main">Calendar Admin</h1>
      </div>

      {error && <div className="mb-4 text-red-400">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-3">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="p-2 rounded border"
              style={{
                backgroundColor: "var(--color-bg)",
                borderColor: "var(--color-primary)",
                color: "var(--color-text-main)",
              }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value || now.getFullYear()))}
              className="p-2 rounded border"
              style={{
                backgroundColor: "var(--color-bg)",
                borderColor: "var(--color-primary)",
                color: "var(--color-text-main)",
              }}
            />
            <button
              onClick={() => calendarService.getMonthlySchedule({ year, month }).then(setMonthlyFeed)}
              className="px-3 py-2 rounded bg-primary/20 hover:bg-primary/30 border border-primary/40 text-main"
            >
              Refresh
            </button>
          </div>
          <MonthlyCalendar year={year} month={month} items={monthlyFeed} />
        </div>

        <div className="space-y-6">
          <form
            onSubmit={handleCreateEvent}
            className="p-4 rounded-lg border shadow-sm"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-primary)" }}
          >
            <h2 className="text-xl font-semibold text-main mb-3">Add Event</h2>
            <input
              placeholder="Title"
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              className="w-full p-2 mb-2 rounded border"
              style={{
                backgroundColor: "var(--color-bg)",
                borderColor: "var(--color-primary)",
                color: "var(--color-text-main)",
              }}
            />
            <textarea
              placeholder="Description"
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              className="w-full p-2 mb-2 rounded border"
              style={{
                backgroundColor: "var(--color-bg)",
                borderColor: "var(--color-primary)",
                color: "var(--color-text-main)",
              }}
            />
            <input
              type="date"
              value={eventForm.date}
              onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
              className="w-full p-2 mb-2 rounded border"
              style={{
                backgroundColor: "var(--color-bg)",
                borderColor: "var(--color-primary)",
                color: "var(--color-text-main)",
              }}
            />
            <div className="flex items-center gap-2 mb-2">
              <label className="text-text-secondary text-sm">All Day</label>
              <input
                type="checkbox"
                checked={eventForm.allDay}
                onChange={(e) => setEventForm({ ...eventForm, allDay: e.target.checked })}
              />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-text-secondary text-sm">Category</label>
              <select
                value={eventForm.category}
                onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                className="p-2 rounded border"
                style={{
                  backgroundColor: "var(--color-bg)",
                  borderColor: "var(--color-primary)",
                  color: "var(--color-text-main)",
                }}
              >
                <option value="personal">Personal</option>
                <option value="work">Work</option>
                <option value="bill">Bill</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <label className="text-text-secondary text-sm">Color</label>
              <input
                type="color"
                value={eventForm.color}
                onChange={(e) => setEventForm({ ...eventForm, color: e.target.value })}
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 rounded bg-primary/20 hover:bg-primary/30 border border-primary/40 text-main"
            >
              Create Event
            </button>
          </form>

          {/* Bill Management Section */}
          <div className="rounded-lg border shadow-sm" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-primary)" }}>
             <div className="p-4 border-b" style={{ borderColor: 'var(--color-primary)' }}>
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowBillList(!showBillList)}>
                   <h2 className="text-xl font-semibold text-main flex items-center gap-2">
                      <DollarSign className="text-emerald-400" size={20} /> 
                      Monthly Bills
                   </h2>
                   {showBillList ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
             </div>
             
             {showBillList && (
                <div className="p-4 space-y-4">
                    {/* List of Bills */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                        {bills.length === 0 ? (
                            <p className="text-text-secondary text-sm italic">No active bills configured.</p>
                        ) : (
                            bills.map(bill => (
                                <div key={bill._id} className="flex justify-between items-center p-3 rounded bg-black/20 border border-white/5 hover:border-white/20 transition-colors group">
                                    <div>
                                        <div className="font-medium text-white">{bill.name}</div>
                                        <div className="text-xs text-text-secondary flex gap-2">
                                            <span className="text-emerald-400">${bill.amount}</span>
                                            <span>•</span>
                                            <span>Due Day: {bill.dueDay}</span>
                                            {bill.autoPay && <span className="text-blue-400">• AutoPay</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditBill(bill)} className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400 transition-colors" title="Edit">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDeleteBill(bill._id)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors" title="Delete">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="w-full h-px bg-white/10 my-4" />

                    {/* Edit/Create Form */}
                    <form onSubmit={handleCreateOrUpdateBill} className="space-y-3">
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                                {editingBillId ? "Edit Bill" : "Add New Bill"}
                             </h3>
                             {editingBillId && (
                                 <button type="button" onClick={handleCancelEditBill} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                                    <X size={12} /> Cancel Edit
                                 </button>
                             )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                placeholder="Name (e.g. Rent)"
                                value={billForm.name}
                                onChange={(e) => setBillForm({ ...billForm, name: e.target.value })}
                                className="w-full p-2 rounded border text-sm"
                                style={{
                                    backgroundColor: "var(--color-bg)",
                                    borderColor: "var(--color-primary)",
                                    color: "var(--color-text-main)",
                                }}
                                required
                            />
                            <div className="relative">
                                <span className="absolute left-2 top-2 text-text-secondary">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Amount"
                                    value={billForm.amount}
                                    onChange={(e) => setBillForm({ ...billForm, amount: parseFloat(e.target.value || 0) })}
                                    className="w-full p-2 pl-6 rounded border text-sm"
                                    style={{
                                        backgroundColor: "var(--color-bg)",
                                        borderColor: "var(--color-primary)",
                                        color: "var(--color-text-main)",
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                min="1"
                                max="31"
                                placeholder="Due Day (1-31)"
                                value={billForm.dueDay}
                                onChange={(e) => setBillForm({ ...billForm, dueDay: parseInt(e.target.value || 1) })}
                                className="w-full p-2 rounded border text-sm"
                                style={{
                                    backgroundColor: "var(--color-bg)",
                                    borderColor: "var(--color-primary)",
                                    color: "var(--color-text-main)",
                                }}
                                required
                            />
                            <input
                                placeholder="Category"
                                value={billForm.category}
                                onChange={(e) => setBillForm({ ...billForm, category: e.target.value })}
                                className="w-full p-2 rounded border text-sm"
                                style={{
                                    backgroundColor: "var(--color-bg)",
                                    borderColor: "var(--color-primary)",
                                    color: "var(--color-text-main)",
                                }}
                            />
                        </div>

                         <div className="flex items-center gap-4 py-1">
                             <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={billForm.autoPay}
                                    onChange={(e) => setBillForm({ ...billForm, autoPay: e.target.checked })}
                                    className="rounded border-gray-600 bg-black/40 text-emerald-500 focus:ring-offset-0 focus:ring-emerald-500"
                                />
                                Auto-Pay
                             </label>
                             <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={billForm.isActive}
                                    onChange={(e) => setBillForm({ ...billForm, isActive: e.target.checked })}
                                    className="rounded border-gray-600 bg-black/40 text-emerald-500 focus:ring-offset-0 focus:ring-emerald-500"
                                />
                                Active
                             </label>
                        </div>
                        
                        <button
                            type="submit"
                            className={`w-full py-2 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                                editingBillId 
                                ? "bg-blue-600/20 text-blue-400 border border-blue-500/50 hover:bg-blue-600/30" 
                                : "bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-600/30"
                            }`}
                        >
                            {editingBillId ? <RefreshCw size={16} /> : <Plus size={16} />}
                            {editingBillId ? "Update Bill" : "Create Bill"}
                        </button>
                    </form>
                </div>
             )}
          </div>

          <form
            onSubmit={handleCreateYearly}
            className="p-4 rounded-lg border shadow-sm"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-primary)" }}
          >
            <h2 className="text-xl font-semibold text-main mb-3">Add Yearly Event</h2>
            <input
              placeholder="Title"
              value={yearlyForm.title}
              onChange={(e) => setYearlyForm({ ...yearlyForm, title: e.target.value })}
              className="w-full p-2 mb-2 rounded border"
              style={{
                backgroundColor: "var(--color-bg)",
                borderColor: "var(--color-primary)",
                color: "var(--color-text-main)",
              }}
            />
            <div className="flex items-center gap-2 mb-2">
              <label className="text-text-secondary text-sm">Month</label>
              <select
                value={yearlyForm.month}
                onChange={(e) => setYearlyForm({ ...yearlyForm, month: parseInt(e.target.value) })}
                className="p-2 rounded border"
                style={{
                  backgroundColor: "var(--color-bg)",
                  borderColor: "var(--color-primary)",
                  color: "var(--color-text-main)",
                }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <label className="text-text-secondary text-sm">Day</label>
              <input
                type="number"
                min="1"
                max="31"
                value={yearlyForm.day}
                onChange={(e) => setYearlyForm({ ...yearlyForm, day: parseInt(e.target.value || 1) })}
                className="p-2 rounded border"
                style={{
                  backgroundColor: "var(--color-bg)",
                  borderColor: "var(--color-primary)",
                  color: "var(--color-text-main)",
                }}
              />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-text-secondary text-sm">Category</label>
              <select
                value={yearlyForm.category}
                onChange={(e) => setYearlyForm({ ...yearlyForm, category: e.target.value })}
                className="p-2 rounded border"
                style={{
                  backgroundColor: "var(--color-bg)",
                  borderColor: "var(--color-primary)",
                  color: "var(--color-text-main)",
                }}
              >
                <option value="birthday">Birthday</option>
                <option value="anniversary">Anniversary</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <label className="text-text-secondary text-sm">Color</label>
              <input
                type="color"
                value={yearlyForm.color}
                onChange={(e) => setYearlyForm({ ...yearlyForm, color: e.target.value })}
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 rounded bg-primary/20 hover:bg-primary/30 border border-primary/40 text-main"
            >
              Create Yearly
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
