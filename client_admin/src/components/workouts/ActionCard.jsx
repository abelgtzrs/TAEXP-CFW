import { motion } from "framer-motion";
import { Link } from "react-router-dom";

/**
 * Generic action card used on workout landing page.
 * Props:
 *  - to: react-router link target
 *  - icon: React node (lucide icon component)
 *  - title: heading text
 *  - description: sub text
 *  - delay: animation delay (seconds)
 */
const ActionCard = ({ to, icon, title, description, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      whileHover={{ scale: 1.02, transition: { duration: 0.18 } }}
      className="h-full"
    >
      <Link
        to={to}
        className="flex flex-row md:flex-col items-center md:items-start gap-4 p-4 md:p-6 rounded-xl border border-white/10 bg-surface hover:bg-white/5 transition-all duration-300 h-full group"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg md:text-xl font-bold text-white group-hover:text-primary transition-colors mb-0.5 md:mb-2">
            {title}
          </h2>
          <p className="text-xs md:text-sm text-text-secondary leading-relaxed line-clamp-2 md:line-clamp-none">
            {description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};

export default ActionCard;
