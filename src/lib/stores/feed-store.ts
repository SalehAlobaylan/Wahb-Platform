import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FeedState {
  // Active feed state
  activeIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  progress: number;
  
  // User preferences
  bookmarkedIds: Set<string>;
  likedIds: Set<string>;
  
  // Session state
  sessionId: string;
  
  // Actions
  setActiveIndex: (index: number) => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setProgress: (progress: number) => void;
  toggleBookmark: (id: string) => void;
  toggleLike: (id: string) => void;
  resetProgress: () => void;
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
      activeIndex: 0,
      isPlaying: false,
      playbackSpeed: 1.0,
      progress: 0,
      bookmarkedIds: new Set<string>(),
      likedIds: new Set<string>(),
      sessionId: '',
      
      // Actions
      setActiveIndex: (index) => set({ activeIndex: index }),
      
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      
      setPlaying: (playing) => set({ isPlaying: playing }),
      
      setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
      
      setProgress: (progress) => set({ progress }),
      
      toggleBookmark: (id) => set((state) => {
        const newSet = new Set(state.bookmarkedIds);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return { bookmarkedIds: newSet };
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
      
      resetProgress: () => set({ progress: 0, isPlaying: true }),
    }),
    {
      name: 'wahb-feed-storage',
      partialize: (state) => ({
        bookmarkedIds: Array.from(state.bookmarkedIds),
        likedIds: Array.from(state.likedIds),
        playbackSpeed: state.playbackSpeed,
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
