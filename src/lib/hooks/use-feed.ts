'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPodsFeedSession,
  fetchPodsFeedSession,
  fetchPodsFeedSessionFreshness,
  fetchNewsFeed,
  fetchBookmarks,
  fetchComments,
  fetchContentItem,
  fetchTranscript,
  postComment,
  requestTranscription,
  recordInteraction,
  removeInteraction,
} from '@/lib/api';
import { useFeedStore } from '@/lib/stores';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { CommentsResponse, ContentComment, Interaction, NewsWindow } from '@/types';
import type { BookmarkFeedFilter, BookmarkSort } from '@/lib/api/feeds';
import type { InfiniteData } from '@tanstack/react-query';
import type { PodsDurationPreference } from '@/lib/api/feeds';
import { identityCacheKey } from '@/lib/identity/identity-key';

function useIdentityCacheKey(): string {
  const userId = useAuthStore((state) =>
    state.isAuthenticated && state.user ? state.user.id : null
  );
  return identityCacheKey(userId);
}

/**
 * Hook for infinite scrolling Pods feed
 */
export function usePodsFeed(duration?: PodsDurationPreference | null) {
  const identityKey = useIdentityCacheKey();
  return useInfiniteQuery({
    queryKey: ['feed', 'pods', identityKey, { duration: duration ?? null }],
	queryFn: ({ pageParam }) => pageParam === null
	  ? createPodsFeedSession(duration)
	  : fetchPodsFeedSession(pageParam.sessionId, pageParam.cursor),
	initialPageParam: null as null | { sessionId: string; cursor: string },
	getNextPageParam: (lastPage) => lastPage.cursor ? { sessionId: lastPage.session_id, cursor: lastPage.cursor } : undefined,
    maxPages: 5,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function usePodsFeedFreshness(sessionId?: string) {
	const identityKey = useIdentityCacheKey();
	return useQuery({
		queryKey: ['feed', 'pods', 'freshness', identityKey, sessionId],
		queryFn: () => fetchPodsFeedSessionFreshness(sessionId!),
		enabled: Boolean(sessionId),
		refetchInterval: 60_000,
		staleTime: 30_000,
		retry: 1,
	});
}

/**
 * Hook for infinite scrolling News feed
 */
export function useNewsFeed(window: NewsWindow = 'today') {
  const identityKey = useIdentityCacheKey();
  return useInfiniteQuery({
    queryKey: ['feed', 'news', identityKey, window],
    queryFn: ({ pageParam }) => fetchNewsFeed(pageParam, window),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.cursor,
    maxPages: 5,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook for fetching bookmarked items
 */
export function useBookmarks({
  feed = 'all',
  sort = 'saved_desc',
  q = '',
}: {
  feed?: BookmarkFeedFilter;
  sort?: BookmarkSort;
  q?: string;
} = {}) {
  const identityKey = useIdentityCacheKey();
  const search = q.trim();
  return useInfiniteQuery({
    queryKey: ['bookmarks', identityKey, { feed, sort, q: search }],
    queryFn: ({ pageParam }) => fetchBookmarks({ cursor: pageParam, feed, sort, q: search }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook for liking/unliking content with optimistic updates
 */
export function useLikeMutation() {
  const toggleLike = useFeedStore((s) => s.toggleLike);

  return useMutation({
    mutationFn: async ({ contentId, isLiked }: { contentId: string; isLiked: boolean }) => {
      if (isLiked) {
        await removeInteraction(contentId, 'like');
      } else {
        await recordInteraction(contentId, 'like');
      }
    },
    // Like state is driven by the optimistic feed-store toggle (likedIds). We do
    // NOT invalidate ['feed'] here — that refetched every loaded page of both
    // feeds on every tap and disrupted scroll. Counts refresh on the next
    // natural refetch (staleTime / window focus).
    onMutate: async ({ contentId }) => {
      const identityGeneration = useFeedStore.getState().identityGeneration;
      const attempt = useFeedStore.getState().beginInteractionAttempt('like', contentId);
      // Optimistic update
      toggleLike(contentId);
      return { identityGeneration, attempt };
    },
    onError: (_, { contentId }, context) => {
      // Rollback on error
      if (context && useFeedStore.getState().isCurrentInteractionAttempt(
        'like', contentId, context.attempt, context.identityGeneration
      )) {
        toggleLike(contentId);
      }
    },
    onSettled: (_data, _error, { contentId }, context) => {
      if (context) {
        useFeedStore.getState().finishInteractionAttempt(
          'like', contentId, context.attempt, context.identityGeneration
        );
      }
    },
  });
}

/**
 * Hook for bookmarking/unbookmarking content with optimistic updates
 */
export function useBookmarkMutation() {
  const queryClient = useQueryClient();
  const toggleBookmark = useFeedStore((s) => s.toggleBookmark);
  const identityKey = useIdentityCacheKey();

  return useMutation({
    mutationFn: async ({ contentId, isBookmarked }: { contentId: string; isBookmarked: boolean }) => {
      if (isBookmarked) {
        await removeInteraction(contentId, 'bookmark');
      } else {
        await recordInteraction(contentId, 'bookmark');
      }
    },
    onMutate: async ({ contentId, isBookmarked }) => {
      const identityGeneration = useFeedStore.getState().identityGeneration;
      const attempt = useFeedStore.getState().beginInteractionAttempt('bookmark', contentId);
      // Optimistic update of the local id set
      toggleBookmark(contentId);

      // Optimistically remove from the saved-page list too — invalidation
      // alone leaves the item visible (and looking bookmarked) until the
      // refetch lands, and a second tap would fire a bogus DELETE.
      let previousEntries: Array<[readonly unknown[], InfiniteData<{ cursor: string | null; items: { id: string }[] }> | undefined]> = [];
      if (isBookmarked) {
        await queryClient.cancelQueries({ queryKey: ['bookmarks', identityKey] });
        previousEntries = queryClient.getQueriesData<InfiniteData<{ cursor: string | null; items: { id: string }[] }>>({
          queryKey: ['bookmarks', identityKey],
        });
        queryClient.setQueriesData<InfiniteData<{ cursor: string | null; items: { id: string }[] }>>(
          { queryKey: ['bookmarks', identityKey] },
          (current) => {
            if (!current) return current;
            return {
              ...current,
              pages: current.pages.map((page) => ({
                ...page,
                items: page.items.filter((item) => item.id !== contentId),
              })),
            };
          }
        );
      }
      return { previousEntries, identityGeneration, attempt };
    },
    onError: (_, { contentId }, context) => {
      // Rollback on error
      if (context && useFeedStore.getState().isCurrentInteractionAttempt(
        'bookmark', contentId, context.attempt, context.identityGeneration
      )) {
        toggleBookmark(contentId);
      }
      for (const [queryKey, previous] of context?.previousEntries ?? []) {
        queryClient.setQueryData(queryKey, previous);
      }
    },
    onSettled: (_data, _error, { contentId }, context) => {
      if (context) {
        useFeedStore.getState().finishInteractionAttempt(
          'bookmark', contentId, context.attempt, context.identityGeneration
        );
      }
      // Invalidate bookmarks query
      queryClient.invalidateQueries({ queryKey: ['bookmarks', identityKey] });
    },
  });
}

/**
 * Hook for fetching a content item's comments (newest first, paginated).
 */
export function useComments(contentId?: string | null) {
  const identityKey = useIdentityCacheKey();
  return useInfiniteQuery({
    queryKey: ['comments', identityKey, contentId],
    queryFn: ({ pageParam }) => fetchComments(contentId!, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.cursor,
    enabled: !!contentId,
    staleTime: 1000 * 30,
  });
}

/**
 * Hook for posting a comment with an optimistic prepend into the comments
 * cache, rolled back on error.
 */
export function useAddCommentMutation(contentId: string) {
  const queryClient = useQueryClient();
  const identityKey = useIdentityCacheKey();
  const commentQueryKey = ['comments', identityKey, contentId] as const;

  return useMutation({
    mutationFn: ({ text }: { text: string }) => {
      const { user } = useAuthStore.getState();
      return postComment(contentId, text, user?.username || undefined);
    },
    onMutate: async ({ text }) => {
      await queryClient.cancelQueries({ queryKey: commentQueryKey });
      const previous = queryClient.getQueryData<InfiniteData<CommentsResponse>>(commentQueryKey);

      const { user } = useAuthStore.getState();
      const optimistic: ContentComment = {
        id: `optimistic-${Date.now()}`,
        text,
        author: user?.username || undefined,
        is_mine: true,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<InfiniteData<CommentsResponse>>(
        commentQueryKey,
        (old) => {
          if (!old || old.pages.length === 0) {
            return {
              pages: [{ cursor: null, items: [optimistic] }],
              pageParams: [null],
            };
          }
          const [first, ...rest] = old.pages;
          return {
            ...old,
            pages: [{ ...first, items: [optimistic, ...first.items] }, ...rest],
          };
        }
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(commentQueryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: commentQueryKey });
    },
  });
}

/**
 * Hook for fetching the full content item by ID.
 *
 * Feed endpoints cap body_text (the news feed truncates it to 600 chars in
 * SQL to keep payloads small), so anything that renders the whole article —
 * the reader — must fetch the item itself.
 */
export function useContentItem(contentId?: string | null) {
  return useQuery({
    queryKey: ['content', contentId],
    queryFn: () => fetchContentItem(contentId!),
    enabled: !!contentId,
    staleTime: 1000 * 60 * 10, // 10 min — article bodies rarely change
  });
}

/**
 * Hook for lazy-loading a transcript by ID.
 * Only fetches when transcriptId is provided (enabled gate).
 */
export function useTranscript(transcriptId?: string | null) {
  return useQuery({
    queryKey: ['transcript', transcriptId],
    queryFn: () => fetchTranscript(transcriptId!),
    enabled: !!transcriptId,
    staleTime: 1000 * 60 * 10, // 10 min — transcripts are immutable
  });
}

/**
 * Hook for requesting on-demand transcript generation.
 * Triggers CMS → Enrichment → write-back flow.
 */
export function useRequestTranscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contentItemId: string) => requestTranscription(contentItemId),
    onSuccess: () => {
      // Invalidate feed queries so transcript_id appears on next refetch
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

/**
 * Hook for recording view/complete events (fire-and-forget)
 */
export function useTrackingMutation() {
  return useMutation({
    mutationFn: async ({
      contentId,
      type,
      metadata,
    }: {
      contentId: string;
      type: Extract<Interaction['interaction_type'], 'view' | 'complete'>;
      metadata?: Record<string, unknown>;
    }) => {
      await recordInteraction(contentId, type, metadata);
    },
  });
}
