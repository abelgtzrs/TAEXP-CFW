// src/pages/WorkoutPage.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import WorkoutLogItem from "../components/workouts/WorkoutLogItem";
import ActionCard from "../components/workouts/ActionCard";
import { Dumbbell, ListChecks } from "lucide-react";

const WorkoutPage = () => {
  // New state for storing workout history
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch workout logs when the page loads
  useEffect(() => {
    const fetchWorkoutLogs = async () => {
      try {
        const response = await api.get("/workouts");
        setLogs(response.data.data);
      } catch (err) {
        console.error("Failed to fetch workout logs:", err);
        setError("Could not load workout history.");
      } finally {
        setLoading(false);
      }
    };
    fetchWorkoutLogs();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      className="pb-20 md:pb-0" // Add padding bottom for mobile nav
    >
      <div className="flex items-center justify-between mb-6">
        <motion.h1
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="text-2xl font-bold text-white"
        >
          Workouts
        </motion.h1>
        {/* Could add a 'History' or 'Stats' button here later */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        <ActionCard
          to="/workouts/log"
          icon={<Dumbbell size={24} />}
          title="Quick Start"
          description="Start a new empty session"
          delay={0.2}
        />
        <ActionCard
          to="/workouts/new/template"
          icon={<ListChecks size={24} />}
          title="From Template"
          description="Use a saved routine"
          delay={0.3}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.4 }}
            className="text-sm font-semibold text-text-secondary uppercase tracking-wider"
          >
            Recent Activity
          </motion.h2>
        </div>
        
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </motion.div>
        )}
        
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.55 }}
            className="space-y-3"
          >
            {logs.length > 0 ? (
              logs.map((log, i) => (
                <motion.div
                  key={log._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                >
                  <WorkoutLogItem log={log} />
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5">
                <Dumbbell className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-text-secondary text-sm">No workouts logged yet.</p>
                <p className="text-text-tertiary text-xs mt-1">Start your first session above!</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default WorkoutPage;
