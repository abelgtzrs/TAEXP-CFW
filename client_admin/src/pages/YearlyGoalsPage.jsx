import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, Save, X, Trophy, Target, TrendingUp, CheckCircle2 } from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import StyledInput from "../components/ui/StyledInput";
import { emitToast } from "../utils/toastBus";

const YearlyGoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // Index or null
  const [newGoal, setNewGoal] = useState(null); // Object or null

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await api.get("/users/me/goals");
      setGoals(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch goals", err);
    } finally {
      setLoading(false);
    }
  };

  const saveGoals = async (updatedGoals) => {
    try {
      const res = await api.put("/users/me/goals", { goals: updatedGoals });
      setGoals(res.data.data);
      emitToast({
        title: "Goals Updated",
        message: "Your yearly targets have been saved.",
        type: "success",
      });
      return true;
    } catch (err) {
      console.error("Failed to update goals", err);
      emitToast({
        title: "Error",
        message: "Could not save changes.",
        type: "error",
      });
      return false;
    }
  };

  const handleUpdateProgress = async (index, newCurrent) => {
    const updated = [...goals];
    // Ensure numeric
    updated[index].current = Math.min(Number(newCurrent), updated[index].target);
    // Don't save on every keystroke if typing, but for buttons yes.
    // For this simple version, let's just update local state and have a separate save button? 
    // No, "satisfying" implies immediate feedback.
    // But sending a request on every increment is bad. Debounce or save on blur?
    // Let's optimistic update and save.
    setGoals(updated);
    
    // Check if goal just completed
    if (updated[index].current >= updated[index].target && goals[index].current < goals[index].target) {
        emitToast({ title: "Goal Reached!", message: `You completed ${updated[index].name}!`, type: "success" });
    }

    await api.put("/users/me/goals", { goals: updated });
  };

  const handleDelete = async (index) => {
    if (!window.confirm("Delete this goal?")) return;
    const updated = goals.filter((_, i) => i !== index);
    await saveGoals(updated);
  };

  const handleSaveEdit = async (index, editedData) => {
    const updated = [...goals];
    updated[index] = { ...updated[index], ...editedData };
    const success = await saveGoals(updated);
    if (success) setEditingId(null);
  };

  const handleCreate = async () => {
    if (!newGoal.name || !newGoal.target) return;
    const updated = [...goals, { ...newGoal, current: 0 }];
    const success = await saveGoals(updated);
    if (success) setNewGoal(null);
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Yearly Targets"
        subtitle="Track your big picture progress for the year."
        icon={Trophy}
      />

      {loading ? (
        <div className="animate-pulse flex gap-4 flex-wrap">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-full md:w-1/3 h-48 bg-white/5 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal, index) => (
            <GoalCard
              key={index}
              goal={goal}
              isEditing={editingId === index}
              onEdit={() => setEditingId(index)}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={(data) => handleSaveEdit(index, data)}
              onDelete={() => handleDelete(index)}
              onUpdateProgress={(val) => handleUpdateProgress(index, val)}
            />
          ))}

          {/* Add New Goal Card */}
          {newGoal ? (
            <div className="bg-surface border border-emerald-500/50 rounded-xl p-6 shadow-lg relative flex flex-col gap-4">
              <h3 className="font-bold text-emerald-400">New Goal</h3>
              <div className="space-y-3">
                <div>
                    <label className="text-xs text-text-tertiary">Goal Name</label>
                    <input
                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                        value={newGoal.name}
                        onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                        placeholder="e.g. Read Books"
                        autoFocus
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-text-tertiary">Target</label>
                        <input
                            type="number"
                            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                            value={newGoal.target}
                            onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                            placeholder="100"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-text-tertiary">Metric</label>
                        <input
                            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                            value={newGoal.metric}
                            onChange={(e) => setNewGoal({ ...newGoal, metric: e.target.value })}
                            placeholder="books"
                        />
                    </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                    onClick={() => setNewGoal(null)}
                    className="px-3 py-1.5 rounded text-xs text-slate-400 hover:bg-white/5"
                >
                    Cancel
                </button>
                <button
                    onClick={handleCreate}
                    className="px-3 py-1.5 rounded text-xs bg-emerald-600 text-white hover:bg-emerald-500 font-medium"
                >
                    Create Goal
                </button>
              </div>
            </div>
          ) : (
            <button
                onClick={() => setNewGoal({ name: "", target: "", metric: "units", icon: "target" })}
                className="group flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all h-[200px]"
            >
                <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-emerald-500/20 flex items-center justify-center mb-3 transition-colors">
                    <Plus className="text-slate-400 group-hover:text-emerald-400" />
                </div>
                <span className="text-slate-400 group-hover:text-emerald-400 font-medium">Add Yearly Goal</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const GoalCard = ({ goal, isEditing, onEdit, onCancelEdit, onSaveEdit, onDelete, onUpdateProgress }) => {
  const [editState, setEditState] = useState(goal);
  const percentage = Math.min(100, Math.round((goal.current / goal.target) * 100));
  const isCompleted = percentage >= 100;

  useEffect(() => {
    setEditState(goal);
  }, [goal]);

  if (isEditing) {
    return (
        <div className="bg-surface border border-white/10 rounded-xl p-6 shadow-lg relative flex flex-col gap-4">
            <h3 className="font-bold text-white mb-2">Edit Goal</h3>
            <div className="space-y-3">
                <div>
                     <label className="text-xs text-text-tertiary">Name</label>
                    <input
                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white"
                        value={editState.name}
                        onChange={(e) => setEditState({ ...editState, name: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-text-tertiary">Target</label>
                        <input
                            type="number"
                            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white"
                            value={editState.target}
                            onChange={(e) => setEditState({ ...editState, target: e.target.value })}
                        />
                    </div>
                     <div>
                        <label className="text-xs text-text-tertiary">Metric</label>
                        <input
                            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white"
                            value={editState.metric}
                            onChange={(e) => setEditState({ ...editState, metric: e.target.value })}
                        />
                    </div>
                </div>
                 <div>
                    <label className="text-xs text-text-tertiary">Current Progress</label>
                    <input
                        type="number"
                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white"
                        value={editState.current}
                        onChange={(e) => setEditState({ ...editState, current: e.target.value })}
                    />
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-auto pt-4">
                 <button
                    onClick={onDelete}
                    className="mr-auto px-3 py-1.5 rounded text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-1"
                >
                    <Trash2 size={14} /> Delete
                </button>
                <button onClick={onCancelEdit} className="px-3 py-1.5 rounded text-xs text-slate-400 hover:bg-white/5">
                    Cancel
                </button>
                <button
                    onClick={() => onSaveEdit(editState)}
                    className="px-3 py-1.5 rounded text-xs bg-emerald-600 text-white hover:bg-emerald-500 font-medium flex items-center gap-1"
                >
                    <Save size={14} /> Save
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-surface border border-white/5 hover:border-white/10 rounded-xl p-6 shadow-md relative group flex flex-col h-[200px] transition-colors">
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {isCompleted ? <Trophy size={20} /> : <Target size={20} />}
                </div>
                <div>
                     <h3 className="font-bold text-white text-lg leading-tight">{goal.name}</h3>
                     <p className="text-xs text-text-tertiary">{goal.current} / {goal.target} {goal.metric}</p>
                </div>
            </div>
            <button onClick={onEdit} className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-white transition-all">
                <Edit2 size={16} />
            </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-auto space-y-2">
            <div className="flex justify-between text-xs font-medium">
                <span className={isCompleted ? "text-emerald-400" : "text-slate-400"}>{percentage}% Complete</span>
                {Math.round(goal.target - goal.current) > 0 && (
                    <span className="text-slate-500">{Math.round(goal.target - goal.current)} left</span>
                )}
            </div>
            <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden">
                <motion.div
                    className={`h-full ${isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </div>
        </div>
        
        {/* Quick Increment Overlay (Optional) */}
        {!isCompleted && (
            <div className="absolute bottom-6 right-6 flex gap-1 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <button 
                    onClick={() => onUpdateProgress(goal.current + 1)}
                    className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/10"
                    title="Add 1"
                >
                    +1
                </button>
            </div>
        )}
    </div>
  );
};

export default YearlyGoalsPage;
