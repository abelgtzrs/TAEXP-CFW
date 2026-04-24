import { DarkTheme, DefaultTheme, Theme as NavigationTheme } from "@react-navigation/native";
import { PropsWithChildren, createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";

import { useAuth } from "@/features/auth/context/AuthContext";

import { AppTheme, buildTheme } from "./tokens";

type ThemeContextValue = {
  theme: AppTheme;
  navigationTheme: NavigationTheme;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const { user } = useAuth();

  const theme = useMemo(
    () => buildTheme(systemScheme === "light" ? "light" : "dark", user?.activeAbelPersona?.colors),
    [systemScheme, user?.activeAbelPersona?.colors],
  );

  const navigationTheme = useMemo<NavigationTheme>(() => {
    const base = theme.isDark ? DarkTheme : DefaultTheme;

    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.textPrimary,
        border: theme.colors.border,
        notification: theme.colors.secondary,
      },
    };
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, navigationTheme }}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }

  return value;
}
