import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { BillsScreen } from "@/features/finance/screens/BillsScreen";
import { BudgetsScreen } from "@/features/finance/screens/BudgetsScreen";
import { FinanceHomeScreen } from "@/features/finance/screens/FinanceHomeScreen";
import { TransactionsScreen } from "@/features/finance/screens/TransactionsScreen";

import type { FinanceStackParamList } from "../types";

const Stack = createNativeStackNavigator<FinanceStackParamList>();

export function FinanceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FinanceHome" component={FinanceHomeScreen} />
      <Stack.Screen name="Transactions" component={TransactionsScreen} />
      <Stack.Screen name="Budgets" component={BudgetsScreen} />
      <Stack.Screen name="Bills" component={BillsScreen} />
    </Stack.Navigator>
  );
}
