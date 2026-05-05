import { useState, useEffect } from "react";

const DEFAULTS = {
  accentOverride: "",
  avatarShape: "circle",      // "circle" | "squircle" | "rounded"
  avatarRing: "medium",       // "thin" | "medium" | "thick"
  avatarGlow: 45,             // 0–80
  showStreakChip: true,
  showItemsChip: true,
  showBadgesChip: true,
  cardRadius: "12",           // "8" | "12" | "20"
};

function readAppearance() {
  try {
    return {
      accentOverride: localStorage.getItem("tae.appearance.accentOverride") || DEFAULTS.accentOverride,
      avatarShape: localStorage.getItem("tae.appearance.avatarShape") || DEFAULTS.avatarShape,
      avatarRing: localStorage.getItem("tae.appearance.avatarRing") || DEFAULTS.avatarRing,
      avatarGlow: Number(localStorage.getItem("tae.appearance.avatarGlow") ?? DEFAULTS.avatarGlow),
      showStreakChip: localStorage.getItem("tae.appearance.showStreakChip") !== "false",
      showItemsChip: localStorage.getItem("tae.appearance.showItemsChip") !== "false",
      showBadgesChip: localStorage.getItem("tae.appearance.showBadgesChip") !== "false",
      cardRadius: localStorage.getItem("tae.appearance.cardRadius") || DEFAULTS.cardRadius,
    };
  } catch {
    return DEFAULTS;
  }
}

export const AVATAR_SHAPE_RADIUS = {
  circle: "50%",
  squircle: "32%",
  rounded: "18px",
};

export const AVATAR_RING_PAD = {
  thin: 2,
  medium: 3,
  thick: 5,
};

export function useAppearance() {
  const [appearance, setAppearance] = useState(readAppearance);

  useEffect(() => {
    const handler = () => setAppearance(readAppearance());
    window.addEventListener("tae:settings-changed", handler);
    return () => window.removeEventListener("tae:settings-changed", handler);
  }, []);

  return appearance;
}
