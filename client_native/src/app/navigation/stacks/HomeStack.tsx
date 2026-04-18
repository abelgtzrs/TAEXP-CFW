import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { DashboardScreen } from "@/features/dashboard/screens/DashboardScreen";

import type { HomeStackParamList } from "../types";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
    </Stack.Navigator>
  );
}
