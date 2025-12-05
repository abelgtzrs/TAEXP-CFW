import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, Dumbbell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const WorkoutLogItem = ({ log }) => {
  const [expanded, setExpanded] = useState(false);

  // Format the date to be more readable, e.g., "Jun 21"
  const formattedDate = new Date(log.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
        expanded
          ? "bg-surface border-primary/30 shadow-lg shadow-black/20"
          : "bg-surface/50 border-white/5 hover:bg-surface hover:border-white/10"
      }`}
    >
      {/* Header Row - Always Visible */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-full transition-colors ${
              expanded ? "bg-primary/20 text-primary" : "bg-white/5 text-text-secondary"
            }`}
          >
            <Dumbbell size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">{log.workoutName}</h3>
            <p className="text-[10px] text-text-secondary">{formattedDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div className="hidden sm:block">
            <div className="flex items-center gap-1 text-xs text-text-secondary justify-end">
              <Clock size={12} />
              <span>{log.durationSessionMinutes ? `${log.durationSessionMinutes}m` : "--"}</span>
            </div>
            <div className="text-[10px] text-text-tertiary">{log.exercises.length} Exercises</div>
          </div>
          
          {/* Mobile-only compact stats */}
          <div className="sm:hidden text-right">
             <div className="text-xs font-mono font-medium text-primary">
              {log.durationSessionMinutes ? `${log.durationSessionMinutes}m` : "--"}
            </div>
             <div className="text-[10px] text-text-tertiary">{log.exercises.length} Ex</div>
          </div>

          <div className={`text-text-secondary transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}>
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-3 border-t border-white/10 space-y-4">
              {/* Detailed Exercise List */}
              <div className="space-y-3">
                {log.exercises.map((ex, index) => (
                  <div key={index} className="bg-black/20 rounded-lg p-3 border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-white">
                        {ex.exerciseDefinition?.name || "Unknown Exercise"}
                      </span>
                      <span className="text-[10px] text-text-secondary bg-white/5 px-1.5 py-0.5 rounded">
                        {ex.sets.length} Sets
                      </span>
                    </div>
                    
                    {/* Sets Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {ex.sets.map((set, sIdx) => (
                        <div key={sIdx} className="text-[10px] text-text-secondary bg-black/20 p-1 rounded text-center">
                          <div className="text-text-tertiary text-[9px]">Set {sIdx + 1}</div>
                          <div className="font-mono text-white">
                            {set.weight > 0 ? `${set.weight}lbs` : "BW"} x {set.reps}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Notes (if any) */}
              {log.notes && (
                <div className="text-xs text-text-secondary italic bg-white/5 p-3 rounded border border-white/5">
                  "{log.notes}"
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkoutLogItem;
