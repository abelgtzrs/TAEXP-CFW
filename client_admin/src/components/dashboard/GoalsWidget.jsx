import { useEffect, useState } from "react";
import { Check, Hash, Plus, X } from "lucide-react";
import Widget from "../ui/Widget";
import api from "../../services/api";

const getGoalPercent = (goal) => Math.min(100, Math.round((Number(goal.current) / Number(goal.target || 1)) * 100));

// Stable fallback: a fresh `[]` default each render re-triggers the sync effect below forever.
const NO_GOALS = [];

const GoalsWidget = ({ allGoals = NO_GOALS, loading }) => {
  const [goals, setGoals] = useState(allGoals);
  const [customIncrement, setCustomIncrement] = useState({ index: null, val: "" });

  useEffect(() => {
    setGoals(allGoals);
  }, [allGoals]);

  const handleAdd = async (index, amountToAdd) => {
    const add = Number(amountToAdd);
    if (Number.isNaN(add) || add <= 0) return;

    const updated = [...goals];
    const goal = updated[index];
    goal.current = Math.min(Number(goal.current) + add, Number(goal.target));
    setGoals(updated);
    setCustomIncrement({ index: null, val: "" });

    try {
      const res = await api.put("/users/me/goals", { goals: updated });
      setGoals(res.data.data || updated);
    } catch (err) {
      console.error("Failed to update goal progress", err);
    }
  };

  return (
    <Widget title="Yearly Targets">
      {loading ? (
        <p className="text-sm text-text-tertiary">Loading...</p>
      ) : goals.length === 0 ? (
        <p className="text-sm text-text-tertiary">No yearly targets yet.</p>
      ) : (
        <div className="dash-rows -my-2.5">
          {goals.slice(0, 4).map((goal, index) => {
            const pct = getGoalPercent(goal);
            const isCompleted = Number(goal.current) >= Number(goal.target);
            const isEditing = customIncrement.index === index;

            return (
              <div key={goal._id || index} className="space-y-2 py-2.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-text-main">{goal.name}</p>
                    <p className="text-[11px] text-text-secondary tabular-nums">
                      <span className="dash-value">{goal.current}</span> / {goal.target} {goal.metric}
                      <span className="ml-2">{pct}%</span>
                    </p>
                  </div>

                  {!isCompleted && (
                    <div className="shrink-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            className="dash-input w-16 text-right tabular-nums"
                            value={customIncrement.val}
                            onChange={(e) => setCustomIncrement((prev) => ({ ...prev, val: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAdd(index, customIncrement.val);
                            }}
                            placeholder="Amt"
                            autoFocus
                          />
                          <button
                            onClick={() => handleAdd(index, customIncrement.val)}
                            className="dash-btn dash-btn-icon dash-btn-primary"
                            title="Add amount"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setCustomIncrement({ index: null, val: "" })}
                            className="dash-btn dash-btn-icon"
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAdd(index, 1)}
                            className="dash-btn dash-btn-icon dash-btn-primary"
                            title="Add 1"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            onClick={() => setCustomIncrement({ index, val: "" })}
                            className="dash-btn dash-btn-icon"
                            title="Add specific amount"
                          >
                            <Hash size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="dash-meter">
                  <span className={isCompleted ? "!bg-emerald-400" : ""} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Widget>
  );
};

export default GoalsWidget;
