import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ForYouDisplayMode = 'fit' | 'fill' | 'transcript';

interface FeedState {
  // Active feed state
  forYouActiveIndex: number;
  newsActiveIndex: number;
  isPlaying: boolean;
  globalPaused: boolean;
  playbackSpeed: number;
  forYouDisplayMode: ForYouDisplayMode;
  progress: number;
  forYouPlaybackById: Record<string, { timeSec: number; progress: number }>;
  lastActiveForYouItemId: string | null;

  // Scroll optimization
  isFastSwiping: boolean;
  backoffUntil: number;

  // User preferences
  bookmarkedIds: Set<string>;
  likedIds: Set<string>;

  // Session state
  sessionId: string;

  // Actions
  setForYouActiveIndex: (index: number) => void;
  setNewsActiveIndex: (index: number) => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setForYouDisplayMode: (mode: ForYouDisplayMode) => void;
  setProgress: (progress: number) => void;
  setForYouPlayback: (id: string, timeSec: number, progress: number) => void;
  setLastActiveForYouItemId: (id: string | null) => void;
  toggleBookmark: (id: string) => void;
  toggleLike: (id: string) => void;
  /**
   * Merge server-side interaction flags (is_liked / is_bookmarked from feed
   * responses) into the local sets. Additive only — never removes ids — so a
   * concurrent optimistic un-like isn't clobbered by an in-flight refetch.
   */
  seedInteractions: (likedIds: string[], bookmarkedIds: string[]) => void;
  resetProgress: () => void;
  setFastSwiping: (fast: boolean) => void;
  setBackoffUntil: (until: number) => void;
}

// Generate a session ID for anonymous tracking
const generateSessionId = () => {
  if (typeof window === 'undefined') return 'server';
  const stored = sessionStorage.getItem('wahb_session_id');
  if (stored) return stored;
  const newId = crypto.randomUUID();
  sessionStorage.setItem('wahb_session_id', newId);
  return newId;
};

export const useFeedStore = create<FeedState>()(
  persist(
    (set, get) => ({
      // Initial state
      forYouActiveIndex: 0,
      newsActiveIndex: 0,
      isPlaying: true,
      globalPaused: false,
      playbackSpeed: 1.0,
      forYouDisplayMode: 'fit',
      progress: 0,
      forYouPlaybackById: {},
      lastActiveForYouItemId: null,
      isFastSwiping: false,
      backoffUntil: 0,
      bookmarkedIds: new Set<string>(),
      likedIds: new Set<string>(),
      sessionId: '',

      // Actions
      setForYouActiveIndex: (index) => set({ forYouActiveIndex: index }),

      setNewsActiveIndex: (index) => set({ newsActiveIndex: index }),

      togglePlay: () => set((state) => {
        const nextPlaying = !state.isPlaying;
        return {
          isPlaying: nextPlaying,
          globalPaused: !nextPlaying,
        };
      }),

      setPlaying: (playing) => set({ isPlaying: playing, globalPaused: !playing }),

      setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

      setForYouDisplayMode: (mode) => set({ forYouDisplayMode: mode }),

      setProgress: (progress) => set({ progress }),

      setForYouPlayback: (id, timeSec, progress) =>
        set((state) => ({
          forYouPlaybackById: {
            ...state.forYouPlaybackById,
            [id]: {
              timeSec,
              progress,
            },
          },
        })),

      setLastActiveForYouItemId: (id) => set({ lastActiveForYouItemId: id }),

      setFastSwiping: (fast) => set({ isFastSwiping: fast }),

      setBackoffUntil: (until) => set({ backoffUntil: until }),

      toggleBookmark: (id) => set((state) => {
        const newSet = new Set(state.bookmarkedIds);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return { bookmarkedIds: newSet };
      }),

      seedInteractions: (liked, bookmarked) => set((state) => {
        const newLiked = liked.filter((id) => !state.likedIds.has(id));
        const newBookmarked = bookmarked.filter((id) => !state.bookmarkedIds.has(id));
        if (newLiked.length === 0 && newBookmarked.length === 0) return {};
        return {
          ...(newLiked.length > 0 && {
            likedIds: new Set([...state.likedIds, ...newLiked]),
          }),
          ...(newBookmarked.length > 0 && {
            bookmarkedIds: new Set([...state.bookmarkedIds, ...newBookmarked]),
          }),
        };
      }),

      toggleLike: (id) => set((state) => {
        const newSet = new Set(state.likedIds);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return { likedIds: newSet };
      }),

      resetProgress: () => set({ progress: 0 }),
    }),
    {
      name: 'wahb-feed-storage',
      partialize: (state) => ({
        bookmarkedIds: Array.from(state.bookmarkedIds),
        likedIds: Array.from(state.likedIds),
        playbackSpeed: state.playbackSpeed,
        forYouDisplayMode: state.forYouDisplayMode,
        forYouPlaybackById: state.forYouPlaybackById,
        lastActiveForYouItemId: state.lastActiveForYouItemId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert arrays back to Sets after rehydration
          state.bookmarkedIds = new Set(state.bookmarkedIds as unknown as string[]);
          state.likedIds = new Set(state.likedIds as unknown as string[]);
          state.sessionId = generateSessionId();
        }
      },
    }
  )
);
