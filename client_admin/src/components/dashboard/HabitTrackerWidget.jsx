import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Widget from "../ui/Widget";
import { CheckSquare } from "lucide-react";

const HabitTrackerWidget = () => {
  const [habits, setHabits] = useState([]);
  const { setUser, user } = useAuth();
  const [notifications, setNotifications] = useState([]); // toast-style dopamine messages
  const [completingId, setCompletingId] = useState(null);

  const pushNotification = (message) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, message, fading: false }]);
    // Start fade then remove
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
    // Optimistic update: mark as completed immediately
    const todayISO = new Date().toISOString();
    const prevHabits = habits;
    setHabits((prev) => prev.map((h) => (h?._id === habitId ? { ...h, lastCompletedDate: todayISO } : h)));
    try {
      const prevTemu = user?.temuTokens || 0;
      const response = await api.post(`/habits/${habitId}/complete`);
      // Merge with server response to keep data in sync
      const returnedHabit = response.data.habitData || response.data.data || {};
      setHabits((prev) => prev.map((h) => (h?._id === habitId ? { ...h, ...returnedHabit } : h)));

      const updatedUserData = response.data.userData;
      if (updatedUserData) {
        setUser((prevUser) => ({ ...prevUser, ...updatedUserData }));
        const newTemu = updatedUserData.temuTokens;
        if (typeof newTemu === "number" && newTemu > prevTemu) {
          const gained = newTemu - prevTemu;
          const phrases = [
            `Momentum! +${gained} Temu ⚡`,
            `Streak fuel: +${gained} Temu 🔥`,
            `Level up! +${gained} Temu ✨`,
            `Habit crushed! +${gained} Temu 💪`,
            `Dopamine boost! +${gained} Temu 🧠`,
            `Vault credit: +${gained} Temu 💎`,
          ];
          pushNotification(phrases[Math.floor(Math.random() * phrases.length)]);
        } else {
          pushNotification("Habit logged ✅");
        }
      } else {
        pushNotification("Habit logged ✅");
      }
    } catch (err) {
      // Revert optimistic update on failure
      setHabits(prevHabits);
      console.error("Failed to complete habit from widget:", err);
      pushNotification(err.response?.data?.message || "Completion failed ❌");
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

  // Show up to 10 habits, completed or not
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
                <span
                  className={
                    completed ? "text-status-success line-through decoration-status-success/60" : "text-text-secondary"
                  }
                >
                  {habit.name}
                </span>
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
      {/* Global portal for notifications positioned below header and left of right sidebar */}
      {createPortal(
        <div
          aria-live="polite"
          className="fixed z-[60] flex flex-col gap-2 pointer-events-none"
          style={{
            top: 52, // just below header (48px height + small offset)
            right: "var(--right-sidebar-width)", // align to left edge of right sidebar
            maxWidth: 240,
          }}
        >
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`group toast-pop ${
                n.fading ? "toast-fading" : ""
              } toast-glow relative px-3 py-2 rounded-md border shadow-xl backdrop-blur-md bg-surface/90 border-primary/40 text-text-main text-xs font-semibold flex items-center gap-2 tracking-wide`}
              style={{
                boxShadow: "0 4px 14px -2px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.05)",
              }}
            >
              <div className="toast-accent w-1 h-5 rounded-full" />
              <span className="flex-1">{n.message}</span>
              <span className="text-[9px] text-text-tertiary opacity-60">HABIT</span>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </Widget>
  );
};

export default HabitTrackerWidget;
