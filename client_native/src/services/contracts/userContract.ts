import apiClient from "@/services/api/client";

import type { AuthUser } from "./authContract";

export type RecentAcquisition = {
  name: string;
  type: string;
  rarity?: string;
  imageUrl?: string | null;
};

export type DashboardStats = {
  habitsCompleted?: number;
  totalWorkouts?: number;
  booksFinished?: number;
  activeStreaks?: number;
  gachaPulls?: number;
  volumesPublished?: number;
  goals?: Record<string, number>;
  recentAcquisitions?: RecentAcquisition[];
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