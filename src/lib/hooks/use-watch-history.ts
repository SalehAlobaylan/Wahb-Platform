'use client';

import { useMemo } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import {
  fetchWatchHistory,
  clearWatchHistory,
  type WatchHistoryItem,
  type WatchHistoryResponse,
} from '@/lib/api/feeds';
import { useAuthStore } from '@/lib/stores';
import { identityCacheKey } from '@/lib/identity/identity-key';

type WatchHistoryPages = InfiniteData<WatchHistoryResponse, string | null>;

/**
 * Watch/listen history for the current identity (signed-in user or anonymous
 * session), with cursor pagination, de-duplication per content item, and an
 * optimistic clear. Shared by the Settings History panel and the profile
 * History tab — both use the SAME query key so clearing in one place empties
 * the other instantly.
 */
export function useWatchHistory() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();

  const queryKey = useMemo(
    () =>
      ['watch-history', identityCacheKey(isAuthenticated && user ? user.id : null)] as const,
    [isAuthenticated, user]
  );

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchWatchHistory(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  const clearMutation = useMutation({
    mutationFn: clearWatchHistory,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<WatchHistoryPages>(queryKey);

      queryClient.setQueryData<WatchHistoryPages>(queryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          pages: current.pages.map((page) => ({ ...page, cursor: null, items: [] })),
        };
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const items = useMemo<WatchHistoryItem[]>(() => {
    if (!query.data?.pages) return [];
    const seen = new Set<string>();
    const out: WatchHistoryItem[] = [];
    for (const page of query.data.pages) {
      for (const item of page.items) {
        if (!item?.content_id || seen.has(item.content_id)) continue;
        seen.add(item.content_id);
        out.push(item);
      }
    }
    return out;
  }, [query.data]);

  return {
    items,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: Boolean(query.hasNextPage),
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    clear: () => clearMutation.mutate(),
    isClearing: clearMutation.isPending,
  };
}

export type { WatchHistoryItem };
