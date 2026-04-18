import type { NavigatorScreenParams } from "@react-navigation/native";

// ── Auth ──────────────────────────────────────────────
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// ── Per-tab stacks ────────────────────────────────────
export type HomeStackParamList = {
  Dashboard: undefined;
};

export type PlanStackParamList = {
  PlannerHome: undefined;
};

export type FitnessStackParamList = {
  WorkoutList: undefined;
};

export type LibraryStackParamList = {
  BooksList: undefined;
};

export type FinanceStackParamList = {
  FinanceHome: undefined;
};

// ── Bottom tabs ───────────────────────────────────────
export type AppTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  PlanTab: NavigatorScreenParams<PlanStackParamList>;
  FitnessTab: NavigatorScreenParams<FitnessStackParamList>;
  LibraryTab: NavigatorScreenParams<LibraryStackParamList>;
  FinanceTab: NavigatorScreenParams<FinanceStackParamList>;
  MoreTab: undefined;
};

// ── Root app stack (tabs + More targets) ──────────────
export type AppStackParamList = {
  Tabs: NavigatorScreenParams<AppTabParamList>;
  Profile: undefined;
  Collections: undefined;
  Pokedex: undefined;
  Settings: undefined;
};