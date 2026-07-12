'use client';

import { useCallback, useEffect, useRef } from 'react';
import { beginPlayback, type PlaybackJourney } from './journeys';
import type { RuxPlaybackType, RuxSurface } from './types';

function normalizePlaybackType(raw: string | null | undefined): RuxPlaybackType {
  if (raw === 'hls' || raw === 'mp4' || raw === 'audio') return raw;
  return 'unknown';
}

interface PlaybackTelemetryInput {
  mediaElement: HTMLMediaElement | null;
  contentId?: string | null;
  playbackType?: string | null;
  surface?: RuxSurface;
}

/**
 * Derives bounded playback journey events from native media events on the
 * element behind `mediaRef`. Call notifyAttempt() immediately before .play(),
 * and notifyPlayReject(err) in the play() promise .catch(). Native `playing` /
 * `waiting` / `error` are wired here — no continuous `timeupdate` telemetry.
 */
export function usePlaybackTelemetry({ mediaElement, contentId, playbackType, surface = 'foryou' }: PlaybackTelemetryInput) {
  const journeyRef = useRef<PlaybackJourney | null>(null);
  // openRef dedups repeated attempt calls: the card has two effects that both
  // call play() on activation, but they represent ONE startup attempt. openRef
  // stays true from attempt until the startup terminal (started/failed/hidden),
  // so a later genuine pause→play opens a fresh journey but redundant effect
  // runs do not.
  const openRef = useRef(false);
  const startedRef = useRef(false);
  const metaRef = useRef({ contentId, playbackType, surface });
  useEffect(() => {
    metaRef.current = { contentId, playbackType, surface };
  }, [contentId, playbackType, surface]);

  const notifyAttempt = useCallback(() => {
    if (openRef.current) return;
    openRef.current = true;
    startedRef.current = false;
    const { contentId: cid, playbackType: pt, surface: sf } = metaRef.current;
    journeyRef.current = beginPlayback({
      surface: sf,
      contentId: cid,
      playbackType: normalizePlaybackType(pt),
    });
  }, []);

  const notifyPlayReject = useCallback((err: unknown) => {
    journeyRef.current?.onPlayReject(err);
    openRef.current = false;
  }, []);

  useEffect(() => {
    const el = mediaElement;
    if (!el) return;

    const onPlaying = () => {
      journeyRef.current?.onProgress();
      if (!startedRef.current) {
        // First progress = startup terminal reached; allow a future attempt.
        startedRef.current = true;
        openRef.current = false;
      }
    };
    const onWaiting = () => journeyRef.current?.onWaiting();
    const onError = () => {
      journeyRef.current?.onMediaError(el.error?.code ?? null);
      openRef.current = false;
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        journeyRef.current?.onHidden();
        openRef.current = false;
      }
    };

    el.addEventListener('playing', onPlaying);
    el.addEventListener('waiting', onWaiting);
    el.addEventListener('error', onError);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      el.removeEventListener('playing', onPlaying);
      el.removeEventListener('waiting', onWaiting);
      el.removeEventListener('error', onError);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [mediaElement]);

  return { notifyAttempt, notifyPlayReject };
}
