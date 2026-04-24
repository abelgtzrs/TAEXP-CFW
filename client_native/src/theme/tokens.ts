export type ThemeMode = "light" | "dark";

type PersonaColorInput = {
  primary?: string;
  secondary?: string;
  bg?: string;
  background?: string;
  surface?: string;
  textMain?: string;
  textSecondary?: string;
  tertiary?: string;
};

export type AppTheme = {
  mode: ThemeMode;
  isDark: boolean;
  colors: {
    background: string;
    surface: string;
    surfaceMuted: string;
    border: string;
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    danger: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    buttonText: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  radii: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
};

const darkBase: AppTheme = {
  mode: "dark",
  isDark: true,
  colors: {
    background: "#0B1220",
    surface: "#111A2B",
    surfaceMuted: "#162235",
    border: "#253247",
    primary: "#34D399",
    secondary: "#38BDF8",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    textTertiary: "#64748B",
    buttonText: "#071018",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  radii: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
  },
};

const lightBase: AppTheme = {
  mode: "light",
  isDark: false,
  colors: {
    background: "#F5F7FB",
    surface: "#FFFFFF",
    surfaceMuted: "#EDF2F7",
    border: "#D8E0EA",
    primary: "#0F766E",
    secondary: "#2563EB",
    success: "#15803D",
    warning: "#B45309",
    danger: "#B91C1C",
    textPrimary: "#0F172A",
    textSecondary: "#475569",
    textTertiary: "#64748B",
    buttonText: "#FFFFFF",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  radii: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
  },
};

function coercePersonaColors(input: unknown): PersonaColorInput | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  return input as PersonaColorInput;
}

export function buildTheme(mode: ThemeMode, personaColorsInput?: unknown): AppTheme {
  const base = mode === "dark" ? darkBase : lightBase;
  const personaColors = coercePersonaColors(personaColorsInput);

  if (!personaColors) {
    return base;
  }

  return {
    ...base,
    colors: {
      ...base.colors,
      background: personaColors.bg || personaColors.background || base.colors.background,
      surface: personaColors.surface || base.colors.surface,
      primary: personaColors.primary || base.colors.primary,
      secondary: personaColors.secondary || base.colors.secondary,
      textPrimary: personaColors.textMain || base.colors.textPrimary,
      textSecondary: personaColors.textSecondary || base.colors.textSecondary,
      textTertiary: personaColors.tertiary || base.colors.textTertiary,
    },
  };
}
