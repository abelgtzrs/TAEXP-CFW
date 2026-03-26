import { useState, useEffect } from "react";
import api from "../../services/api";
import Widget from "../ui/Widget";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CalendarWidget = ({ compact = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bills, setBills] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const response = await api.get("/finance/bills");
        setBills(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch bills for calendar:", error);
      }
    };
    fetchBills();
  }, []);

  const getBillColor = (amount) => {
    if (amount < 15) return "bg-green-500";
    if (amount >= 15 && amount < 50) return "bg-yellow-500";
    if (amount >= 50 && amount <= 200) return "bg-blue-500";
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

    const rows = [];
    let days = [];
    let day = startDate;
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = new Date(day);
        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
        const isToday = day.getTime() === today.getTime();
        const isSelected =
          selectedDate &&
          day.getTime() ===
            new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime();

        const billsForDay = bills.filter((b) => b.dueDay === day.getDate());

        days.push(
          <div
            className={`p-1 h-12 flex flex-col items-center justify-start cursor-pointer border rounded-lg transition-colors
              ${!isCurrentMonth ? "text-text-tertiary border-transparent" : "text-text-main border-transparent"}
              ${isToday ? "bg-primary/30 ring-2 ring-primary/70" : ""}
              ${isSelected ? "border-primary" : ""}
              hover:bg-gray-700/50`}
            key={day}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <span className={`text-xs ${isToday ? "font-bold text-white" : ""}`}>{day.getDate()}</span>
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
          </div>
        );
        day.setDate(day.getDate() + 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1" key={day}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
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
          <p className="text-xs text-text-tertiary">No bills due on this day.</p>
        )}
        {/* Placeholder for other scheduled events */}
      </div>
    );
  };

  return (
    <Widget
      title="Monthly Schedule"
      className="flex flex-col h-auto"
      padding={compact ? "p-3" : "p-6"}
    >
      <div className="flex-grow">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>
      {renderSelectedDayInfo()}
    </Widget>
  );
};

export default CalendarWidget;
