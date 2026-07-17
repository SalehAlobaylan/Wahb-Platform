'use client';

import { useRef, useEffect } from 'react';
import { beginHandoff } from '@/lib/experience/journeys';
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
 * When For You owns playback (visual or audio-only), this provider keeps the
 * global <audio> source loaded but paused
 * to avoid double audio. On handoff (user leaves For You), it seeks
 * to the position reported by the <video> and resumes playback.
 */
export function NowPlayingProvider() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const lastPersistRef = useRef(0);
    const { audioSrc, isPlaying, playbackOwner, seekTo, pendingSeek, stop, clearSeek, clearPendingSeek } =
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
            const { currentItem, playbackOwner } =
                useNowPlayingStore.getState();
            if (!audio || !currentItem || playbackOwner === 'foryou' || audio.currentTime <= 0) return;
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
        if (playbackOwner === 'foryou' || !isPlaying) {
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
    }, [isPlaying, audioSrc, playbackOwner, seekTo, clearSeek]);

    // RUX handoff telemetry: when For You <video> ownership ends while a track
    // is playing, the global <audio> must resume near the same position. We open
    // a handoff journey on the For You→global owner transition and settle it on
    // the next audio progress (completed) or a deadline (failed).
    const previousOwnerRef = useRef(playbackOwner);
    const handoffRef = useRef<ReturnType<typeof beginHandoff> | null>(null);
    useEffect(() => {
        const previousOwner = previousOwnerRef.current;
        previousOwnerRef.current = playbackOwner;
        const audio = audioRef.current;
        if (!(previousOwner === 'foryou' && playbackOwner === 'global')) return;
        const { currentItem } = useNowPlayingStore.getState();
        if (!audio || !currentItem || !isPlaying) return;

        const journey = beginHandoff('foryou', currentItem.id);
        handoffRef.current = journey;
        const onResumed = () => journey.completed();
        audio.addEventListener('playing', onResumed, { once: true });
        // If the audio has not resumed within the deadline, record a failure.
        const deadline = setTimeout(() => journey.failed(), 4000);
        return () => {
            audio.removeEventListener('playing', onResumed);
            clearTimeout(deadline);
        };
    }, [playbackOwner, isPlaying]);

    // Apply a one-shot UI seek request (scrubber / skip buttons). Runs
    // regardless of play/pause state. We update the audioPlaybackTime bridge
    // immediately so the ring/scrubber reflect the new position even while
    // paused (no timeupdate fires until playback resumes).
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || pendingSeek === null) return;

        const apply = () => {
            const duration = audio.duration;
            const target =
                Number.isFinite(duration) && duration > 0
                    ? Math.min(pendingSeek, duration - 0.05)
                    : pendingSeek;
            audio.currentTime = Math.max(0, target);

            const { currentItem } = useNowPlayingStore.getState();
            if (currentItem) {
                audioPlaybackTime.itemId = currentItem.id;
                audioPlaybackTime.time = audio.currentTime;
            }
            clearPendingSeek();
        };

        if (audio.readyState < 1) {
            const onReady = () => {
                audio.removeEventListener('loadedmetadata', onReady);
                apply();
            };
            audio.addEventListener('loadedmetadata', onReady);
            return () => audio.removeEventListener('loadedmetadata', onReady);
        }

        apply();
    }, [pendingSeek, clearPendingSeek]);

    // When track ends, clear the store
    const handleEnded = () => {
        stop();
    };

    // Keep the bridge duration fresh as soon as metadata is known, so the ring
    // can render before the first timeupdate.
    const handleLoadedMetadata = () => {
        const audio = audioRef.current;
        if (audio && Number.isFinite(audio.duration)) {
            audioPlaybackTime.duration = audio.duration;
        }
    };

    // Track the exact position while the <audio> owns playback so For You can
    // resume from it (audioPlaybackTime is read once by the card on return),
    // and persist a resume point at most every 5s — same cadence as the
    // <video> — so a reload mid-listen doesn't lose much.
    const handleTimeUpdate = () => {
        const audio = audioRef.current;
        const { currentItem, playbackOwner } = useNowPlayingStore.getState();
        if (!audio || !currentItem || playbackOwner === 'foryou') return;

        audioPlaybackTime.itemId = currentItem.id;
        audioPlaybackTime.time = audio.currentTime;
        if (Number.isFinite(audio.duration)) {
            audioPlaybackTime.duration = audio.duration;
        }

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
            onLoadedMetadata={handleLoadedMetadata}
            preload="auto"
            className="hidden"
        />
    );
}
