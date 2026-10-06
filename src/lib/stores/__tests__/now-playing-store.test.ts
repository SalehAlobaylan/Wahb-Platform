import { useNowPlayingStore } from '@/lib/stores/now-playing-store';
import type { ContentItem } from '@/types';

const item: ContentItem = {
  id: 'item-1',
  type: 'PODCAST',
  playback_url: 'https://cdn.test/item.mp3',
  playback_type: 'audio',
  title: 'Audio item',
  like_count: 0,
  comment_count: 0,
  share_count: 0,
  published_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
};

describe('now playing ownership', () => {
  beforeEach(() => {
    useNowPlayingStore.setState({
      currentItem: null,
      isPlaying: false,
      audioSrc: null,
      playbackOwner: 'none',
      seekTo: null,
      pendingSeek: null,
    });
  });

  it('hands an audio-only Pods item to global audio without conflating media type and owner', () => {
    const store = useNowPlayingStore.getState();
    store.setCurrentFromPods(item, true);
    expect(useNowPlayingStore.getState()).toMatchObject({ playbackOwner: 'pods', isPlaying: true });

    useNowPlayingStore.getState().handoffToGlobalAudio(42, true);
    expect(useNowPlayingStore.getState()).toMatchObject({
      playbackOwner: 'global',
      seekTo: 42,
      isPlaying: true,
    });
  });

  it('clears ownership when playback stops', () => {
    useNowPlayingStore.getState().setCurrentFromPods(item);
    useNowPlayingStore.getState().stop();
    expect(useNowPlayingStore.getState()).toMatchObject({ playbackOwner: 'none', currentItem: null });
  });
  it('retains the approved fallback across pause metadata sync and global handoff', () => {
    const store = useNowPlayingStore.getState();
    store.setCurrentFromPods(item);
    store.setPodsPlaybackSource(item.id, 'https://cdn.test/fallback.m4a');
    store.setCurrentFromPods(item, false);
    expect(useNowPlayingStore.getState().audioSrc).toBe('https://cdn.test/fallback.m4a');
    store.handoffToGlobalAudio(42, false);
    store.setPodsPlaybackSource(item.id, 'https://cdn.test/stale.mp4');
    expect(useNowPlayingStore.getState()).toMatchObject({ audioSrc: 'https://cdn.test/fallback.m4a', seekTo: 42, isPlaying: false });
  });
});
