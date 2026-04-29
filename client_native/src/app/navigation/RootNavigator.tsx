import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator, NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { Text } from "react-native";

import { useAuth } from "@/features/auth/context/AuthContext";
import { LoginScreen } from "@/features/auth/screens/LoginScreen";
import { RegisterScreen } from "@/features/auth/screens/RegisterScreen";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useTabOrder, getTabLabel, type TabKey } from "@/hooks/useTabOrder";

import { HomeStack } from "./stacks/HomeStack";
import { PlanStack } from "./stacks/PlanStack";
import { FitnessStack } from "./stacks/FitnessStack";
import { LibraryStack } from "./stacks/LibraryStack";
import { FinanceStack } from "./stacks/FinanceStack";
import { MoreStack } from "./stacks/MoreStack";
import { MoreSheet } from "./components/MoreSheet";

import type { AppTabParamList, AppStackParamList, AuthStackParamList } from "./types";
import type { MoreDestinationKey } from "./components/MoreSheet";

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

// ── Main tabs ─────────────────────────────────────────
function AppTabs() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [moreVisible, setMoreVisible] = useState(false);
  const { order } = useTabOrder();

  const handleMoreNavigate = useCallback(
    (screen: MoreDestinationKey) => {
      switch (screen) {
        case "Profile":
        case "Collections":
        case "Pokedex":
        case "Settings":
        case "VolumesList":
          navigation.navigate("Tabs", {
            screen: "MoreTab",
            params: { screen, initial: false },
          } as never);
          return;
        case "Dashboard":
          navigation.navigate("Tabs", { screen: "HomeTab", params: { screen: "Dashboard" } } as never);
          return;
        case "DashboardPrefs":
          navigation.navigate("Tabs", { screen: "HomeTab", params: { screen: "DashboardPrefs" } } as never);
          return;
        case "PlannerHome":
        case "HabitsList":
        case "HabitEditor":
        case "TasksList":
        case "TaskEditor":
          navigation.navigate("Tabs", { screen: "PlanTab", params: { screen } } as never);
          return;
        case "WorkoutList":
        case "WorkoutTemplates":
        case "WorkoutEditor":
        case "FitnessGoals":
          navigation.navigate("Tabs", { screen: "FitnessTab", params: { screen } } as never);
          return;
        case "BooksList":
        case "BookDetails":
        case "BookNotes":
        case "DailyDrafts":
          navigation.navigate("Tabs", { screen: "LibraryTab", params: { screen } } as never);
          return;
        case "FinanceHome":
        case "Transactions":
        case "Budgets":
        case "Bills":
          navigation.navigate("Tabs", { screen: "FinanceTab", params: { screen } } as never);
          return;
        default:
          return;
      }
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
                <Text
                  style={{
                    color: focused ? theme.colors.primary : theme.colors.textSecondary,
                    fontSize: 16,
                    fontWeight: "700",
                    letterSpacing: 2,
                  }}
                >
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
          component={MoreStack}
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
      </AppStack.Navigator>
    </NavigationContainer>
  );
}
