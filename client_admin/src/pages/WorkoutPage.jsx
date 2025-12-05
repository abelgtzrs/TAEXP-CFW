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
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <motion.h1
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="text-2xl md:text-3xl font-bold text-primary mb-6 md:mb-8"
      >
        Workout Tracker
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        <ActionCard
          to="/workouts/log"
          icon={<Dumbbell size={40} strokeWidth={1.4} />}
          title="Start a Clean Workout"
          description="Build your session from scratch."
          delay={0.2}
        />
        <ActionCard
          to="/workouts/new/template"
          icon={<ListChecks size={40} strokeWidth={1.4} />}
          title="Use a Prebuilt Workout"
          description="Select from your list of templates."
          delay={0.3}
        />
      </div>

      <div className="mt-8 md:mt-12">
        <motion.h2
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.4 }}
          className="text-xl md:text-2xl font-semibold text-primary mb-4"
        >
          Recent Workouts
        </motion.h2>
        {loading && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-text-secondary text-sm">
            Loading history...
          </motion.p>
        )}
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm">
            {error}
          </motion.p>
        )}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.55 }}
            className="space-y-4"
          >
            {logs.length > 0 ? (
              logs.map((log, i) => (
                <motion.div
                  key={log._id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.6 + i * 0.06 }}
                  whileHover={{ scale: 1.01, transition: { duration: 0.18 } }}
                >
                  <WorkoutLogItem log={log} />
                </motion.div>
              ))
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="text-text-secondary text-sm"
              >
                Your past workout logs will appear here.
              </motion.p>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default WorkoutPage;
