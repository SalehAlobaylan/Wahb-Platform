'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchUserStats, type UserStats } from '@/lib/api/feeds';
import { useAuthStore } from '@/lib/stores';

/**
 * Aggregate profile counts (saved / likes / listened / created) for the
 * authenticated user. Only runs when signed in; cached briefly so tab switches
 * and interactions don't refetch on every render.
 */
export function useUserStats() {
  const { user, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['user-stats', user?.id ?? null],
    queryFn: fetchUserStats,
    enabled: isAuthenticated && !!user,
    staleTime: 1000 * 30,
  });
}

export type { UserStats };
