import { motion } from "framer-motion";
import UserOverviewCard from "../../components/profile/UserOverviewCard";
import BadgeDisplay from "../../components/profile/BadgeDisplay";
import CompactDisplayedCollections from "../../components/profile/CompactDisplayedCollections";

const OverviewTab = ({ allBadges, earnedBadges, user, onEditClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.18 }}
    className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start"
  >
    <div className="lg:col-span-1 space-y-4">
      <UserOverviewCard onEdit={onEditClick} />
      <BadgeDisplay
        allBadges={allBadges}
        earnedBadges={earnedBadges}
        activeCollectionKey={user.activeBadgeCollectionKey || ""}
      />
    </div>
    <div className="lg:col-span-2 space-y-4">
      <CompactDisplayedCollections
        displayedPokemon={user.displayedPokemon || []}
        displayedSnoopyArt={user.displayedSnoopyArt || []}
        displayedHabboRares={user.displayedHabboRares || []}
        displayedYugiohCards={user.displayedYugiohCards || []}
      />
    </div>
  </motion.div>
);

export default OverviewTab;
