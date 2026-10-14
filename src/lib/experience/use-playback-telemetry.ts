'use client';
import { useCallback, useEffect, useRef } from 'react';
import { beginPlayback, type PlaybackJourney } from './journeys';
import type { RuxPlaybackType, RuxSurface } from './types';
export function normalizePlaybackType(raw: string | null | undefined): RuxPlaybackType { return raw === 'hls' || raw === 'mp4' || raw === 'audio' ? raw : 'unknown'; }
interface Input { mediaElement: HTMLMediaElement | null; contentId?: string | null; playbackType?: string | null; surface?: RuxSurface; active?: boolean; canFallback?: boolean }
export function usePlaybackTelemetry({ mediaElement, contentId, playbackType, surface = 'pods', active = true, canFallback = false }: Input) {
  const journeyRef = useRef<PlaybackJourney | null>(null);
  const baselineRef = useRef(0);
  const switchingRef = useRef(false);
  const seekingRef = useRef(false);
  const ownerRef = useRef<{ contentId?: string | null } | null>(null);
  const metaRef = useRef({ contentId, playbackType, surface, active, canFallback, mediaElement });
  useEffect(() => { metaRef.current = { contentId, playbackType, surface, active, canFallback, mediaElement }; }, [contentId, playbackType, surface, active, canFallback, mediaElement]);
  const notifyAttempt = useCallback((explicitIntent = false) => {
    const mediaElement = metaRef.current.mediaElement;
    if (!metaRef.current.active || journeyRef.current?.pending() || mediaElement && !mediaElement.paused && journeyRef.current) return;
    journeyRef.current?.finish();
    baselineRef.current = mediaElement?.currentTime ?? 0;
    journeyRef.current = beginPlayback({ surface: metaRef.current.surface, contentId: metaRef.current.contentId,
      playbackType: normalizePlaybackType(metaRef.current.playbackType), explicitIntent });
  }, []);
  const notifyPlayReject = useCallback((error: unknown) => journeyRef.current?.onPlayReject(error), []);
  const notifyFallback = useCallback((type: string) => {
    if (!metaRef.current.active) return;
    // A native source can fail before the element's ref has attached its
    // telemetry listeners. Preserve the already requested playback intent.
    if (!journeyRef.current) notifyAttempt();
    switchingRef.current = true;
    journeyRef.current?.fallback(normalizePlaybackType(type));
    baselineRef.current = metaRef.current.mediaElement?.currentTime ?? 0;
  }, [notifyAttempt]);
  useEffect(() => {
    const el = mediaElement;
    if (!el) return;
    const progress = () => {
      if (el.paused || el.seeking || seekingRef.current || el.currentTime - baselineRef.current < 0.05) return;
      baselineRef.current = el.currentTime;
      switchingRef.current = false;
      journeyRef.current?.onProgress();
    };
    const waiting = () => journeyRef.current?.onWaiting();
    const error = () => { if (!metaRef.current.canFallback) journeyRef.current?.onMediaError(el.error?.code ?? null); };
    const paused = () => { if (el.paused && !switchingRef.current) { journeyRef.current?.cancel(); journeyRef.current = null; } };
    const ended = () => { journeyRef.current?.finish(); journeyRef.current = null; };
    const seeking = () => { seekingRef.current = true; };
    const seeked = () => { baselineRef.current = el.currentTime; seekingRef.current = false; };
    seekingRef.current = el.seeking;
    const hidden = () => {
      if (document.visibilityState === 'hidden') { journeyRef.current?.onHidden(); journeyRef.current = null; }
      else if (metaRef.current.active && !el.paused && !el.ended) {
        // Foreground continuation resumes without inventing a fresh startup intent.
        baselineRef.current = el.currentTime;
        journeyRef.current = beginPlayback({ surface: metaRef.current.surface, contentId: metaRef.current.contentId, playbackType: normalizePlaybackType(metaRef.current.playbackType), resumeContinuation: true });
      }
    };
    el.addEventListener('timeupdate', progress);
    el.addEventListener('waiting', waiting);
    el.addEventListener('stalled', waiting);
    el.addEventListener('error', error);
    el.addEventListener('pause', paused);
    el.addEventListener('ended', ended);
    el.addEventListener('seeking', seeking);
    el.addEventListener('seeked', seeked);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      el.removeEventListener('timeupdate', progress); el.removeEventListener('waiting', waiting); el.removeEventListener('stalled', waiting);
      el.removeEventListener('error', error); el.removeEventListener('pause', paused); el.removeEventListener('ended', ended); el.removeEventListener('seeking', seeking); el.removeEventListener('seeked', seeked);
      document.removeEventListener('visibilitychange', hidden);
      // Listener attachment is independent of intent lifetime. A ref arriving
      // or a rendition replacing the element cannot cancel the user attempt.
    };
  }, [mediaElement]);
  useEffect(() => { if (!active) { journeyRef.current?.cancel(); journeyRef.current = null; } }, [active]);
  useEffect(() => {
    if (ownerRef.current && ownerRef.current.contentId !== contentId) {
      journeyRef.current?.cancel(); journeyRef.current = null;
    }
    const owner = { contentId };
    ownerRef.current = owner;
    return () => queueMicrotask(() => {
      if (ownerRef.current === owner) { journeyRef.current?.cancel(); journeyRef.current = null; }
    });
  }, [contentId]);
  return { notifyAttempt, notifyPlayReject, notifyFallback };
}
