import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { WorkoutListScreen } from "@/features/fitness/screens/WorkoutListScreen";

import type { FitnessStackParamList } from "../types";

const Stack = createNativeStackNavigator<FitnessStackParamList>();

export function FitnessStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkoutList" component={WorkoutListScreen} />
    </Stack.Navigator>
  );
}
