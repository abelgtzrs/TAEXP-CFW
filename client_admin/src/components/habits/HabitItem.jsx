import { Trash2, Flame, Trophy } from "lucide-react";

const HabitItem = ({ habit, onComplete, onDelete }) => {
  // Helper function to check if the habit was already completed today
  const isCompletedToday = () => {
    if (!habit || !habit.lastCompletedDate) return false;
    return new Date(habit.lastCompletedDate).toDateString() === new Date().toDateString();
  };

  const completed = isCompletedToday();
  const streak = habit.streak || 0;
  const longestStreak = habit.longestStreak || 0;

  return (
    <div
      className={`p-4 rounded-lg flex items-center justify-between transition-all duration-300 border`}
      style={{
        background: completed ? "color-mix(in srgb, var(--color-surface), #16a34a 10%)" : "var(--color-surface)",
        borderColor: completed ? "#16a34a80" : "var(--color-primary)",
      }}
    >
      <div>
        <h3 className={`text-lg font-medium ${completed ? "text-green-300 line-through" : "text-text-main"}`}>
          {habit.name}
        </h3>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-sm text-text-secondary">
            <Flame size={14} className="text-orange-400" />
            <span className="text-primary font-bold">{streak}</span> day streak
          </span>
          <span className="flex items-center gap-1 text-xs text-text-tertiary" title="Longest streak">
            <Trophy size={13} className="text-amber-400" />
            Best: <span className="font-semibold text-amber-300">{longestStreak}</span>
          </span>
        </div>
        {habit.description && <p className="text-xs text-text-secondary mt-1">{habit.description}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onComplete(habit._id)}
          disabled={completed}
          className={`font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-300 ${
            completed ? "opacity-60 cursor-not-allowed bg-primary text-white" : "bg-primary hover:opacity-90 text-white"
          }`}
        >
          {completed ? "Done ✅" : "Complete"}
        </button>
        <button
          onClick={() => onDelete(habit._id)}
          className="p-2 text-text-secondary hover:text-red-500"
          title="Delete Habit"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default HabitItem;
