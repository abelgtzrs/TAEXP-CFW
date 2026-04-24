import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { BookDetailsScreen } from "@/features/library/screens/BookDetailsScreen";
import { BooksListScreen } from "@/features/library/screens/BooksListScreen";
import { BookNotesScreen } from "@/features/library/screens/BookNotesScreen";
import { DailyDraftsScreen } from "@/features/library/screens/DailyDraftsScreen";

import type { LibraryStackParamList } from "../types";

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export function LibraryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BooksList" component={BooksListScreen} />
      <Stack.Screen name="BookDetails" component={BookDetailsScreen} />
      <Stack.Screen name="BookNotes" component={BookNotesScreen} />
      <Stack.Screen name="DailyDrafts" component={DailyDraftsScreen} />
    </Stack.Navigator>
  );
}
