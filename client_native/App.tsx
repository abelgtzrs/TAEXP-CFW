import "react-native-gesture-handler";

import { StatusBar } from "expo-status-bar";

import { RootNavigator } from "@/app/navigation/RootNavigator";
import { AppProviders } from "@/app/providers/AppProviders";
import { useAppTheme } from "@/theme/ThemeProvider";

function AppShell() {
  const { theme } = useAppTheme();

  return (
    <>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}
