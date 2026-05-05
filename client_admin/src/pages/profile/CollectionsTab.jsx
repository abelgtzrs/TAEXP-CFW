import { motion } from "framer-motion";
import DisplayedCollection from "../../components/profile/DisplayedCollection";

const CollectionsTab = ({ collectionsState, accent }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.18 }}
    className="space-y-4"
  >
    {collectionsState.loading && (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 border-white/15 animate-spin"
          style={{ borderTopColor: accent }}
        />
        <p className="text-xs text-white/35">Loading collections&hellip;</p>
      </div>
    )}
    {collectionsState.error && <p className="text-red-400 text-sm text-center py-8">{collectionsState.error}</p>}
    {!collectionsState.loading && !collectionsState.error && (
      <>
        <DisplayedCollection title="Pok&eacute;mon" items={collectionsState.pokemon} baseField="basePokemon" />
        <DisplayedCollection title="Snoopy Art" items={collectionsState.snoopy} baseField="snoopyArtBase" />
        <DisplayedCollection title="Habbo Rares" items={collectionsState.habbo} baseField="habboRareBase" />
        <DisplayedCollection title="Yu-Gi-Oh!" items={collectionsState.yugioh} baseField="yugiohCardBase" />
      </>
    )}
  </motion.div>
);

export default CollectionsTab;
