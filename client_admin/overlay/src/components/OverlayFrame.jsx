import React, { useState } from "react";
import TopBanner from "./TopBanner";
import BottomPanel from "./BottomPanel";
import TeamColumn from "./TeamColumn";
import GameplayWindow from "./GameplayWindow";
import BadgeConfigModal from "./BadgeConfigModal";
import useLiveData from "../hooks/useLiveData";
import { useBadgeImages } from "../hooks/useBadgeImages";

const OverlayFrame = () => {
  const { team, badges, location, events } = useLiveData();
  const { badgeImages, updateBadgeImages } = useBadgeImages();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="overlay-container">
      <TopBanner badges={badges} badgeImages={badgeImages} onOpenSettings={() => setIsSettingsOpen(true)} />
      <TeamColumn team={team} />
      <GameplayWindow />
      <BottomPanel location={location} events={events} />

      <BadgeConfigModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentImages={badgeImages}
        onSave={updateBadgeImages}
      />
    </div>
  );
};

export default OverlayFrame;
