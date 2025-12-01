import React from "react";
import { BADGES } from "../utils/badgeLookup";

const BadgeRow = ({ badges, badgeImages }) => {
  return (
    <div className="badge-row">
      {BADGES.map((badge, index) => {
        const isUnlocked = badges && badges[index];
        const imageUrl = badgeImages && badgeImages[badge.name];

        return (
          <div
            key={badge.name}
            className={`badge-slot ${isUnlocked ? "unlocked" : ""}`}
            title={badge.name}
            style={{
              borderColor: isUnlocked ? badge.color : undefined,
              opacity: isUnlocked ? 1 : 0.5,
            }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={badge.name}
                className="badge-icon-img"
                style={{
                  opacity: isUnlocked ? 1 : 0.25,
                  filter: isUnlocked ? "none" : "grayscale(100%)",
                }}
              />
            ) : (
              <div
                className="badge-icon"
                style={{
                  backgroundColor: isUnlocked ? badge.color : "#444",
                  borderRadius: "50%",
                  width: "60%",
                  height: "60%",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BadgeRow;
