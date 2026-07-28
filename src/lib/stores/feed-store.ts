import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { migrateFeedPersistedState } from '@/lib/identity/persist-migration';
import {
  pruneRecentPlayback,
  writeRecentPlayback,
  type PlaybackProgress,
} from '@/lib/feed-window/progress-cache';

export type PodsDisplayMode = 'fit' | 'fill' | 'transcript';
export type InteractionKind = 'like' | 'bookmark';

interface FeedState {
  // Active feed state
  podsActiveIndex: number;
  newsActiveIndex: number;
  isPlaying: boolean;
  globalPaused: boolean;
  playbackSpeed: number;
  podsDisplayMode: PodsDisplayMode;
  // When a News story has no real post image, the hero shows only a small source
  // logo. This persisted preference lets the reader expand it to a larger view.
  newsSourceImageExpanded: boolean;
  progress: number;
  podsPlaybackById: Record<string, PlaybackProgress>;
  lastActivePodsItemId: string | null;

  // Scroll optimization
  isFastSwiping: boolean;

  // User preferences
  bookmarkedIds: Set<string>;
  likedIds: Set<string>;

  // Actions
  setPodsActiveIndex: (index: number) => void;
  setNewsActiveIndex: (index: number) => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setPodsDisplayMode: (mode: PodsDisplayMode) => void;
  setNewsSourceImageExpanded: (expanded: boolean) => void;
  setProgress: (progress: number) => void;
  setPodsPlayback: (id: string, timeSec: number, progress: number) => void;
  setLastActivePodsItemId: (id: string | null) => void;
  toggleBookmark: (id: string) => void;
  toggleLike: (id: string) => void;
  /** Apply authoritative flags for the content ids present in a response. */
  seedInteractions: (likedIds: string[], bookmarkedIds: string[], contentIds: string[]) => void;
  /** Drop account/session-specific state at an auth boundary. */
  resetInteractionState: () => void;
  identityGeneration: number;
  interactionAttempts: Record<string, number>;
  nextInteractionAttempt: number;
  beginInteractionAttempt: (kind: InteractionKind, id: string) => number;
  isCurrentInteractionAttempt: (kind: InteractionKind, id: string, attempt: number, generation: number) => boolean;
  finishInteractionAttempt: (kind: InteractionKind, id: string, attempt: number, generation: number) => void;
  resetProgress: () => void;
  setFastSwiping: (fast: boolean) => void;
}

const interactionAttemptKey = (kind: InteractionKind, id: string) => `${kind}:${id}`;

export const useFeedStore = create<FeedState>()(
  persist(
    (set, get) => ({
      // Initial state
      podsActiveIndex: 0,
      newsActiveIndex: 0,
      isPlaying: true,
      globalPaused: false,
      playbackSpeed: 1.0,
      podsDisplayMode: 'fit',
      newsSourceImageExpanded: false,
      progress: 0,
      podsPlaybackById: {},
      lastActivePodsItemId: null,
      isFastSwiping: false,
      bookmarkedIds: new Set<string>(),
      likedIds: new Set<string>(),
      identityGeneration: 0,
      interactionAttempts: {},
      nextInteractionAttempt: 1,

      // Actions
      setPodsActiveIndex: (index) => set({ podsActiveIndex: index }),

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

      setPodsDisplayMode: (mode) => set({ podsDisplayMode: mode }),

      setNewsSourceImageExpanded: (expanded) => set({ newsSourceImageExpanded: expanded }),

      setProgress: (progress) => set({ progress }),

      setPodsPlayback: (id, timeSec, progress) =>
        set((state) => ({
          podsPlaybackById: writeRecentPlayback(state.podsPlaybackById, id, timeSec, progress),
        })),

      setLastActivePodsItemId: (id) => set({ lastActivePodsItemId: id }),

      setFastSwiping: (fast) => set({ isFastSwiping: fast }),

      toggleBookmark: (id) => set((state) => {
        const newSet = new Set(state.bookmarkedIds);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return { bookmarkedIds: newSet };
      }),

      seedInteractions: (liked, bookmarked, contentIds) => set((state) => {
        const responseIds = new Set(contentIds);
        const hasPendingLike = (id: string) => Boolean(state.interactionAttempts[interactionAttemptKey('like', id)]);
        const hasPendingBookmark = (id: string) => Boolean(state.interactionAttempts[interactionAttemptKey('bookmark', id)]);
        const nextLiked = new Set([...state.likedIds].filter((id) => !responseIds.has(id) || hasPendingLike(id)));
        const nextBookmarked = new Set([...state.bookmarkedIds].filter((id) => !responseIds.has(id) || hasPendingBookmark(id)));
        liked.filter((id) => !hasPendingLike(id)).forEach((id) => nextLiked.add(id));
        bookmarked.filter((id) => !hasPendingBookmark(id)).forEach((id) => nextBookmarked.add(id));
        return {
          likedIds: nextLiked,
          bookmarkedIds: nextBookmarked,
        };
      }),

      resetInteractionState: () => set((state) => ({
        likedIds: new Set<string>(),
        bookmarkedIds: new Set<string>(),
        podsPlaybackById: {},
        lastActivePodsItemId: null,
        podsActiveIndex: 0,
        newsActiveIndex: 0,
        progress: 0,
        identityGeneration: state.identityGeneration + 1,
        interactionAttempts: {},
      })),

      beginInteractionAttempt: (kind, id) => {
        let attempt = 0;
        set((state) => {
          attempt = state.nextInteractionAttempt;
          return {
            interactionAttempts: {
              ...state.interactionAttempts,
              [interactionAttemptKey(kind, id)]: attempt,
            },
            nextInteractionAttempt: attempt + 1,
          };
        });
        return attempt;
      },

      isCurrentInteractionAttempt: (kind, id, attempt, generation) => {
        const state = get();
        return state.identityGeneration === generation &&
          state.interactionAttempts[interactionAttemptKey(kind, id)] === attempt;
      },

      finishInteractionAttempt: (kind, id, attempt, generation) => set((state) => {
        const key = interactionAttemptKey(kind, id);
        if (state.identityGeneration !== generation || state.interactionAttempts[key] !== attempt) return {};
        const interactionAttempts = { ...state.interactionAttempts };
        delete interactionAttempts[key];
        return { interactionAttempts };
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
      version: 2,
      migrate: (persistedState) => migrateFeedPersistedState(persistedState) as unknown as FeedState,
      partialize: (state) => ({
        playbackSpeed: state.playbackSpeed,
        podsDisplayMode: state.podsDisplayMode,
        newsSourceImageExpanded: state.newsSourceImageExpanded,
        podsPlaybackById: state.podsPlaybackById,
        lastActivePodsItemId: state.lastActivePodsItemId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Interaction flags used to be persisted globally. Ignore any legacy
          // values so they cannot cross an account or anonymous-session boundary.
          state.bookmarkedIds = new Set<string>();
          state.likedIds = new Set<string>();
          state.podsPlaybackById = pruneRecentPlayback(state.podsPlaybackById);
        }
      },
    }
  )
);
