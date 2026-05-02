import { useMemo } from "react";
import api from "../../services/api";

const BadgeDisplay = ({ allBadges = [], earnedBadges = [], activeCollectionKey = "" }) => {
  const earnedBadgeIds = useMemo(() => {
    const ids = new Set();
    for (const b of earnedBadges || []) {
      if (b?.badgeBase?._id) { ids.add(String(b.badgeBase._id)); continue; }
      if (b?.badgeBase && typeof b.badgeBase === "string") { ids.add(b.badgeBase); continue; }
      if (b?.badgeBase && typeof b.badgeBase === "object") { ids.add(String(b.badgeBase)); continue; }
      if (b?._id) ids.add(String(b._id));
    }
    return ids;
  }, [earnedBadges]);

  const API_ORIGIN = useMemo(() => {
    try { return new URL(api.defaults.baseURL || "").origin; }
    catch { return ""; }
  }, []);

  const resolveImage = (badge) => {
    const raw = badge.spriteSmallUrl || badge.spriteLargeUrl || badge.imageUrl || "";
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    return `${API_ORIGIN}${raw.startsWith("/") ? raw : "/" + raw}`;
  };

  const groupedBadges = useMemo(() => {
    const sorted = [...allBadges].sort((a, b) => {
      const ak = a.collectionKey || a.category || "";
      const bk = b.collectionKey || b.category || "";
      if (ak !== bk) return ak.localeCompare(bk);
      return Number(a.orderInCategory || a.index || 0) - Number(b.orderInCategory || b.index || 0);
    });
    const groups = [];
    const seen = new Map();
    for (const badge of sorted) {
      const key = badge.collectionKey || badge.category || "";
      if (!seen.has(key)) { seen.set(key, []); groups.push({ key, badges: seen.get(key) }); }
      seen.get(key).push(badge);
    }
    return groups;
  }, [allBadges]);

  const totalEarned = earnedBadgeIds.size;
  const totalBadges = allBadges.length;

  if (!allBadges.length) {
    return (
      <div className="rounded-2xl p-6 text-center" style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }}>
        <p className="text-xs text-text-tertiary">No badges available</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }}>
      {/* Header */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/[0.05]">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">Badges</h3>
        <span className="text-[11px] font-mono text-text-tertiary tabular-nums">
          {totalEarned}<span className="opacity-30 mx-0.5">/</span>{totalBadges}
        </span>
      </div>

      <div className="p-5 space-y-5">
        {groupedBadges.map(({ key, badges }) => {
          const groupEarned = badges.filter((b) => earnedBadgeIds.has(String(b._id))).length;
          const groupTotal = badges.length;
          const complete = groupEarned === groupTotal;

          return (
            <div key={key}>
              {/* Group label */}
              <div className="flex items-center gap-2 mb-3">
                {key && (
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">
                    {key.replace(/_/g, " ")}
                  </span>
                )}
                <div className="flex-1 h-px bg-white/[0.05]" />
                <span
                  className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-full leading-none ${
                    complete
                      ? "text-green-400 bg-green-400/10 outline outline-1 outline-green-400/20"
                      : "text-text-tertiary bg-white/[0.03] outline outline-1 outline-white/[0.06]"
                  }`}
                >
                  {groupEarned}/{groupTotal}
                </span>
              </div>

              {/* Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${Math.min(badges.length, 8)}, 1fr)`,
                  gap: 5,
                }}
              >
                {badges.map((badge) => {
                  const isEarned = earnedBadgeIds.has(String(badge._id));
                  const src = resolveImage(badge);
                  return (
                    <div
                      key={badge._id}
                      className="group aspect-square rounded-lg flex items-center justify-center transition-all duration-200"
                      style={{
                        background: isEarned ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.012)",
                        outline: isEarned ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(255,255,255,0.025)",
                      }}
                      title={badge.name || key}
                    >
                      {src ? (
                        <img
                          src={src}
                          alt={badge.name || "badge"}
                          className={`w-[70%] h-[70%] object-contain transition-all duration-200 ${
                            isEarned
                              ? "opacity-100 group-hover:scale-110 group-hover:brightness-110"
                              : "opacity-[0.08] grayscale"
                          }`}
                          onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
                        />
                      ) : (
                        <div className={`w-3.5 h-3.5 rounded-full ${isEarned ? "bg-white/20" : "bg-white/[0.04]"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgeDisplay;
