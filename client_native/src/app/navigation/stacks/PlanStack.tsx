import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { PlannerHomeScreen } from "@/features/plan/screens/PlannerHomeScreen";

import type { PlanStackParamList } from "../types";

const Stack = createNativeStackNavigator<PlanStackParamList>();

export function PlanStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PlannerHome" component={PlannerHomeScreen} />
    </Stack.Navigator>
  );
}
