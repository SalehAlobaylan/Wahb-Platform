'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchMyLikes } from '@/lib/api/feeds';

/**
 * Infinite-query hook for the authenticated user's liked content. Returns the
 * same ForYouResponse envelope as bookmarks, so the Likes tab reuses the shared
 * saved-row UI. Unlike is handled optimistically via useLikeMutation.
 */
export function useMyLikes() {
  return useInfiniteQuery({
    queryKey: ['my-likes'],
    queryFn: ({ pageParam }) => fetchMyLikes(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
    staleTime: 1000 * 30,
  });
}
