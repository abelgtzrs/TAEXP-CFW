import type { NavigatorScreenParams } from "@react-navigation/native";

// ── Auth ──────────────────────────────────────────────
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// ── Per-tab stacks ────────────────────────────────────
export type HomeStackParamList = {
  Dashboard: undefined;
  DashboardPrefs: undefined;
};

export type PlanStackParamList = {
  PlannerHome: undefined;
  HabitsList: undefined;
  HabitEditor: undefined;
  TasksList: undefined;
  TaskEditor: undefined;
};

export type FitnessStackParamList = {
  WorkoutList: undefined;
  WorkoutTemplates: undefined;
  WorkoutEditor: undefined;
  FitnessGoals: undefined;
};

export type LibraryStackParamList = {
  BooksList: undefined;
  BookDetails: undefined;
  BookNotes: undefined;
  DailyDrafts: undefined;
};

export type FinanceStackParamList = {
  FinanceHome: undefined;
  Transactions: undefined;
  Budgets: undefined;
  Bills: undefined;
};

// ── More tab stack ────────────────────────────────────
export type MoreStackParamList = {
  MoreLanding: undefined;
  Profile: undefined;
  Collections: undefined;
  Pokedex: undefined;
  Settings: undefined;
  VolumesList: undefined;
  VolumeEditor: { id?: string };
};

// ── Bottom tabs ───────────────────────────────────────
export type AppTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  PlanTab: NavigatorScreenParams<PlanStackParamList>;
  FitnessTab: NavigatorScreenParams<FitnessStackParamList>;
  LibraryTab: NavigatorScreenParams<LibraryStackParamList>;
  FinanceTab: NavigatorScreenParams<FinanceStackParamList>;
  MoreTab: NavigatorScreenParams<MoreStackParamList>;
};

// ── Volumes stack (kept for VolumesStack.tsx) ─────────
export type VolumesStackParamList = {
  VolumesList: undefined;
  VolumeEditor: { id?: string };
};

// ── Root app stack ────────────────────────────────────
export type AppStackParamList = {
  Tabs: NavigatorScreenParams<AppTabParamList>;
};
