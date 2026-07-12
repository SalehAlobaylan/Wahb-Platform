// RUX journey helpers — translate product moments into bounded terminal-outcome
// events. Latency is always a client-measured monotonic duration
// (performance.now delta) carried on the terminal event; the server never
// subtracts wall-clock timestamps (plan §7/§8).

import { emitEvent } from './collector';
import type { RuxFailureClass, RuxPlaybackType, RuxSurface } from './types';

export function nowMs(): number {
  try {
    return performance.now();
  } catch {
    return Date.now();
  }
}

export function isHidden(): boolean {
  try {
    return document.visibilityState === 'hidden';
  } catch {
    return false;
  }
}

export function newJourneyId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function durationSince(start: number): number {
  return Math.max(0, Math.round(nowMs() - start));
}

// ── Feed load journey (For You + News) ───────────────────────────────────────
// feed_requested (diagnostic) → one terminal: feed_rendered | feed_failed |
// feed_empty. Only the terminal event counts toward SLIs.

export interface FeedLoadJourney {
  rendered(): void;
  empty(): void;
  failed(failureClass?: RuxFailureClass): void;
}

export function beginFeedLoad(surface: RuxSurface): FeedLoadJourney {
  const id = newJourneyId();
  const start = nowMs();
  let settled = false;
  emitEvent({ event_type: 'feed_requested', surface, journey_id: id });

  const settle = (fn: () => void) => {
    if (settled) return;
    settled = true;
    fn();
  };

  return {
    rendered() {
      settle(() =>
        emitEvent({
          event_type: 'feed_rendered',
          surface,
          journey_id: id,
          measurements: { duration_ms: durationSince(start), visible: !isHidden() },
        })
      );
    },
    empty() {
      settle(() =>
        emitEvent({
          event_type: 'feed_empty',
          surface,
          journey_id: id,
          measurements: { duration_ms: durationSince(start) },
        })
      );
    },
    failed(failureClass: RuxFailureClass = 'unknown') {
      settle(() =>
        emitEvent({
          event_type: 'feed_failed',
          surface,
          journey_id: id,
          measurements: { duration_ms: durationSince(start), failure_class: failureClass },
        })
      );
    },
  };
}

// ── Pagination journey ───────────────────────────────────────────────────────
// pagination_requested (diagnostic) → terminal: pagination_received |
// pagination_starved (user hit the boundary before a usable next unit arrived).

export interface PaginationJourney {
  received(): void;
  starved(): void;
}

export function beginPagination(surface: RuxSurface): PaginationJourney {
  const id = newJourneyId();
  const start = nowMs();
  let settled = false;
  emitEvent({ event_type: 'pagination_requested', surface, journey_id: id });

  const settle = (type: 'pagination_received' | 'pagination_starved') => {
    if (settled) return;
    settled = true;
    emitEvent({
      event_type: type,
      surface,
      journey_id: id,
      measurements: { duration_ms: durationSince(start) },
    });
  };

  return {
    received: () => settle('pagination_received'),
    starved: () => settle('pagination_starved'),
  };
}

// ── Playback journey (For You card + global audio) ───────────────────────────
// playback_attempted (diagnostic) → exactly one startup terminal:
//   playback_started         — first progress after the attempt (success)
//   playback_failed          — media error OR play() promise rejection
//   playback_backgrounded    — tab went hidden mid-startup (ineligible; excluded
//                              from numerator AND denominator, plan §12)
// autoplay_blocked is a failure_class, NOT a fatal failure — the rollup layer
// tracks it separately and excludes it from the fatal-failure SLI (plan §8).
// Stalls (playback_waiting / playback_resumed) are post-start diagnostic signals.

export interface PlaybackJourneyOpts {
  surface: RuxSurface;
  contentId?: string | null;
  playbackType?: RuxPlaybackType | null;
}

export interface PlaybackJourney {
  onProgress(): void;
  onWaiting(): void;
  onMediaError(code: number | null): void;
  onPlayReject(err: unknown): void;
  onHidden(): void;
}

export function beginPlayback(opts: PlaybackJourneyOpts): PlaybackJourney {
  const { surface, contentId, playbackType } = opts;
  const id = newJourneyId();
  const attemptAt = nowMs();
  const hiddenAtStart = isHidden();
  let startupSettled = false; // the attempt→started/failed terminal fired
  let startedAt = 0;
  let waitingAt = 0;

  const base = {
    surface,
    journey_id: id,
    content_id: contentId ?? null,
    playback_type: playbackType ?? null,
  } as const;

  emitEvent({ event_type: 'playback_attempted', ...base });

  const failStartup = (failureClass: RuxFailureClass, mediaErrorCode?: number | null) => {
    if (startupSettled) return;
    startupSettled = true;
    emitEvent({
      event_type: 'playback_failed',
      ...base,
      measurements: {
        duration_ms: Math.max(0, Math.round(nowMs() - attemptAt)),
        failure_class: failureClass,
        media_error_code: mediaErrorCode ?? null,
      },
    });
  };

  const background = () => {
    if (startupSettled) return;
    startupSettled = true;
    emitEvent({ event_type: 'playback_backgrounded', ...base, measurements: { visible: false } });
  };

  return {
    onProgress() {
      if (startupSettled) {
        // Post-start resume after a stall.
        if (waitingAt > 0) {
          waitingAt = 0;
          emitEvent({ event_type: 'playback_resumed', ...base });
        }
        return;
      }
      if (startedAt !== 0) return;
      startedAt = nowMs();
      // If the tab was hidden during startup, this journey is measurement-
      // ineligible — close it as backgrounded, not as a success.
      if (hiddenAtStart || isHidden()) {
        background();
        return;
      }
      startupSettled = true;
      emitEvent({
        event_type: 'playback_started',
        ...base,
        measurements: { duration_ms: Math.max(0, Math.round(startedAt - attemptAt)), visible: true },
      });
    },
    onWaiting() {
      if (startedAt > 0 && startupSettled) {
        waitingAt = nowMs();
        emitEvent({ event_type: 'playback_waiting', ...base });
      }
    },
    onMediaError(code: number | null) {
      // Only the startup terminal is tracked in V1; a mid-playback error after a
      // successful start is not re-counted as a startup failure.
      failStartup('media_error', code);
    },
    onPlayReject(err: unknown) {
      const name = (err as { name?: string } | null)?.name;
      failStartup(name === 'NotAllowedError' ? 'autoplay_blocked' : 'media_error');
    },
    onHidden() {
      background();
    },
  };
}

// ── Playback fallback + handoff (thin emitters) ──────────────────────────────

export function reportPlaybackFallback(opts: PlaybackJourneyOpts): void {
  emitEvent({
    event_type: 'playback_fallback',
    surface: opts.surface,
    content_id: opts.contentId ?? null,
    playback_type: opts.playbackType ?? null,
  });
}

export interface HandoffJourney {
  completed(): void;
  failed(): void;
}

export function beginHandoff(surface: RuxSurface, contentId?: string | null): HandoffJourney {
  const id = newJourneyId();
  const start = nowMs();
  let settled = false;
  emitEvent({ event_type: 'handoff_started', surface, journey_id: id, content_id: contentId ?? null });
  const settle = (type: 'handoff_completed' | 'handoff_failed') => {
    if (settled) return;
    settled = true;
    emitEvent({
      event_type: type,
      surface,
      journey_id: id,
      content_id: contentId ?? null,
      measurements: { duration_ms: durationSince(start) },
    });
  };
  return { completed: () => settle('handoff_completed'), failed: () => settle('handoff_failed') };
}

// ── Article reader journey (News) ────────────────────────────────────────────

export interface ArticleJourney {
  ready(): void;
  failed(failureClass?: RuxFailureClass): void;
}

// article_opened is diagnostic. Exactly one terminal (ready or failed) owns the
// article-readiness denominator, so an open/ready pair is never double-counted.
export function beginArticle(storyId?: string | null, contentId?: string | null): ArticleJourney {
  const id = newJourneyId();
  const start = nowMs();
  let settled = false;
  emitEvent({ event_type: 'article_opened', surface: 'news', journey_id: id, story_id: storyId ?? null, content_id: contentId ?? null });
  return {
    ready() {
      if (settled) return;
      settled = true;
      emitEvent({ event_type: 'article_ready', surface: 'news', journey_id: id, story_id: storyId ?? null, content_id: contentId ?? null, measurements: { duration_ms: durationSince(start) } });
    },
    failed(failureClass: RuxFailureClass = 'unknown') {
      if (settled) return;
      settled = true;
      emitEvent({ event_type: 'article_failed', surface: 'news', journey_id: id, story_id: storyId ?? null, content_id: contentId ?? null, measurements: { duration_ms: durationSince(start), failure_class: failureClass } });
    },
  };
}

// ── Client stability ─────────────────────────────────────────────────────────
// Sanitized error-boundary / global error observation. NO message/stack text.

export function reportClientFailure(surface: RuxSurface, failureClass: RuxFailureClass = 'unknown'): void {
  emitEvent({ event_type: 'client_failure', surface, measurements: { failure_class: failureClass } });
}

// Re-exported for Slice 2 playback journeys.
export type { RuxFailureClass, RuxPlaybackType, RuxSurface };
