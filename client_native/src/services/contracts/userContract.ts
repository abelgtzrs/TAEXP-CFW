import apiClient from "@/services/api/client";

import type { AuthUser } from "./authContract";

export type RecentAcquisition = {
  name: string;
  type: string;
  rarity?: string;
  imageUrl?: string | null;
  obtainedAt?: string | null;
};

export type YearlyGoal = {
  name: string;
  metric?: string;
  target: number;
  current: number;
  icon?: string;
  color?: string;
};

export type TopProduct = {
  name: string;
  units: number;
};

export type DashboardStats = {
  habitsCompleted?: number;
  totalWorkouts?: number;
  booksFinished?: number;
  activeStreaks?: number;
  longestLoginStreak?: number;
  gachaPulls?: number;
  volumesPublished?: number;
  tasksCompletedToday?: number;
  tasksPending?: number;
  workoutsThisWeek?: number;
  totalBudget?: number;
  goals?: Record<string, number>;
  allGoals?: YearlyGoal[];
  recentAcquisitions?: RecentAcquisition[];
  topProducts?: TopProduct[];
  [key: string]: unknown;
};

export type StreakStatus = {
  countedToday: boolean;
  currentLoginStreak: number;
  longestLoginStreak: number;
  lastLoginDate?: string | null;
};

export type StreakTickResult = StreakStatus & {
  changed: boolean;
  awardedBadge?: {
    badgeId?: string;
    name?: string;
    imageUrl?: string;
    spriteSmallUrl?: string;
  } | null;
};

type Envelope<T> = {
  success?: boolean;
  data?: T;
};

function assertData<T>(envelope: Envelope<T>, label: string) {
  if (typeof envelope.data === "undefined") {
    throw new Error(`Invalid ${label} response from server`);
  }
  return envelope.data;
}

export async function fetchDashboardStats() {
  const response = await apiClient.get<Envelope<DashboardStats>>("/users/me/dashboard-stats");
  return assertData(response.data, "dashboard stats");
}

export async function fetchStreakStatus() {
  const response = await apiClient.get<Envelope<StreakStatus>>("/users/me/streak/status");
  return assertData(response.data, "streak status");
}

export async function tickStreak() {
  const response = await apiClient.post<Envelope<StreakTickResult>>("/users/me/streak/tick");
  return assertData(response.data, "tick streak");
}

export async function fetchCurrentUserProfile() {
  const response = await apiClient.get<Envelope<AuthUser>>("/users/me");
  return assertData(response.data, "current user profile");
}
