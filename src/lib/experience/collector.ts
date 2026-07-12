// RUX collector — bounded, non-blocking browser telemetry delivery.
//
// Guarantees (plan §12): never blocks rendering/playback/navigation; bounded
// in-memory queue; batches of ≤20 or every 5s; sendBeacon on pagehide; one
// bounded retry; drops oldest non-critical success events under pressure; goes
// permanently quiet for the session if the server reports disabled (server-off
// backoff). Delivery failure is swallowed — telemetry must never surface to UX.

import { getClientContext, getRelease } from './context';
import {
  RUX_SCHEMA_VERSION,
  type RuxEvent,
  type RuxEventType,
  type RuxMeasurements,
  type RuxSurface,
} from './types';

const INGEST_URL = '/api/experience/events';
const MAX_BATCH = 20;
const FLUSH_INTERVAL_MS = 5000;
const MAX_QUEUE = 200;

// Terminal failure/critical events flush immediately; success events can wait.
const CRITICAL_EVENTS: ReadonlySet<RuxEventType> = new Set<RuxEventType>([
  'feed_failed',
  'playback_failed',
  'handoff_failed',
  'pagination_starved',
  'client_failure',
]);

interface CollectorState {
  pageLoadId: string;
  sequence: number;
  queue: RuxEvent[];
  timer: ReturnType<typeof setTimeout> | null;
  disabled: boolean; // server-off backoff or SSR
  started: boolean;
}

// Module-level singleton — one collector per page load.
const state: CollectorState = {
  pageLoadId: '',
  sequence: 0,
  queue: [],
  timer: null,
  disabled: typeof window === 'undefined',
  started: false,
};

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem('wahb_session_id');
    if (existing) return existing;
    const id = newId();
    sessionStorage.setItem('wahb_session_id', id);
    return id;
  } catch {
    return 'nosession';
  }
}

function getLocale(): string {
  try {
    return (document.documentElement.lang || 'ar').slice(0, 16);
  } catch {
    return 'ar';
  }
}

export function initCollector(): void {
  if (state.started || typeof window === 'undefined') return;
  state.started = true;
  state.disabled = false;
  state.pageLoadId = newId();

  // Flush what we have before the tab is frozen/closed.
  const flushOnHide = () => {
    if (document.visibilityState === 'hidden') flush(true);
  };
  document.addEventListener('visibilitychange', flushOnHide);
  window.addEventListener('pagehide', () => flush(true));
}

export interface EmitInput {
  event_type: RuxEventType;
  surface: RuxSurface;
  journey_id?: string | null;
  content_id?: string | null;
  story_id?: string | null;
  playback_type?: RuxEvent['playback_type'];
  measurements?: RuxMeasurements | null;
}

// Fire-and-forget. Safe to call from anywhere; never throws.
export function emitEvent(input: EmitInput): void {
  if (state.disabled) return;
  if (!state.started) initCollector();
  try {
    const event: RuxEvent = {
      event_id: newId(),
      schema_version: RUX_SCHEMA_VERSION,
      event_type: input.event_type,
      occurred_at: new Date().toISOString(),
      session_id: getSessionId(),
      page_load_id: state.pageLoadId,
      sequence: state.sequence++,
      release: getRelease(),
      surface: input.surface,
      journey_id: input.journey_id ?? null,
      content_id: input.content_id ?? null,
      story_id: input.story_id ?? null,
      playback_type: input.playback_type ?? null,
      locale: getLocale(),
      client: getClientContext(),
      measurements: input.measurements ?? null,
    };
    enqueue(event);
  } catch {
    // Never let instrumentation break the app.
  }
}

function enqueue(event: RuxEvent): void {
  if (state.queue.length >= MAX_QUEUE) {
    // Drop the oldest NON-critical event to make room; keep failures.
    const idx = state.queue.findIndex((e) => !CRITICAL_EVENTS.has(e.event_type));
    if (idx >= 0) state.queue.splice(idx, 1);
    else state.queue.shift(); // all critical: drop oldest to stay bounded
  }
  state.queue.push(event);

  if (CRITICAL_EVENTS.has(event.event_type) || state.queue.length >= MAX_BATCH) {
    flush(false);
    return;
  }
  if (!state.timer) {
    state.timer = setTimeout(() => flush(false), FLUSH_INTERVAL_MS);
  }
}

function clearTimer(): void {
  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
}

// useBeacon=true is for pagehide/hidden — sendBeacon survives unload.
export function flush(useBeacon: boolean): void {
  if (state.disabled || state.queue.length === 0) {
    clearTimer();
    return;
  }
  clearTimer();

  const events = state.queue.splice(0, MAX_BATCH);
  const payload = JSON.stringify({ schema_version: RUX_SCHEMA_VERSION, events });

  if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    try {
      // text/plain avoids a CORS preflight and needs no custom headers — the BFF
      // reads the raw body. Auth/token are attached server-side in the BFF.
      const blob = new Blob([payload], { type: 'text/plain' });
      navigator.sendBeacon(INGEST_URL, blob);
    } catch {
      /* swallow */
    }
    return;
  }

  void deliver(payload, events, false);
}

async function deliver(payload: string, events: RuxEvent[], isRetry: boolean): Promise<void> {
  try {
    const res = await fetch(INGEST_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
      keepalive: true,
      cache: 'no-store',
    });
    if (res.ok) {
      const data = (await res.json().catch(() => null)) as { disabled?: boolean } | null;
      if (data?.disabled) {
        // Server-off backoff: go quiet for the rest of the session.
        state.disabled = true;
        state.queue.length = 0;
      }
      return;
    }
    // 4xx (bad batch / rate limited) → do not retry-storm.
    if (res.status >= 400 && res.status < 500) {
      if (res.status === 429) state.disabled = true; // back off hard on rate limit
      return;
    }
    // 5xx → one bounded retry with jitter.
    if (!isRetry) scheduleRetry(payload, events);
  } catch {
    if (!isRetry) scheduleRetry(payload, events);
  }
}

function scheduleRetry(payload: string, events: RuxEvent[]): void {
  const jitter = 500 + Math.floor(Math.random() * 1500);
  setTimeout(() => void deliver(payload, events, true), jitter);
}

// Test/reset helper — clears singleton state between specs.
export function __resetCollectorForTest(): void {
  clearTimer();
  state.pageLoadId = '';
  state.sequence = 0;
  state.queue = [];
  state.disabled = false;
  state.started = false;
}

export function __getCollectorStateForTest() {
  return { queueLength: state.queue.length, sequence: state.sequence, disabled: state.disabled, pageLoadId: state.pageLoadId };
}
