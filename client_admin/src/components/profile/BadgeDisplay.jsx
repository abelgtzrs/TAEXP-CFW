import { useMemo } from "react";
import Widget from "../ui/Widget";
import api from "../../services/api";

const BadgeDisplay = ({ allBadges = [], earnedBadges = [] }) => {
  const earnedBadgeIds = useMemo(() => {
    const ids = new Set();
    for (const b of earnedBadges || []) {
      // Fully populated: { badgeBase: { _id: "..." } }
      if (b?.badgeBase?._id) {
        ids.add(String(b.badgeBase._id));
        continue;
      }
      // Partially populated: { badgeBase: "stringId" }
      if (b?.badgeBase && typeof b.badgeBase === "string") {
        ids.add(b.badgeBase);
        continue;
      }
      if (b?.badgeBase && typeof b.badgeBase === "object") {
        ids.add(String(b.badgeBase));
        continue;
      }
      // Raw BadgeBase object (no wrapping UserBadge)
      if (b?._id) {
        ids.add(String(b._id));
      }
    }
    return ids;
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
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    return `${API_ORIGIN}${path}`;
  };

  const groupedBadges = useMemo(() => {
    const sorted = [...allBadges].sort((a, b) => {
      const ak = a.collectionKey || a.category || "";
      const bk = b.collectionKey || b.category || "";
      if (ak !== bk) return ak.localeCompare(bk);
      const ai = Number(a.orderInCategory || a.index || 0);
      const bi = Number(b.orderInCategory || b.index || 0);
      return ai - bi;
    });

    const groups = [];
    const seen = new Map();
    for (const badge of sorted) {
      const key = badge.collectionKey || badge.category || "";
      if (!seen.has(key)) {
        seen.set(key, []);
        groups.push({ key, badges: seen.get(key) });
      }
      seen.get(key).push(badge);
    }
    return groups;
  }, [allBadges]);

  return (
    <Widget title="Badges" className="h-full">
      <div className="space-y-3">
        {groupedBadges.map(({ key, badges }) => (
          <div key={key}>
            {key && <p className="text-xs text-text-secondary font-medium mb-1 capitalize">{key}</p>}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${badges.length}, 1fr)`,
                gap: "4px",
              }}
            >
              {badges.map((badge) => {
                const isEarned = earnedBadgeIds.has(String(badge._id));
                const src = resolveImage(badge);
                const tip = [badge.name, key].filter(Boolean).join(" • ");
                return (
                  <div key={badge._id} className="flex items-center justify-center aspect-square" title={tip}>
                    <img
                      src={src}
                      alt={badge.name || "badge"}
                      className={`w-full h-full object-contain transition-all duration-300 ${
                        isEarned ? "opacity-100" : "opacity-20 grayscale"
                      }`}
                      onError={(e) => {
                        e.currentTarget.style.visibility = "hidden";
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Widget>
  );
};

export default BadgeDisplay;
