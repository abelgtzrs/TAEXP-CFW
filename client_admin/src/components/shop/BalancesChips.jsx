import { motion } from "framer-motion";

const BalancesChips = ({ balances }) => {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 mb-5">
      {balances.map(({ label, value, symbol, icon: Icon, title }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="flex-shrink-0 flex items-center gap-2 rounded-lg px-3 py-2"
          style={{
            background: "var(--color-surface)",
            border: "1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)",
          }}
          title={title}
          aria-label={`${label}: ${value} ${symbol}`}
        >
          <Icon className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold text-text-main tabular-nums">{value.toLocaleString()}</span>
          <span className="text-xs text-text-secondary">{symbol}</span>
        </motion.div>
      ))}
    </div>
  );
};

export default BalancesChips;
