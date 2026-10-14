'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { usePlaybackTelemetry } from '@/lib/experience/use-playback-telemetry';
import { beginHandoff } from '@/lib/experience/journeys';
import { useNowPlayingStore, audioPlaybackTime } from '@/lib/stores/now-playing-store';
import { useFeedStore } from '@/lib/stores/feed-store';

/** Write the audio position into the feed store so Pods can resume from it. */
function persistAudioPosition(audio: HTMLAudioElement, itemId: string) {
    const duration = audio.duration;
    const percent =
        Number.isFinite(duration) && duration > 0
            ? (audio.currentTime / duration) * 100
            : 0;
    useFeedStore.getState().setPodsPlayback(itemId, audio.currentTime, percent);
}

/**
 * Renders a hidden <audio> element that is controlled by the global
 * now-playing store. This ensures audio continues playing even when
 * navigating between pages.
 *
 * When Pods owns playback (visual or audio-only), this provider keeps the
 * global <audio> source loaded but paused
 * to avoid double audio. On handoff (user leaves Pods), it seeks
 * to the position reported by the <video> and resumes playback.
 */
export function NowPlayingProvider() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const lastPersistRef = useRef(0);
    const { audioSrc, isPlaying, playbackOwner, seekTo, pendingSeek, stop, clearSeek, clearPendingSeek } =
        useNowPlayingStore();

    const [telemetryAudio, setTelemetryAudio] = useState<HTMLAudioElement | null>(null);
    const telemetryContentID = useNowPlayingStore(s => s.currentItem?.id);
    const setAudio = useCallback((node: HTMLAudioElement | null) => { audioRef.current = node; setTelemetryAudio(node); }, []);
    const { notifyAttempt, notifyPlayReject } = usePlaybackTelemetry({ mediaElement: telemetryAudio,
        contentId: telemetryContentID, playbackType: useNowPlayingStore(s => s.currentItem?.playback_type),
        active: playbackOwner === 'global', surface: 'pods' });
    const handoffRef = useRef<ReturnType<typeof beginHandoff> | null>(null);
    const previousOwnerRef = useRef(playbackOwner);
    // Handoff owns its lifetime independently of isPlaying effect cleanup.
    useEffect(() => {
        const previous = previousOwnerRef.current;
        previousOwnerRef.current = playbackOwner;
        if (previous === 'pods' && playbackOwner === 'global' && isPlaying) {
            const state = useNowPlayingStore.getState();
            handoffRef.current = beginHandoff('pods', state.currentItem?.id, state.seekTo ?? audioPlaybackTime.time ?? 0);
        } else if (playbackOwner === 'pods' || !isPlaying) { handoffRef.current?.cancel(); handoffRef.current = null; }
    }, [playbackOwner, isPlaying]);
    useEffect(() => () => { handoffRef.current?.cancel(); handoffRef.current = null; }, [telemetryContentID]);
    useEffect(() => {
        const audio = telemetryAudio;
        if (!audio) return;
        let baseline = audio.currentTime;
        const seeked = () => { baseline = audio.currentTime; };
        const progress = () => { if (!audio.paused && !audio.seeking && audio.currentTime - baseline >= 0.05) handoffRef.current?.completed(audio.currentTime); };
        const failed = () => handoffRef.current?.failed();
        audio.addEventListener('timeupdate', progress); audio.addEventListener('seeked', seeked); audio.addEventListener('error', failed);
        return () => { audio.removeEventListener('timeupdate', progress); audio.removeEventListener('seeked', seeked); audio.removeEventListener('error', failed); };
    }, [telemetryAudio]);

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
            if (!audio || !currentItem || playbackOwner === 'pods' || audio.currentTime <= 0) return;
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

        // While the Pods <video> owns playback, or we're paused, stay paused.
        if (playbackOwner === 'pods' || !isPlaying) {
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

            notifyAttempt(navigator.userActivation?.isActive === true);
            audio.play().catch((error) => {
                if (cancelled || error?.name === 'AbortError') return;
                notifyPlayReject(error);
                handoffRef.current?.failed();
                // Autoplay blocked — user must interact first.
                useNowPlayingStore.getState().pause();
            });
        };

        // Metadata can precede a usable seek range (notably WAV in Chromium).
        // Keep the handoff target until data is playable, then seek and play.
        if (seekTo !== null && audio.readyState < 3) {
            const onReady = () => {
                audio.removeEventListener('canplay', onReady);
                seekThenPlay();
            };
            audio.addEventListener('canplay', onReady);
            return () => {
                cancelled = true;
                audio.removeEventListener('canplay', onReady);
            };
        }

        seekThenPlay();
        return () => { cancelled = true; };
    }, [isPlaying, audioSrc, playbackOwner, seekTo, clearSeek, notifyAttempt, notifyPlayReject]);

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

    // Track the exact position while the <audio> owns playback so Pods can
    // resume from it (audioPlaybackTime is read once by the card on return),
    // and persist a resume point at most every 5s — same cadence as the
    // <video> — so a reload mid-listen doesn't lose much.
    const handleTimeUpdate = () => {
        const audio = audioRef.current;
        const { currentItem, playbackOwner } = useNowPlayingStore.getState();
        if (!audio || !currentItem || playbackOwner === 'pods') return;

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
            ref={setAudio}
            onEnded={handleEnded}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            preload="auto"
            className="hidden"
        />
    );
}
