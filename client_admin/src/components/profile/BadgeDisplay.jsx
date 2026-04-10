import { useMemo } from "react";
import Widget from "../ui/Widget";
import api from "../../services/api";

const BadgeDisplay = ({
  allBadges = [],
  earnedBadges = [],
  badgeSizePx = 64,
  maxBadges = 8,
  activeCollectionKey = "",
}) => {
  const earnedBadgeIds = useMemo(() => {
    return new Set(
      (earnedBadges || [])
        .map((b) => {
          const baseId = b?.badgeBase?._id || b?.badgeBase || b?._id || b;
          return baseId ? String(baseId) : null;
        })
        .filter(Boolean),
    );
  }, [earnedBadges]);

  // Compute API origin for resolving server-hosted assets
  const API_ORIGIN = useMemo(() => {
    try {
      const u = new URL(api.defaults.baseURL || "");
      return u.origin;
    } catch {
      return "";
    }
  }, []);

  const resolveImage = (badge) => {
    const raw = badge.spriteSmallUrl || badge.spriteLargeUrl || badge.imageUrl || "";
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    // Ensure it starts with a slash
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    return `${API_ORIGIN}${path}`;
  };

  // Optional: sort for a stable layout (by collectionKey then order)
  const flatBadges = useMemo(() => {
    const source = activeCollectionKey
      ? allBadges.filter((badge) => String(badge.collectionKey || "") === String(activeCollectionKey))
      : allBadges;

    return [...source].sort((a, b) => {
      const ak = a.collectionKey || a.category || "";
      const bk = b.collectionKey || b.category || "";
      if (ak !== bk) return ak.localeCompare(bk);
      const ai = Number(a.orderInCategory || a.index || 0);
      const bi = Number(b.orderInCategory || b.index || 0);
      return ai - bi;
    });
  }, [allBadges, activeCollectionKey]);

  const visibleBadges = flatBadges.slice(0, Math.max(1, Number(maxBadges) || 8));

  return (
    <Widget title="Badges" className="h-full">
      <div className="overflow-x-auto overflow-y-hidden h-full pr-2">
        <div className="flex flex-nowrap items-center gap-2 min-w-max">
          {visibleBadges.map((badge) => {
            const isEarned = earnedBadgeIds.has(badge._id);
            const src = resolveImage(badge);
            // Tooltip content
            const tip = [badge.name, badge.collectionKey || badge.category].filter(Boolean).join(" • ");
            return (
              <div
                key={badge._id}
                className="flex items-center justify-center"
                style={{ width: `${badgeSizePx}px`, height: `${badgeSizePx}px` }}
                title={tip}
              >
                <img
                  src={src}
                  alt={badge.name || "badge"}
                  className={`object-contain transition-all duration-300 ${
                    isEarned ? "opacity-100" : "opacity-20 grayscale"
                  }`}
                  style={{ width: `${badgeSizePx}px`, height: `${badgeSizePx}px` }}
                  onError={(e) => {
                    // Hide broken image boxes silently
                    e.currentTarget.style.visibility = "hidden";
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </Widget>
  );
};

export default BadgeDisplay;
