import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { DashboardScreen } from "@/features/dashboard/screens/DashboardScreen";
import { DashboardPrefsScreen } from "@/features/dashboard/screens/DashboardPrefsScreen";
import { useAppTheme } from "@/theme/ThemeProvider";

import type { HomeStackParamList } from "../types";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  const { theme } = useAppTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen
        name="DashboardPrefs"
        component={DashboardPrefsScreen}
        options={{
          headerShown: true,
          title: "Customize",
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.textPrimary,
        }}
      />
    </Stack.Navigator>
  );
}
