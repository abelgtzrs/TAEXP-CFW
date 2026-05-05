import { motion } from "framer-motion";
import BadgeDisplay from "../../components/profile/BadgeDisplay";

const BadgesTab = ({ allBadges, earnedBadges, user }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.18 }}
  >
    <BadgeDisplay
      allBadges={allBadges}
      earnedBadges={earnedBadges}
      activeCollectionKey={user.activeBadgeCollectionKey || ""}
    />
  </motion.div>
);

export default BadgesTab;
