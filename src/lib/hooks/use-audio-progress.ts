'use client';

import { useEffect, useRef, useState } from 'react';
import { useNowPlayingStore, audioPlaybackTime } from '@/lib/stores/now-playing-store';

export interface AudioProgress {
    /** Current playback position in seconds */
    currentTime: number;
    /** Track duration in seconds (0 when unknown) */
    duration: number;
    /** Normalized progress 0–1 (0 when duration is unknown) */
    progress: number;
}

const EMPTY: AudioProgress = { currentTime: 0, duration: 0, progress: 0 };

/**
 * Reactive view of the global audio position. Reads the non-reactive
 * `audioPlaybackTime` bridge via a requestAnimationFrame loop (the bridge is
 * updated ~4×/s by NowPlayingProvider and is deliberately kept out of the
 * store). State is only committed when the position meaningfully changes, so
 * the re-renders stay local to the component that uses this hook.
 *
 * Duration prefers the live <audio> duration carried on the bridge and falls
 * back to the item's `duration_sec` metadata so the ring can render instantly.
 */
export function useAudioProgress(): AudioProgress {
    const [progress, setProgress] = useState<AudioProgress>(EMPTY);

    // Latest committed values, diffed by the rAF loop without re-subscribing.
    const lastRef = useRef<AudioProgress>(EMPTY);

    useEffect(() => {
        let raf = 0;

        const tick = () => {
            const currentItem = useNowPlayingStore.getState().currentItem;
            const itemId = currentItem?.id ?? null;
            const matches = itemId !== null && audioPlaybackTime.itemId === itemId;

            const time = matches ? audioPlaybackTime.time : 0;
            const duration = itemId
                ? (matches && audioPlaybackTime.duration > 0
                      ? audioPlaybackTime.duration
                      : currentItem?.duration_sec ?? 0)
                : 0;
            const pct = duration > 0 ? Math.min(1, Math.max(0, time / duration)) : 0;

            const prev = lastRef.current;
            // Commit only on a visible change: ~1s of time, a duration change,
            // or ~0.5% of progress. Caps re-renders to a few per second.
            if (
                Math.abs(time - prev.currentTime) >= 1 ||
                Math.abs(duration - prev.duration) >= 1 ||
                Math.abs(pct - prev.progress) >= 0.005
            ) {
                const next = { currentTime: time, duration, progress: pct };
                lastRef.current = next;
                setProgress(next);
            }

            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    return progress;
}
