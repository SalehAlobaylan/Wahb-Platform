// RUX collector — bounded, non-blocking browser telemetry delivery.
//
// Guarantees (plan §12): never blocks rendering/playback/navigation; bounded
// in-memory queue; batches of ≤20 or every 5s; sendBeacon on pagehide; one
// bounded retry; drops oldest non-critical success events under pressure; goes
// permanently quiet for the session if the server reports disabled (server-off
// backoff). Delivery failure is swallowed — telemetry must never surface to UX.

import { experienceId } from './id';
import { getClientContext, getRelease } from './context';
import { getAnonymousSessionId } from '@/lib/identity/session';
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

const newId = experienceId;
let inFlight = 0;
let inFlightBytes = 0;
let collectorGeneration = 0;
let volatileSessionId = experienceId();
const retryTimers = new Set<ReturnType<typeof setTimeout>>();
function getLocale(): string {
  try {
    const language = document.documentElement.lang.split('-')[0];
    return language === 'ar' || language === 'en' ? language : 'unknown';
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
  window.addEventListener('pagehide', () => queueMicrotask(() => flush(true)));
}

export interface EmitInput {
  event_type: RuxEventType;
  phase?: RuxEvent['phase'];
  outcome?: RuxEvent['outcome'];
  surface: RuxSurface;
  journey_id?: string | null;
  content_id?: string | null;
  story_id?: string | null;
  playback_type?: RuxEvent['playback_type'];
  measurements?: RuxMeasurements | null;
}

// Fire-and-forget. Safe to call from anywhere; never throws.
export function emitEvent(input: EmitInput): void {
  if (state.disabled || !getRelease()) return;
  if (!state.started) initCollector();
  try {
    const event: RuxEvent = {
      event_id: newId(),
      schema_version: RUX_SCHEMA_VERSION,
      event_type: input.event_type,
      phase: input.phase,
      outcome: input.outcome,
      occurred_at: new Date().toISOString(),
      session_id: getAnonymousSessionId() || volatileSessionId,
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

function isCritical(event: RuxEvent): boolean { return CRITICAL_EVENTS.has(event.event_type) || event.event_type === 'journey_terminal' && ['failed', 'timeout'].includes(event.outcome || ''); }
function enqueue(event: RuxEvent): void {
  if (state.queue.length >= MAX_QUEUE) {
    // Drop the oldest NON-critical event to make room; keep failures.
    const idx = state.queue.findIndex((e) => !isCritical(e));
    if (idx >= 0) state.queue.splice(idx, 1);
    else state.queue.shift(); // all critical: drop oldest to stay bounded
  }
  state.queue.push(event);

  if ((isCritical(event) || state.queue.length >= MAX_BATCH) && inFlight < 2) {
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

// Aggregate unload budget stays below the browser's shared 64 KiB keepalive cap.
export function flush(useBeacon: boolean): void {
  clearTimer();
  if (state.disabled || !state.queue.length) return;
  if (!useBeacon && inFlight >= 2) { state.timer = setTimeout(() => flush(false), FLUSH_INTERVAL_MS); return; }
  let bytes = inFlightBytes;
  do {
    const events = state.queue.slice(0, MAX_BATCH);
    const payload = JSON.stringify({ schema_version: RUX_SCHEMA_VERSION, runtime_id: process.env.NEXT_PUBLIC_WAHB_RUNTIME_ID, events });
    const size = new Blob([payload]).size;
    if (useBeacon && bytes + size > 60000) break;
    state.queue.splice(0, events.length);
    bytes += size;
    let sent = false;
    if (useBeacon && typeof navigator.sendBeacon === 'function') {
      try { sent = navigator.sendBeacon(INGEST_URL, new Blob([payload], { type: 'text/plain' })); } catch { /* delivery is best effort */ }
    }
    if (!sent && inFlight < 2) void deliver(payload, events, useBeacon);
  } while (useBeacon && state.queue.length);
  if (!useBeacon && state.queue.length && !state.timer) state.timer = setTimeout(() => flush(false), FLUSH_INTERVAL_MS);
}

async function deliver(payload: string, events: RuxEvent[], isRetry: boolean): Promise<void> {
  const size = new Blob([payload]).size;
  if (state.disabled || inFlight >= 2 || inFlightBytes + size > 60000) return;
  inFlight++;
  inFlightBytes += size;
  const generation = collectorGeneration;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(INGEST_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
      keepalive: true,
      cache: 'no-store',
      signal: controller.signal,
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
      if (res.status === 429 || res.status === 409) state.disabled = true; // back off hard on rate limit
      return;
    }
    // 5xx → one bounded retry with jitter.
    if (!isRetry) scheduleRetry(payload, events);
  } catch {
    if (!isRetry) scheduleRetry(payload, events);
  } finally { clearTimeout(timeout); if (generation === collectorGeneration) { inFlight = Math.max(0, inFlight - 1); inFlightBytes = Math.max(0, inFlightBytes - size); } }
}

function scheduleRetry(payload: string, events: RuxEvent[]): void {
  const jitter = 500 + Math.floor(Math.random() * 1500);
  if (retryTimers.size >= 2 || state.disabled) return;
  const timer = setTimeout(() => { retryTimers.delete(timer); void deliver(payload, events, true); }, jitter);
  retryTimers.add(timer);
}

// Test/reset helper — clears singleton state between specs.
export function __resetCollectorForTest(): void {
  clearTimer();
  retryTimers.forEach(clearTimeout); retryTimers.clear();
  inFlight = 0;
  inFlightBytes = 0;
  collectorGeneration++;
  volatileSessionId = experienceId();
  state.pageLoadId = '';
  state.sequence = 0;
  state.queue = [];
  state.disabled = false;
  state.started = false;
}

export function __getCollectorStateForTest() {
  return { queueLength: state.queue.length, sequence: state.sequence, disabled: state.disabled, pageLoadId: state.pageLoadId };
}
