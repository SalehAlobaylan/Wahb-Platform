'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchMyContent, type MyContentItem } from '@/lib/api/feeds';

/**
 * Infinite-query hook for the authenticated user's submitted content,
 * scoped to a single ContentType. Backs the My Audio / My Writes tabs
 * on /profile.
 */
export function useMyContent(type: 'PODCAST' | 'ARTICLE' | 'VIDEO') {
    return useInfiniteQuery({
        queryKey: ['my-content', type],
        queryFn: ({ pageParam }) => fetchMyContent(type, pageParam),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.cursor,
        staleTime: 1000 * 30,
    });
}

export type { MyContentItem };
