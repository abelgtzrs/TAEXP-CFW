import { motion } from "framer-motion";
import UserStatsWidget from "../../components/profile/UserStatsWidget";

const StatsTab = ({ stats }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.18 }}
  >
    <UserStatsWidget stats={stats} />
  </motion.div>
);

export default StatsTab;
