'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchMyLikes } from '@/lib/api/feeds';
import { useAuthStore } from '@/lib/stores/auth-store';
import { identityCacheKey } from '@/lib/identity/identity-key';

/**
 * Infinite-query hook for the authenticated user's liked content. Returns the
 * same PodsResponse envelope as bookmarks, so the Likes tab reuses the shared
 * saved-row UI. Unlike is handled optimistically via useLikeMutation.
 */
export function useMyLikes() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const identityKey = identityCacheKey(userId);
  return useInfiniteQuery({
    queryKey: ['my-likes', identityKey],
    queryFn: ({ pageParam }) => fetchMyLikes(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
    staleTime: 1000 * 30,
    enabled: Boolean(userId),
  });
}
