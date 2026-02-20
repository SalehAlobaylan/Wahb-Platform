import { create } from 'zustand';
import type { ContentItem } from '@/types';

interface NowPlayingState {
    /** Currently playing content item */
    currentItem: ContentItem | null;
    /** Whether audio is currently playing */
    isPlaying: boolean;
    /** Media source URL */
    audioSrc: string | null;
    /** Whether a bottom sheet is currently mounted (to avoid duplicate bars) */
    bottomSheetMounted: boolean;

    // Actions
    play: (item: ContentItem) => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    togglePlayPause: () => void;
    setBottomSheetMounted: (mounted: boolean) => void;
}

/**
 * Global store for "Now Playing" audio that persists across page navigations.
 * Separate from feed-store because it must survive route changes.
 */
export const useNowPlayingStore = create<NowPlayingState>()((set, get) => ({
    currentItem: null,
    isPlaying: false,
    audioSrc: null,
    bottomSheetMounted: false,

    play: (item) =>
        set({
            currentItem: item,
            isPlaying: true,
            audioSrc: item.media_url || null,
        }),

    pause: () => set({ isPlaying: false }),

    resume: () => set({ isPlaying: true }),

    stop: () =>
        set({
            currentItem: null,
            isPlaying: false,
            audioSrc: null,
        }),

    togglePlayPause: () => {
        const { isPlaying, currentItem } = get();
        if (!currentItem) return;
        set({ isPlaying: !isPlaying });
    },

    setBottomSheetMounted: (mounted) => set({ bottomSheetMounted: mounted }),
}));
