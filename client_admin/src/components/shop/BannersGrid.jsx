import { motion } from "framer-motion";
import GachaCard from "./GachaCard";

const BannersGrid = ({ configs, loadingCategory, onPull }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {configs.map((config, index) => {
        return (
          <motion.div
            key={config.category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 + index * 0.06 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            className="relative"
          >
            <div
              className="absolute -top-2 -right-2 z-10 rounded-full border px-3 py-1 text-xs font-medium"
              style={{ background: "var(--color-background)", borderColor: "var(--color-primary)" }}
              title={`Cost per roll: ${config.cost} ${config.currencySymbol}`}
            >
              <span className="text-primary">{config.cost}</span>
              <span className="ml-1 text-text-secondary">{config.currencySymbol}</span>
            </div>
            <GachaCard
              title={config.title}
              description={config.description}
              cost={config.cost}
              currencyName={config.currencyName}
              currencySymbol={config.currencySymbol}
              isLoading={loadingCategory === config.category}
              onPull={() => onPull(config.category)}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default BannersGrid;
