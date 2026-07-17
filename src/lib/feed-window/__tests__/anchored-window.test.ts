import {
  appendFeedPage,
  createAnchoredFeedWindow,
  hydratedWindowItems,
  MAX_FEED_DESCRIPTORS,
  MAX_HYDRATED_FEED_PAGES,
  rehydrateFeedPage,
  setFeedAnchor,
} from '@/lib/feed-window/anchored-window';

const page = (prefix: string, count = 2) => Array.from({ length: count }, (_, index) => ({ id: `${prefix}-${index}` }));

describe('anchored feed window', () => {
  it('keeps descriptors after payload eviction while bounding hydrated pages', () => {
    let window = createAnchoredFeedWindow<{ id: string }>();
    for (let index = 0; index < MAX_HYDRATED_FEED_PAGES + 2; index += 1) {
      window = appendFeedPage(window, `cursor-${index}`, `cursor-${index + 1}`, page(`page-${index}`));
    }

    expect(window.descriptors).toHaveLength(MAX_HYDRATED_FEED_PAGES + 2);
    expect(window.hydratedPages).toHaveLength(MAX_HYDRATED_FEED_PAGES);
    expect(window.descriptors[0].startCursor).toBe('cursor-0');
  });

  it('preserves an anchored ID when an evicted page is refetched', () => {
    let window = appendFeedPage(createAnchoredFeedWindow<{ id: string }>(), 'start', 'end', page('old'));
    window = setFeedAnchor(window, { id: 'old-1', offsetPx: 24 });

    const result = rehydrateFeedPage(window, 'start', 'end-2', [{ id: 'new-0' }, { id: 'old-1' }]);

    expect(result.outcome).toBe('preserved');
    expect(result.window.anchor).toEqual({ id: 'old-1', offsetPx: 24 });
  });

  it('reports a typed feed update rather than silently substituting a missing anchor', () => {
    let window = appendFeedPage(createAnchoredFeedWindow<{ id: string }>(), null, 'end', page('old'));
    window = setFeedAnchor(window, { id: 'old-0', offsetPx: 9 });

    expect(rehydrateFeedPage(window, null, 'end-2', page('new')).outcome).toBe('feed_updated');
  });

  it('deduplicates overlapping hydrated pages for stable DOM keys', () => {
    let window = appendFeedPage(createAnchoredFeedWindow<{ id: string }>(), null, 'one', [{ id: 'a' }, { id: 'b' }]);
    window = appendFeedPage(window, 'one', 'two', [{ id: 'b' }, { id: 'c' }]);

    expect(hydratedWindowItems(window).map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('retains only a bounded cursor history and exposes the explicit boundary', () => {
    let window = createAnchoredFeedWindow<{ id: string }>();
    for (let index = 0; index < MAX_FEED_DESCRIPTORS + 1; index += 1) {
      window = appendFeedPage(window, `cursor-${index}`, `cursor-${index + 1}`, page(`page-${index}`));
    }

    expect(window.descriptors).toHaveLength(MAX_FEED_DESCRIPTORS);
    expect(window.descriptors[0].startCursor).toBe('cursor-1');
    expect(window.reachedHistoryBoundary).toBe(true);
  });
});
