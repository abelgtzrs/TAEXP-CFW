import { motion } from "framer-motion";

const CATEGORY_LABELS = {
  pokemon: "Pokémon",
  yugioh: "Yu-Gi-Oh!",
  snoopy: "Snoopy",
  habbo: "Habbo Rare",
  abelpersona: "Persona",
};

const CategoryPanel = ({ config, recentItems = [], isAdmin, onPull, isLoading, categoryLabel }) => {
  if (config.category === "abelpersona" && !isAdmin) return null;

  const label = categoryLabel ? categoryLabel(config.category) : CATEGORY_LABELS[config.category] || config.title;
  const items = Array.isArray(recentItems) ? recentItems.slice(0, 10) : [];
  const slots = [...items, ...Array.from({ length: Math.max(0, 5 - items.length) })];

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden"
      style={{
        background: "var(--color-surface)",
        border: "1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)",
      }}
    >
      {/* ── Header ── */}
      <div
        className="px-4 pt-4 pb-3"
        style={{ borderBottom: "1px solid color-mix(in srgb, var(--color-primary) 15%, transparent)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary opacity-80 mb-0.5">
              {label}
            </p>
            <h3 className="text-sm font-semibold text-text-main leading-snug">{config.title}</h3>
          </div>
          {/* Cost */}
          <div className="shrink-0 text-right">
            <span className="text-base font-bold text-primary">{config.cost}</span>
            <span className="ml-1 text-xs text-text-secondary">{config.currencySymbol}</span>
          </div>
        </div>
        <p className="text-xs text-text-secondary mt-2 leading-relaxed line-clamp-2">{config.description}</p>
      </div>

      {/* ── Recent pulls ── */}
      <div className="px-4 py-3">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary mb-2 opacity-50">Recent</p>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {slots.map((rp, i) =>
            rp ? (
              <motion.div
                key={`${rp.id}-${rp.ts}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="h-10 w-10 rounded-lg overflow-hidden flex items-center justify-center shrink-0"
                style={{
                  background: "color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))",
                  border: "1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)",
                }}
                title={`${rp.name}${rp.rarity ? ` · ${String(rp.rarity).replace(/_/g, " ")}` : ""}`}
              >
                {rp.imageUrl ? (
                  <img src={rp.imageUrl} alt={rp.name} className="max-h-10 max-w-10 object-contain" />
                ) : (
                  <span className="text-[10px] text-text-secondary font-semibold">?</span>
                )}
              </motion.div>
            ) : (
              <div
                key={`ph-${i}`}
                className="h-11 w-11 rounded-xl shrink-0 flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.08)" }}
              >
                <span className="text-[10px] text-text-secondary opacity-40">—</span>
              </div>
            ),
          )}
        </div>
      </div>

      {/* ── Pull button ── */}
      <div className="px-4 pb-4 mt-auto">
        <button
          onClick={() => onPull(config.category)}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-opacity duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "var(--color-primary)", color: "var(--color-bg)" }}
          aria-label={`Pull from ${config.title}`}
        >
          {isLoading ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent"
              />
              Pulling…
            </>
          ) : (
            `Pull · ${config.cost} ${config.currencySymbol}`
          )}
        </button>
      </div>
    </div>
  );
};

export default CategoryPanel;
