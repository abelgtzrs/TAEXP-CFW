import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { VolumesListScreen } from "@/features/volumes/screens/VolumesListScreen";
import { VolumeEditorScreen } from "@/features/volumes/screens/VolumeEditorScreen";
import { useAppTheme } from "@/theme/ThemeProvider";

import type { VolumesStackParamList } from "../types";

const Stack = createNativeStackNavigator<VolumesStackParamList>();

export function VolumesStack() {
  const { theme } = useAppTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="VolumesList" component={VolumesListScreen} />
      <Stack.Screen name="VolumeEditor" component={VolumeEditorScreen} />
    </Stack.Navigator>
  );
}
