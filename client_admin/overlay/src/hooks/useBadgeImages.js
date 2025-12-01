import { useState, useEffect } from "react";

const STORAGE_KEY = "taexp_badge_images";

export const useBadgeImages = () => {
  const [badgeImages, setBadgeImages] = useState({});

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setBadgeImages(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse badge images", e);
      }
    }
  }, []);

  const updateBadgeImages = (newImages) => {
    setBadgeImages(newImages);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newImages));
  };

  return { badgeImages, updateBadgeImages };
};
