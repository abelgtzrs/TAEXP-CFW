import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { FinanceHomeScreen } from "@/features/finance/screens/FinanceHomeScreen";

import type { FinanceStackParamList } from "../types";

const Stack = createNativeStackNavigator<FinanceStackParamList>();

export function FinanceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FinanceHome" component={FinanceHomeScreen} />
    </Stack.Navigator>
  );
}
