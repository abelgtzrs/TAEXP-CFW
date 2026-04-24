import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { HabitEditorScreen } from "@/features/plan/screens/HabitEditorScreen";
import { HabitsListScreen } from "@/features/plan/screens/HabitsListScreen";
import { PlannerHomeScreen } from "@/features/plan/screens/PlannerHomeScreen";
import { TaskEditorScreen } from "@/features/plan/screens/TaskEditorScreen";
import { TasksListScreen } from "@/features/plan/screens/TasksListScreen";

import type { PlanStackParamList } from "../types";

const Stack = createNativeStackNavigator<PlanStackParamList>();

export function PlanStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PlannerHome" component={PlannerHomeScreen} />
      <Stack.Screen name="HabitsList" component={HabitsListScreen} />
      <Stack.Screen name="HabitEditor" component={HabitEditorScreen} />
      <Stack.Screen name="TasksList" component={TasksListScreen} />
      <Stack.Screen name="TaskEditor" component={TaskEditorScreen} />
    </Stack.Navigator>
  );
}
