import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { BooksListScreen } from "@/features/library/screens/BooksListScreen";

import type { LibraryStackParamList } from "../types";

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export function LibraryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BooksList" component={BooksListScreen} />
    </Stack.Navigator>
  );
}
