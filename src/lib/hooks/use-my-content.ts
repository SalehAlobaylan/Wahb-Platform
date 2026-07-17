'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchMyContent, type MyContentItem } from '@/lib/api/feeds';
import { useAuthStore } from '@/lib/stores/auth-store';
import { identityCacheKey } from '@/lib/identity/identity-key';

/**
 * Infinite-query hook for the authenticated user's submitted content,
 * scoped to a single ContentType. Backs the My Audio / My Writes tabs
 * on /profile.
 */
export function useMyContent(type: 'PODCAST' | 'ARTICLE' | 'VIDEO') {
    const userId = useAuthStore((state) => state.user?.id ?? null);
    const identityKey = identityCacheKey(userId);
    return useInfiniteQuery({
        queryKey: ['my-content', identityKey, type],
        queryFn: ({ pageParam }) => fetchMyContent(type, pageParam),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.cursor,
        staleTime: 1000 * 30,
        enabled: Boolean(userId),
    });
}

export type { MyContentItem };
