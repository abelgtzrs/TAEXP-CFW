import React from "react";
import BadgeRow from "./BadgeRow";

const TopBanner = ({ badges, badgeImages, onOpenSettings }) => {
  return (
    <div className="top-banner">
      <div
        className="banner-title"
        onClick={onOpenSettings}
        style={{ cursor: "pointer" }}
        title="Click to configure badges"
      >
        The Abel Experience™
      </div>
      <BadgeRow badges={badges} badgeImages={badgeImages} />
    </div>
  );
};

export default TopBanner;
