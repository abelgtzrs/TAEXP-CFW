/**
 * Standard Issue persona — hardcoded defaults.
 *
 * This is the single source of truth for the fallback theme used when no
 * active Abel persona is selected. Both PersonaEditor and AdminLayout import
 * from here so there is only one place to update when the defaults change.
 */

export const STANDARD_THEME_STORAGE_KEY = "tae.standardTheme.v1";

export const STANDARD_ISSUE_DEFAULT = {
  _id: "__standard__",
  name: "Standard Issue",
  description: "Default system theme",
  colors: {
    bg: "#0B0E14",
    surface: "#151A23",
    primary: "#5EEAD4",
    secondary: "#60A5FA",
    tertiary: "#A5F3FC",
  },
  text: {
    main: "#E5E7EB",
    secondary: "#9CA3AF",
    tertiary: "#4B5563",
  },
  font: "Inter, sans-serif",
};
