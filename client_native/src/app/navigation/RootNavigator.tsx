import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator, NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { Text, View } from "react-native";

import { useAuth } from "@/features/auth/context/AuthContext";
import { LoginScreen } from "@/features/auth/screens/LoginScreen";
import { RegisterScreen } from "@/features/auth/screens/RegisterScreen";
import { ProfileScreen } from "@/features/profile/screens/ProfileScreen";
import { SettingsScreen } from "@/features/settings/screens/SettingsScreen";
import { CollectionsHubScreen } from "@/features/collections/screens/CollectionsHubScreen";
import { PokedexListScreen } from "@/features/pokedex/screens/PokedexListScreen";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useTabOrder, getTabLabel, type TabKey } from "@/hooks/useTabOrder";

import { HomeStack } from "./stacks/HomeStack";
import { PlanStack } from "./stacks/PlanStack";
import { FitnessStack } from "./stacks/FitnessStack";
import { LibraryStack } from "./stacks/LibraryStack";
import { FinanceStack } from "./stacks/FinanceStack";
import { MoreSheet } from "./components/MoreSheet";

import type { AppTabParamList, AppStackParamList, AuthStackParamList } from "./types";

const Tab = createBottomTabNavigator<AppTabParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

// ── Tab icon map ──────────────────────────────────────
const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  HomeTab: { active: "🏠", inactive: "🏠" },
  PlanTab: { active: "📋", inactive: "📋" },
  FitnessTab: { active: "🏋️", inactive: "🏋️" },
  LibraryTab: { active: "📚", inactive: "📚" },
  FinanceTab: { active: "💰", inactive: "💰" },
  MoreTab: { active: "•••", inactive: "•••" },
};

// ── Tab component map ─────────────────────────────────
const TAB_COMPONENTS: Record<TabKey, React.ComponentType<object>> = {
  HomeTab: HomeStack,
  PlanTab: PlanStack,
  FitnessTab: FitnessStack,
  LibraryTab: LibraryStack,
  FinanceTab: FinanceStack,
};

// ── Dummy component for the More tab (never rendered) ─
function MoreTabPlaceholder() {
  return <View />;
}

// ── Main tabs ─────────────────────────────────────────
function AppTabs() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [moreVisible, setMoreVisible] = useState(false);
  const { order } = useTabOrder();

  const handleMoreNavigate = useCallback(
    (screen: string) => {
      const name = screen as Extract<keyof AppStackParamList, "Profile" | "Collections" | "Pokedex" | "Settings">;
      navigation.navigate(name);
    },
    [navigation],
  );

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
            paddingTop: 6,
            height: 60,
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: 2,
          },
          tabBarIcon: ({ focused }) => {
            const icons = TAB_ICONS[route.name];
            if (route.name === "MoreTab") {
              return (
                <Text style={{ color: focused ? theme.colors.primary : theme.colors.textSecondary, fontSize: 16, fontWeight: "700", letterSpacing: 2 }}>
                  •••
                </Text>
              );
            }
            return <Text style={{ fontSize: 20 }}>{focused ? icons?.active : icons?.inactive}</Text>;
          },
        })}
      >
        {order.map((tabKey) => (
          <Tab.Screen
            key={tabKey}
            name={tabKey}
            component={TAB_COMPONENTS[tabKey]}
            options={{ title: getTabLabel(tabKey) }}
          />
        ))}
        <Tab.Screen
          name="MoreTab"
          component={MoreTabPlaceholder}
          options={{ title: "More" }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setMoreVisible(true);
            },
          }}
        />
      </Tab.Navigator>

      <MoreSheet visible={moreVisible} onClose={() => setMoreVisible(false)} onNavigate={handleMoreNavigate} />
    </>
  );
}

// ── Auth stack ────────────────────────────────────────
function AuthStackNavigator() {
  const { theme } = useAppTheme();

  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// ── Root navigator ────────────────────────────────────
export function RootNavigator() {
  const { user, restoringSession } = useAuth();
  const { theme, navigationTheme } = useAppTheme();

  if (restoringSession) {
    return null;
  }

  if (!user) {
    return (
      <NavigationContainer theme={navigationTheme}>
        <AuthStackNavigator />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <AppStack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.textPrimary,
        }}
      >
        <AppStack.Screen name="Tabs" component={AppTabs} options={{ headerShown: false }} />
        <AppStack.Screen name="Profile" component={ProfileScreen} />
        <AppStack.Screen name="Collections" component={CollectionsHubScreen} />
        <AppStack.Screen name="Pokedex" component={PokedexListScreen} options={{ title: "Pokédex" }} />
        <AppStack.Screen name="Settings" component={SettingsScreen} />
      </AppStack.Navigator>
    </NavigationContainer>
  );
}