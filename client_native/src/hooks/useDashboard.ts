import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchDashboardStats,
  fetchStreakStatus,
  tickStreak,
  type DashboardStats,
  type StreakStatus,
  type StreakTickResult,
} from "@/services/contracts/userContract";

// ── Query keys ────────────────────────────────────────
export const DASHBOARD_KEYS = {
  stats: ["dashboard.stats"] as const,
  streak: ["dashboard.streakStatus"] as const,
};

// ── Individual hooks ──────────────────────────────────
export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: DASHBOARD_KEYS.stats,
    queryFn: fetchDashboardStats,
  });
}

export function useStreakStatus() {
  return useQuery<StreakStatus>({
    queryKey: DASHBOARD_KEYS.streak,
    queryFn: fetchStreakStatus,
  });
}

export function useTickStreak() {
  const qc = useQueryClient();
  return useMutation<StreakTickResult, Error>({
    mutationFn: tickStreak,
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: DASHBOARD_KEYS.stats }),
        qc.invalidateQueries({ queryKey: DASHBOARD_KEYS.streak }),
        qc.invalidateQueries({ queryKey: ["profile.me"] }),
      ]);
    },
  });
}

// ── Combined dashboard hook ───────────────────────────
export function useDashboard() {
  const statsQuery = useDashboardStats();
  const streakQuery = useStreakStatus();
  const tickMutation = useTickStreak();

  const isLoading = statsQuery.isLoading || streakQuery.isLoading;
  const isRefetching = statsQuery.isRefetching || streakQuery.isRefetching;
  const hasError = statsQuery.isError || streakQuery.isError;
  const isPartialFailure = (statsQuery.isError && !streakQuery.isError) || (!statsQuery.isError && streakQuery.isError);

  return {
    stats: statsQuery.data,
    streak: streakQuery.data,
    isLoading,
    isRefetching,
    hasError,
    isPartialFailure,
    statsError: statsQuery.error,
    streakError: streakQuery.error,
    refetch: async () => {
      await Promise.all([statsQuery.refetch(), streakQuery.refetch()]);
    },
    tickStreak: tickMutation.mutate,
    isTickingStreak: tickMutation.isPending,
    tickResult: tickMutation.data,
  };
}
