import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

// Applies the active persona's theme. With no persona, AdminLayout applies the saved
// Standard Issue theme, and index.html restores the last theme before first paint, so
// this hook writes nothing (a fallback palette here would flash over the saved theme).
export const useTheme = () => {
  const { user } = useAuth();
  // The activePersona object is now fully populated with theme data.
  const activePersona = user?.activeAbelPersona;

  useEffect(() => {
    if (!activePersona) return;
    const root = window.document.documentElement;
    const { colors, text, font } = activePersona;

    if (colors) {
      root.style.setProperty("--color-bg", colors.bg);
      root.style.setProperty("--color-surface", colors.surface);
      root.style.setProperty("--color-primary", colors.primary);
      root.style.setProperty("--color-secondary", colors.secondary);
      root.style.setProperty("--color-tertiary", colors.tertiary);
    }

    if (text) {
      root.style.setProperty("--color-text-main", text.main);
      root.style.setProperty("--color-text-secondary", text.secondary);
      root.style.setProperty("--color-text-tertiary", text.tertiary);
    }

    if (font) {
      root.style.setProperty("--font-main", font);
    }
  }, [activePersona]); // This effect re-runs whenever the activePersona object changes.
};
