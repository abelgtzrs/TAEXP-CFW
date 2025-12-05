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
    >
      <Link
        to={to}
        className="block p-4 md:p-8 rounded-lg border-2 transition-all duration-300 h-full text-left"
        style={{ background: "var(--color-surface)", borderColor: "transparent" }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
      >
        <div className="mb-4 text-primary">{icon}</div>
        <h2 className="text-xl font-semibold text-primary mb-1">{title}</h2>
        <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
      </Link>
    </motion.div>
  );
};

export default ActionCard;
