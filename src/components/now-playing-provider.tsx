'use client';

import { useRef, useEffect } from 'react';
import { useNowPlayingStore, audioPlaybackTime } from '@/lib/stores/now-playing-store';
import { useFeedStore } from '@/lib/stores/feed-store';

/** Write the audio position into the feed store so For You can resume from it. */
function persistAudioPosition(audio: HTMLAudioElement, itemId: string) {
    const duration = audio.duration;
    const percent =
        Number.isFinite(duration) && duration > 0
            ? (audio.currentTime / duration) * 100
            : 0;
    useFeedStore.getState().setForYouPlayback(itemId, audio.currentTime, percent);
}

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
    const lastPersistRef = useRef(0);
    const { audioSrc, isPlaying, videoActive, seekTo, stop, clearSeek } =
        useNowPlayingStore();

    // Sync audio source (always keep it loaded so handoff is instant).
    // Compare the attribute, not `audio.src` — the property returns the
    // browser-resolved absolute URL, which never matches a relative
    // media_url and would reload (restart) the audio on every run.
    useEffect(() => {
        if (!audioRef.current) return;

        if (audioSrc && audioRef.current.getAttribute('src') !== audioSrc) {
            audioRef.current.src = audioSrc;
            audioRef.current.load();
        }
    }, [audioSrc]);

    // Flush the position on pagehide — unmount cleanups don't run on a hard
    // refresh or tab close, so without this the last few seconds are lost.
    useEffect(() => {
        const flush = () => {
            const audio = audioRef.current;
            const { currentItem, videoActive: videoOwns } =
                useNowPlayingStore.getState();
            if (!audio || !currentItem || videoOwns || audio.currentTime <= 0) return;
            persistAudioPosition(audio, currentItem.id);
        };
        window.addEventListener('pagehide', flush);
        return () => window.removeEventListener('pagehide', flush);
    }, []);

    // Drive play / pause, and apply the handoff resume position.
    //
    // The previous implementation set `currentTime = seekTo` in a separate
    // effect that could run before the element had loaded metadata. Setting
    // currentTime on an element whose readyState is still HAVE_NOTHING is a
    // no-op, so playback would start from 0 — the audio "restarted" on every
    // navigation. Here we seek *and then* play together, and if the element is
    // not yet seekable we wait for `loadedmetadata` first so the position
    // always sticks.
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioSrc) return;

        // While the For You <video> owns playback, or we're paused, stay paused.
        if (videoActive || !isPlaying) {
            audio.pause();
            return;
        }

        let cancelled = false;

        const seekThenPlay = () => {
            if (cancelled) return;

            if (seekTo !== null) {
                const duration = audio.duration;
                const target =
                    Number.isFinite(duration) && duration > 0
                        ? Math.min(seekTo, duration - 0.05)
                        : seekTo;
                // Avoid a redundant re-seek (and the re-buffer it causes) when
                // we're already essentially at the target.
                if (Math.abs(audio.currentTime - target) > 0.25) {
                    audio.currentTime = target;
                }
                clearSeek();
            }

            audio.play().catch(() => {
                // Autoplay blocked — user must interact first.
                useNowPlayingStore.getState().pause();
            });
        };

        // readyState < HAVE_METADATA (1): duration unknown, a seek won't stick.
        if (seekTo !== null && audio.readyState < 1) {
            const onReady = () => {
                audio.removeEventListener('loadedmetadata', onReady);
                seekThenPlay();
            };
            audio.addEventListener('loadedmetadata', onReady);
            return () => {
                cancelled = true;
                audio.removeEventListener('loadedmetadata', onReady);
            };
        }

        seekThenPlay();
    }, [isPlaying, audioSrc, videoActive, seekTo, clearSeek]);

    // When track ends, clear the store
    const handleEnded = () => {
        stop();
    };

    // Track the exact position while the <audio> owns playback so For You can
    // resume from it (audioPlaybackTime is read once by the card on return),
    // and persist a resume point at most every 5s — same cadence as the
    // <video> — so a reload mid-listen doesn't lose much.
    const handleTimeUpdate = () => {
        const audio = audioRef.current;
        const { currentItem, videoActive: videoOwns } = useNowPlayingStore.getState();
        if (!audio || !currentItem || videoOwns) return;

        audioPlaybackTime.itemId = currentItem.id;
        audioPlaybackTime.time = audio.currentTime;

        const now = Date.now();
        if (now - lastPersistRef.current >= 5000) {
            lastPersistRef.current = now;
            persistAudioPosition(audio, currentItem.id);
        }
    };

    return (
        <audio
            ref={audioRef}
            onEnded={handleEnded}
            onTimeUpdate={handleTimeUpdate}
            preload="auto"
            className="hidden"
        />
    );
}
