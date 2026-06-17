import { useEffect, useState } from "react";
import { Check, Hash, Plus, X } from "lucide-react";
import Widget from "../ui/Widget";
import api from "../../services/api";

const getGoalPercent = (goal) => Math.min(100, Math.round((Number(goal.current) / Number(goal.target || 1)) * 100));

const GoalsWidget = ({ allGoals = [], loading }) => {
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
        <div className="space-y-3">
          {goals.slice(0, 4).map((goal, index) => {
            const pct = getGoalPercent(goal);
            const isCompleted = Number(goal.current) >= Number(goal.target);
            const isEditing = customIncrement.index === index;

            return (
              <div key={goal._id || index} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{goal.name}</p>
                    <p className="text-[11px] text-text-tertiary">
                      {goal.current}/{goal.target} {goal.metric}
                    </p>
                  </div>

                  {!isCompleted && (
                    <div className="shrink-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1 rounded border border-white/15 bg-black/30 px-1 py-0.5">
                          <input
                            type="number"
                            min="1"
                            className="h-7 w-14 bg-transparent text-right text-xs font-bold text-white placeholder-white/30 focus:outline-none"
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
                            className="flex h-7 w-7 items-center justify-center rounded text-emerald-400 hover:bg-white/10"
                            title="Add amount"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setCustomIncrement({ index: null, val: "" })}
                            className="flex h-7 w-7 items-center justify-center rounded text-red-400 hover:bg-white/10"
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAdd(index, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black"
                            title="Add 1"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            onClick={() => setCustomIncrement({ index, val: "" })}
                            className="flex h-7 w-7 items-center justify-center rounded border border-white/10 bg-white/5 text-slate-400 hover:bg-blue-500 hover:text-white"
                            title="Add specific amount"
                          >
                            <Hash size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-black/40">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
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
