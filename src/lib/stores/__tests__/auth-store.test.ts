import { useAuthStore } from '@/lib/stores/auth-store';
import { useFeedStore } from '@/lib/stores/feed-store';
import type { AuthUser } from '@/types';

const user = (id: string): AuthUser => ({
  id,
  username: `user-${id}`,
  email: `${id}@example.test`,
  tenant_id: 'tenant',
  created_at: '2026-01-01T00:00:00Z',
});

describe('auth identity transitions', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
    useFeedStore.setState({
      likedIds: new Set(),
      bookmarkedIds: new Set(),
      forYouPlaybackById: {},
      lastActiveForYouItemId: null,
      identityGeneration: 0,
      interactionAttempts: {},
    });
  });

  it('clears anonymous/private feed state before the first authenticated identity', () => {
    useFeedStore.setState({
      likedIds: new Set(['anonymous-like']),
      forYouPlaybackById: { item: { timeSec: 12, progress: 10, updatedAt: Date.now() } },
      lastActiveForYouItemId: 'item',
    });

    useAuthStore.getState().setUser(user('account-a'));

    expect(useFeedStore.getState().likedIds).toEqual(new Set());
    expect(useFeedStore.getState().forYouPlaybackById).toEqual({});
    expect(useFeedStore.getState().lastActiveForYouItemId).toBeNull();
  });

  it('invalidates stale optimistic work when a different account replaces the current one', () => {
    useAuthStore.getState().setUser(user('account-a'));
    const attempt = useFeedStore.getState().beginInteractionAttempt('like', 'item');
    const generation = useFeedStore.getState().identityGeneration;

    useAuthStore.getState().setUser(user('account-b'));

    expect(useFeedStore.getState().isCurrentInteractionAttempt('like', 'item', attempt, generation)).toBe(false);
    expect(useAuthStore.getState().user?.id).toBe('account-b');
  });
});
