import { View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ProfileScreen } from "@/features/profile/screens/ProfileScreen";
import { SettingsScreen } from "@/features/settings/screens/SettingsScreen";
import { CollectionsHubScreen } from "@/features/collections/screens/CollectionsHubScreen";
import { PokedexListScreen } from "@/features/pokedex/screens/PokedexListScreen";
import { VolumesListScreen } from "@/features/volumes/screens/VolumesListScreen";
import { VolumeEditorScreen } from "@/features/volumes/screens/VolumeEditorScreen";
import { useAppTheme } from "@/theme/ThemeProvider";

import type { MoreStackParamList } from "../types";

const Stack = createNativeStackNavigator<MoreStackParamList>();

// Never shown in normal flow — MoreTab press is intercepted to show the sheet.
function MoreLanding() {
  return <View style={{ flex: 1 }} />;
}

export function MoreStack() {
  const { theme } = useAppTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.textPrimary,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="MoreLanding" component={MoreLanding} options={{ headerShown: false }} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Collections" component={CollectionsHubScreen} />
      <Stack.Screen name="Pokedex" component={PokedexListScreen} options={{ title: "Pokédex" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="VolumesList" component={VolumesListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VolumeEditor" component={VolumeEditorScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
