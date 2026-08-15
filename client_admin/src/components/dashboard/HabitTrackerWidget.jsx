import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Widget from "../ui/Widget";
import { CheckSquare, Fan, Flame, XCircle } from "lucide-react";

const HabitTrackerWidget = () => {
  const [habits, setHabits] = useState([]);
  const { setUser, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [completingId, setCompletingId] = useState(null);

  const pushNotification = (message, { type = "success", reward = null } = {}) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, message, type, reward, fading: false }]);
    setTimeout(() => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, fading: true } : n)));
    }, 2600);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3200);
  };

  const fetchHabits = async () => {
    try {
      const response = await api.get("/habits");
      setHabits(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch habits for widget:", error);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleCompleteHabit = async (habitId) => {
    setCompletingId(habitId);
    setTimeout(() => setCompletingId(null), 750);
    const todayISO = new Date().toISOString();
    const prevHabits = habits;
    setHabits((prev) => prev.map((h) => (h?._id === habitId ? { ...h, lastCompletedDate: todayISO } : h)));
    try {
      const prevTemu = user?.temuTokens || 0;
      const response = await api.post(`/habits/${habitId}/complete`);
      const returnedHabit = response.data.habitData || response.data.data || {};
      setHabits((prev) => prev.map((h) => (h?._id === habitId ? { ...h, ...returnedHabit } : h)));

      const updatedUserData = response.data.userData;
      if (updatedUserData) {
        setUser((prevUser) => ({ ...prevUser, ...updatedUserData }));
        const newTemu = updatedUserData.temuTokens;
        if (typeof newTemu === "number" && newTemu > prevTemu) {
          pushNotification("Objective complete", { reward: newTemu - prevTemu });
        } else {
          pushNotification("Objective complete");
        }
      } else {
        pushNotification("Objective complete");
      }
    } catch (err) {
      setHabits(prevHabits);
      console.error("Failed to complete habit from widget:", err);
      pushNotification(err.response?.data?.message || "Could not complete objective", { type: "error" });
    }
  };

  const isCompletedToday = (habit) => {
    if (!habit || !habit.lastCompletedDate) {
      return false;
    }
    const today = new Date();
    const lastCompletion = new Date(habit.lastCompletedDate);
    return today.toDateString() === lastCompletion.toDateString();
  };

  const shownHabits = habits.filter(Boolean).slice(0, 10);

  return (
    <Widget title="Today's Directives" className="h-auto">
      <div className="space-y-2">
        {shownHabits.length > 0 ? (
          shownHabits.map((habit, index) => {
            const completed = isCompletedToday(habit);
            const bgColors = [
              "bg-slate-800/30",
              "bg-blue-900/20",
              "bg-purple-900/20",
              "bg-green-900/20",
              "bg-amber-900/20",
              "bg-red-900/20",
              "bg-cyan-900/20",
              "bg-pink-900/20",
              "bg-indigo-900/20",
              "bg-teal-900/20",
            ];
            const bgColor = bgColors[index % bgColors.length];

            const isCompleting = completingId === habit._id;
            return (
              <div
                key={habit._id}
                onClick={() => {
                  if (!completed) {
                    handleCompleteHabit(habit._id);
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && !completed) {
                    handleCompleteHabit(habit._id);
                  }
                }}
                className={`flex items-center justify-between text-sm py-2 px-3 rounded-lg border select-none transition-all duration-200 ${isCompleting ? "habit-completing" : ""} ${
                  completed
                    ? "bg-status-success/10 border-status-success/40 cursor-default"
                    : `${bgColor} border-gray-700/50 cursor-pointer hover:border-status-success/70`
                }`}
                aria-disabled={completed}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`truncate ${
                      completed ? "text-status-success line-through decoration-status-success/60" : "text-text-secondary"
                    }`}
                  >
                    {habit.name}
                  </span>
                  {habit.streak > 0 && (
                    <span
                      className="flex-none flex items-center gap-0.5 text-[10px] font-bold text-orange-400"
                      title={`Longest streak: ${habit.longestStreak || 0} days`}
                    >
                      <Flame size={11} />
                      {habit.streak}
                    </span>
                  )}
                </div>
                <div className={`flex items-center gap-1.5 ${completed ? "text-status-success" : "text-gray-500"}`}>
                  {completed && (
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Done</span>
                  )}
                  <span className={isCompleting ? "habit-completing-check" : ""}>
                    <CheckSquare size={18} />
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-text-tertiary py-2">All habits completed for today!</p>
        )}
      </div>
      <Link to="/habits" className="text-sm text-primary hover:underline mt-4 block text-right">
        View All Habits &rarr;
      </Link>
      {createPortal(
        <div
          aria-live="polite"
          className="fixed z-[60] flex flex-col gap-2 pointer-events-none"
          style={{
            top: 52,
            right: "var(--right-sidebar-width)",
            width: 220,
          }}
        >
          {notifications.map((n) => {
            const isError = n.type === "error";
            return (
              <div
                key={n.id}
                className={`habit-toast-pop ${n.fading ? "toast-fading" : ""} ${
                  isError ? "" : "habit-toast-glow"
                } relative flex flex-col gap-1.5 px-3 py-2.5 rounded-xl border shadow-xl backdrop-blur-md overflow-hidden ${
                  isError
                    ? "bg-status-error/10 border-status-error/40 text-status-error"
                    : "bg-surface/95 border-status-success/40 text-text-main"
                }`}
                style={{
                  boxShadow: isError
                    ? "0 6px 18px -4px rgba(239,68,68,0.35), 0 0 0 1px rgba(255,255,255,0.04)"
                    : "0 6px 18px -4px rgba(34,197,94,0.35), 0 0 0 1px rgba(255,255,255,0.05)",
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex-none w-6 h-6 rounded-full flex items-center justify-center ${
                      isError
                        ? "bg-status-error/15 text-status-error"
                        : "habit-toast-icon bg-status-success/15 text-status-success"
                    }`}
                  >
                    {isError ? <XCircle size={14} /> : <Fan size={13} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-tight">{n.message}</p>
                  </div>
                  {n.reward != null && (
                    <span className="flex-none text-[10px] font-bold text-amber-300 bg-amber-400/10 border border-amber-400/30 rounded-full px-1.5 py-0.5">
                      +{n.reward} TT
                    </span>
                  )}
                </div>
                {!isError && (
                  <div className="habit-toast-bar absolute left-0 bottom-0 h-0.5 w-full bg-status-success/70" />
                )}
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </Widget>
  );
};

export default HabitTrackerWidget;
