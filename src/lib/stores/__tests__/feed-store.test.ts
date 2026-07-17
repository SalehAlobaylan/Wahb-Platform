import { useFeedStore } from '@/lib/stores/feed-store';
import { migrateFeedPersistedState } from '@/lib/identity/persist-migration';

describe('feed interaction identity state', () => {
  beforeEach(() => {
    useFeedStore.setState({
      likedIds: new Set<string>(),
      bookmarkedIds: new Set<string>(),
      identityGeneration: 0,
      interactionAttempts: {},
      nextInteractionAttempt: 1,
    });
  });

  it('treats server flags as authoritative for content present in a response', () => {
    useFeedStore.setState({
      likedIds: new Set(['stale-like', 'unrelated-like']),
      bookmarkedIds: new Set(['stale-bookmark', 'unrelated-bookmark']),
    });

    useFeedStore.getState().seedInteractions(
      ['new-like'],
      ['new-bookmark'],
      ['stale-like', 'stale-bookmark', 'new-like', 'new-bookmark']
    );

    expect(useFeedStore.getState().likedIds).toEqual(new Set(['unrelated-like', 'new-like']));
    expect(useFeedStore.getState().bookmarkedIds).toEqual(
      new Set(['unrelated-bookmark', 'new-bookmark'])
    );
  });

  it('clears interaction flags and advances the generation at an identity boundary', () => {
    useFeedStore.setState({
      likedIds: new Set(['like']),
      bookmarkedIds: new Set(['bookmark']),
      forYouPlaybackById: {
        item: { timeSec: 42, progress: 50, updatedAt: 1_800_000_000_000 },
      },
      lastActiveForYouItemId: 'item',
      forYouActiveIndex: 4,
      newsActiveIndex: 2,
      progress: 50,
      identityGeneration: 4,
    });

    useFeedStore.getState().resetInteractionState();

    expect(useFeedStore.getState().likedIds).toEqual(new Set());
    expect(useFeedStore.getState().bookmarkedIds).toEqual(new Set());
    expect(useFeedStore.getState().forYouPlaybackById).toEqual({});
    expect(useFeedStore.getState().lastActiveForYouItemId).toBeNull();
    expect(useFeedStore.getState().forYouActiveIndex).toBe(0);
    expect(useFeedStore.getState().newsActiveIndex).toBe(0);
    expect(useFeedStore.getState().progress).toBe(0);
    expect(useFeedStore.getState().identityGeneration).toBe(5);
  });

  it('does not let an authoritative response overwrite a pending optimistic interaction', () => {
    useFeedStore.setState({ likedIds: new Set(['item']), bookmarkedIds: new Set() });
    const attempt = useFeedStore.getState().beginInteractionAttempt('like', 'item');
    useFeedStore.getState().toggleLike('item');

    useFeedStore.getState().seedInteractions(['item'], [], ['item']);

    expect(useFeedStore.getState().likedIds.has('item')).toBe(false);
    expect(useFeedStore.getState().isCurrentInteractionAttempt('like', 'item', attempt, 0)).toBe(true);
  });

  it('does not apply an old attempt after a newer interaction or identity switch', () => {
    const first = useFeedStore.getState().beginInteractionAttempt('bookmark', 'item');
    const second = useFeedStore.getState().beginInteractionAttempt('bookmark', 'item');

    expect(useFeedStore.getState().isCurrentInteractionAttempt('bookmark', 'item', first, 0)).toBe(false);
    expect(useFeedStore.getState().isCurrentInteractionAttempt('bookmark', 'item', second, 0)).toBe(true);

    useFeedStore.getState().resetInteractionState();
    expect(useFeedStore.getState().isCurrentInteractionAttempt('bookmark', 'item', second, 0)).toBe(false);
  });

  it('discards legacy unowned interaction fields while retaining local preferences', () => {
    expect(
      migrateFeedPersistedState({
        likedIds: ['account-a-like'],
        bookmarkedIds: ['account-a-bookmark'],
        sessionId: 'legacy-session',
        playbackSpeed: 1.5,
        forYouDisplayMode: 'transcript',
      })
    ).toEqual({ playbackSpeed: 1.5, forYouDisplayMode: 'transcript' });
    expect(migrateFeedPersistedState(null)).toEqual({});
  });
});
