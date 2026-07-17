import type {
  AnchoredFeedWindow,
  AnchorRestoreOutcome,
  FeedAnchor,
  FeedPageDescriptor,
  FeedWindowItem,
  HydratedFeedPage,
} from './types';

export const MAX_FEED_DESCRIPTORS = 20;
export const MAX_HYDRATED_FEED_PAGES = 5;

function descriptorFor<T extends FeedWindowItem>(
  startCursor: string | null,
  endCursor: string | null,
  items: T[],
  ordinal: number,
): FeedPageDescriptor {
  return { startCursor, endCursor, ids: items.map((item) => item.id), ordinal };
}

function boundedPayloads<T extends FeedWindowItem>(pages: HydratedFeedPage<T>[]): HydratedFeedPage<T>[] {
  return pages.slice(-MAX_HYDRATED_FEED_PAGES);
}

function boundedDescriptors(descriptors: FeedPageDescriptor[]): {
  descriptors: FeedPageDescriptor[];
  reachedHistoryBoundary: boolean;
} {
  const overflow = Math.max(0, descriptors.length - MAX_FEED_DESCRIPTORS);
  return {
    descriptors: overflow ? descriptors.slice(overflow) : descriptors,
    reachedHistoryBoundary: overflow > 0,
  };
}

export function createAnchoredFeedWindow<T extends FeedWindowItem>(): AnchoredFeedWindow<T> {
  return {
    descriptors: [],
    hydratedPages: [],
    anchor: { id: null, offsetPx: 0 },
    reachedHistoryBoundary: false,
  };
}

export function setFeedAnchor<T extends FeedWindowItem>(
  window: AnchoredFeedWindow<T>,
  anchor: FeedAnchor,
): AnchoredFeedWindow<T> {
  return { ...window, anchor: { id: anchor.id, offsetPx: Math.max(0, anchor.offsetPx) } };
}

/** Adds a forward page while retaining cursor descriptors after its payload evicts. */
export function appendFeedPage<T extends FeedWindowItem>(
  window: AnchoredFeedWindow<T>,
  startCursor: string | null,
  endCursor: string | null,
  items: T[],
): AnchoredFeedWindow<T> {
  const previous = window.descriptors.at(-1);
  const descriptor = descriptorFor(startCursor, endCursor, items, (previous?.ordinal ?? -1) + 1);
  const descriptors = boundedDescriptors([...window.descriptors, descriptor]);
  return {
    ...window,
    descriptors: descriptors.descriptors,
    hydratedPages: boundedPayloads([...window.hydratedPages, { startCursor, items }]),
    reachedHistoryBoundary: window.reachedHistoryBoundary || descriptors.reachedHistoryBoundary,
  };
}

/**
 * Rehydrates an evicted descriptor using its retained start cursor. The caller
 * can preserve an ID anchor only if the fresh response still contains it.
 */
export function rehydrateFeedPage<T extends FeedWindowItem>(
  window: AnchoredFeedWindow<T>,
  startCursor: string | null,
  endCursor: string | null,
  items: T[],
): { window: AnchoredFeedWindow<T>; outcome: AnchorRestoreOutcome } {
  const descriptorIndex = window.descriptors.findIndex((descriptor) => descriptor.startCursor === startCursor);
  if (descriptorIndex < 0) return { window, outcome: 'feed_updated' };

  const prior = window.descriptors[descriptorIndex];
  const ids = items.map((item) => item.id);
  const anchorId = window.anchor.id;
  const anchoredInPage = anchorId !== null && prior.ids.includes(anchorId);
  const outcome: AnchorRestoreOutcome = anchoredInPage && anchorId !== null && !ids.includes(anchorId)
    ? 'feed_updated'
    : 'preserved';
  const descriptors = [...window.descriptors];
  descriptors[descriptorIndex] = { ...prior, endCursor, ids };
  const withoutCurrent = window.hydratedPages.filter((page) => page.startCursor !== startCursor);
  return {
    outcome,
    window: {
      ...window,
      descriptors,
      hydratedPages: boundedPayloads([...withoutCurrent, { startCursor, items }]),
    },
  };
}

/** Flatten hydrated payloads without duplicate DOM keys when cursor pages overlap. */
export function hydratedWindowItems<T extends FeedWindowItem>(window: AnchoredFeedWindow<T>): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const page of window.hydratedPages) {
    for (const item of page.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}
