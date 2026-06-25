'use client';

import { useEffect, useRef, type RefObject } from 'react';

interface UseInfiniteScrollOptions {
  hasNextPage: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  /** Scroll container to observe within. Defaults to the viewport. */
  root?: RefObject<HTMLElement | null>;
  rootMargin?: string;
}

/**
 * Attaches an IntersectionObserver to a sentinel element and calls
 * fetchNextPage when it scrolls into view. Returns the ref to spread onto a
 * sentinel <div> at the end of a list. Shared by the Saved page and the
 * profile library tabs.
 */
export function useInfiniteScroll({
  hasNextPage,
  isFetching,
  isFetchingNextPage,
  fetchNextPage,
  root,
  rootMargin = '300px',
}: UseInfiniteScrollOptions): RefObject<HTMLDivElement | null> {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetching && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: root?.current ?? null, rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, isFetchingNextPage, fetchNextPage, root, rootMargin]);

  return sentinelRef;
}
