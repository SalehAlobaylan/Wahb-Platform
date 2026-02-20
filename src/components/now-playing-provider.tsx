'use client';

import { useRef, useEffect } from 'react';
import { useNowPlayingStore } from '@/lib/stores/now-playing-store';

/**
 * Renders a hidden <audio> element that is controlled by the global
 * now-playing store. This ensures audio continues playing even when
 * navigating between pages.
 */
export function NowPlayingProvider() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const { audioSrc, isPlaying, stop } = useNowPlayingStore();

    // Sync audio source
    useEffect(() => {
        if (!audioRef.current) return;

        if (audioSrc && audioRef.current.src !== audioSrc) {
            audioRef.current.src = audioSrc;
            audioRef.current.load();
        }
    }, [audioSrc]);

    // Sync play/pause state
    useEffect(() => {
        if (!audioRef.current || !audioSrc) return;

        if (isPlaying) {
            audioRef.current.play().catch(() => {
                // Autoplay blocked — user must interact first
                useNowPlayingStore.getState().pause();
            });
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, audioSrc]);

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
