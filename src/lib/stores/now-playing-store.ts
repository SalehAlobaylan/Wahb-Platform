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
    /**
     * When true, a page-level <video> element is handling playback directly.
     * The NowPlayingProvider's <audio> must NOT play to avoid double audio.
     */
    videoActive: boolean;
    /** Playback position (seconds) to resume from when handing off to <audio> */
    seekTo: number | null;

    // Actions
    play: (item: ContentItem) => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    togglePlayPause: () => void;
    setBottomSheetMounted: (mounted: boolean) => void;
    /** Called by ForYou page to register the current item without triggering <audio> */
    setCurrentFromVideo: (item: ContentItem) => void;
    /** Called by ForYou page on unmount to hand off playback to <audio> */
    handoffToAudio: (currentTime: number) => void;
    /** Called by NowPlayingProvider after it has seeked to the handoff position */
    clearSeek: () => void;
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
    videoActive: false,
    seekTo: null,

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
            videoActive: false,
            seekTo: null,
        }),

    togglePlayPause: () => {
        const { isPlaying, currentItem } = get();
        if (!currentItem) return;
        set({ isPlaying: !isPlaying });
    },

    setBottomSheetMounted: (mounted) => set({ bottomSheetMounted: mounted }),

    setCurrentFromVideo: (item) =>
        set({
            currentItem: item,
            audioSrc: item.media_url || null,
            isPlaying: true,
            videoActive: true,
        }),

    handoffToAudio: (currentTime) =>
        set({
            videoActive: false,
            seekTo: currentTime,
            isPlaying: true,
        }),

    clearSeek: () => set({ seekTo: null }),
}));
