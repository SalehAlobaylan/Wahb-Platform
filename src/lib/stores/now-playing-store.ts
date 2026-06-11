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
    setCurrentFromVideo: (item: ContentItem, playing?: boolean) => void;
    /** Called by ForYou page on unmount to hand off playback to <audio> */
    handoffToAudio: (currentTime: number, shouldResume?: boolean) => void;
    /** Called by NowPlayingProvider after it has seeked to the handoff position */
    clearSeek: () => void;
}

/**
 * Non-reactive bridge carrying the exact position of the global <audio>
 * element. Updated on every audio timeupdate; consumed (read once, then
 * cleared) by ForYouCard when the <video> takes playback back, so progress
 * made while listening via the bar is never lost. Kept outside the store on
 * purpose — it changes ~4×/s and must not trigger re-renders.
 */
export const audioPlaybackTime: { itemId: string | null; time: number } = {
    itemId: null,
    time: 0,
};

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

    setCurrentFromVideo: (item, playing = true) =>
        set(() => ({
            currentItem: item,
            audioSrc: item.media_url || null,
            isPlaying: playing,
            videoActive: true,
        })),

    handoffToAudio: (currentTime, shouldResume = true) =>
        set({
            videoActive: false,
            seekTo: currentTime,
            isPlaying: shouldResume,
        }),

    clearSeek: () => set({ seekTo: null }),
}));
