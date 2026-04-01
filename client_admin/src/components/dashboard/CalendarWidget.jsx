import { useState, useEffect } from "react";
import api from "../../services/api";
import Widget from "../ui/Widget";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CalendarWidget = ({ compact = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bills, setBills] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [pendingToggles, setPendingToggles] = useState({});

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

  const getBillColor = (amount) => {
    if (amount < 20) return "bg-green-500";
    if (amount <= 100) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
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
        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
        const isToday = day.getTime() === today.getTime();
        const isSelected =
          selectedDate &&
          day.getTime() ===
            new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime();

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
            key={day}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <div className="relative inline-flex">
              <span className={`peer text-xs ${isToday ? "font-bold text-white" : ""}`}>{day.getDate()}</span>

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
                              const nextPaid = e.target.checked;
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

    const billsForSelectedDay = bills.filter((b) => b.dueDay === selectedDate.getDate());

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

  const monthlyTotal = bills.reduce((acc, bill) => acc + bill.amount, 0);
  const monthlyPaid = bills
    .filter((bill) => bill.paidForMonths?.includes(currentMonthKey))
    .reduce((acc, bill) => acc + bill.amount, 0);
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
