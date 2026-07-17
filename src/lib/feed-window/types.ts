export interface FeedWindowItem {
  id: string;
}

export interface FeedPageDescriptor {
  startCursor: string | null;
  endCursor: string | null;
  ids: string[];
  ordinal: number;
}

export interface HydratedFeedPage<T extends FeedWindowItem> {
  startCursor: string | null;
  items: T[];
}

export interface FeedAnchor {
  id: string | null;
  offsetPx: number;
}

export interface AnchoredFeedWindow<T extends FeedWindowItem> {
  descriptors: FeedPageDescriptor[];
  hydratedPages: HydratedFeedPage<T>[];
  anchor: FeedAnchor;
  reachedHistoryBoundary: boolean;
}

export type AnchorRestoreOutcome = 'preserved' | 'feed_updated';
