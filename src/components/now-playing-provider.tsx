'use client';

import { useRef, useEffect } from 'react';
import { useNowPlayingStore } from '@/lib/stores/now-playing-store';

/**
 * Renders a hidden <audio> element that is controlled by the global
 * now-playing store. This ensures audio continues playing even when
 * navigating between pages.
 *
 * When `videoActive` is true (the For You page's <video> is handling
 * playback), this provider keeps the <audio> source loaded but paused
 * to avoid double audio. On handoff (user leaves For You), it seeks
 * to the position reported by the <video> and resumes playback.
 */
export function NowPlayingProvider() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const { audioSrc, isPlaying, videoActive, seekTo, stop, clearSeek } =
        useNowPlayingStore();

    // Sync audio source (always keep it loaded so handoff is instant)
    useEffect(() => {
        if (!audioRef.current) return;

        if (audioSrc && audioRef.current.src !== audioSrc) {
            audioRef.current.src = audioSrc;
            audioRef.current.load();
        }
    }, [audioSrc]);

    // Handle seek-to on handoff from <video> → <audio>
    useEffect(() => {
        if (!audioRef.current || seekTo === null) return;

        audioRef.current.currentTime = seekTo;
        clearSeek();
    }, [seekTo, clearSeek]);

    // Sync play/pause state — but only when video is NOT active
    useEffect(() => {
        if (!audioRef.current || !audioSrc) return;

        // While the For You page's <video> is playing, keep <audio> paused
        if (videoActive) {
            audioRef.current.pause();
            return;
        }

        if (isPlaying) {
            audioRef.current.play().catch(() => {
                // Autoplay blocked — user must interact first
                useNowPlayingStore.getState().pause();
            });
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, audioSrc, videoActive]);

    // When track ends, clear the store
    const handleEnded = () => {
        stop();
    };

    return (
        <audio
            ref={audioRef}
            onEnded={handleEnded}
            preload="auto"
            className="hidden"
        />
    );
}
