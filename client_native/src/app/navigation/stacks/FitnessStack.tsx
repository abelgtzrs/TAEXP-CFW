import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { FitnessGoalsScreen } from "@/features/fitness/screens/FitnessGoalsScreen";
import { WorkoutEditorScreen } from "@/features/fitness/screens/WorkoutEditorScreen";
import { WorkoutListScreen } from "@/features/fitness/screens/WorkoutListScreen";
import { WorkoutTemplatesScreen } from "@/features/fitness/screens/WorkoutTemplatesScreen";

import type { FitnessStackParamList } from "../types";

const Stack = createNativeStackNavigator<FitnessStackParamList>();

export function FitnessStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkoutList" component={WorkoutListScreen} />
      <Stack.Screen name="WorkoutTemplates" component={WorkoutTemplatesScreen} />
      <Stack.Screen name="WorkoutEditor" component={WorkoutEditorScreen} />
      <Stack.Screen name="FitnessGoals" component={FitnessGoalsScreen} />
    </Stack.Navigator>
  );
}
