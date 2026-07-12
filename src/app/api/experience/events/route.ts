import { createHmac } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

// Real User Experience (RUX) — dedicated same-origin BFF ingest route.
//
// This is NOT the generic v1/[...path] proxy (whose allow-list excludes an
// experience root by design). It is a purpose-built telemetry sink that:
//   1. accepts a plain-body sendBeacon batch (no custom client headers needed),
//   2. enforces same-origin + body/event caps at the edge (cheap rejection),
//   3. attaches the server-side RUX_INGEST_TOKEN (browsers never hold it),
//   4. applies a bounded per-session request budget and derives an opaque
//      session rate key — raw client IP is never trusted or persisted,
//   5. forwards to CMS, which independently re-validates and re-caps.
//
const CMS_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.CMS_BASE_URL;
const RUX_INGEST_TOKEN = process.env.RUX_INGEST_TOKEN;

const MAX_BODY_BYTES = 64 * 1024; // 64 KB — a ~50-event batch is well under this
const MAX_EVENTS = 50;
const REQUESTS_PER_MINUTE = 60;
const MAX_TRACKED_SESSIONS = 10_000;
const requestWindows = new Map<string, { count: number; resetAt: number }>();

function hasSameOrigin(request: NextRequest): boolean {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && !['same-origin', 'same-site', 'none'].includes(fetchSite)) {
    return false;
  }
  const origin = request.headers.get('origin');
  if (!origin) return fetchSite === 'same-origin' || fetchSite === 'same-site' || fetchSite === 'none';
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

// Opaque, non-reversible rate key. A browser-controlled forwarding header is
// not a trustworthy identity, so the bounded budget is session-scoped.
function deriveRateKey(sessionId: string): string {
  const secret = RUX_INGEST_TOKEN || 'rux-dev';
  return createHmac('sha256', secret)
    .update(sessionId)
    .digest('hex')
    .slice(0, 32);
}

function allowSessionRequest(sessionId: string): boolean {
  const now = Date.now();
  const existing = requestWindows.get(sessionId);
  if (existing && now < existing.resetAt) {
    if (existing.count >= REQUESTS_PER_MINUTE) return false;
    existing.count += 1;
    return true;
  }
  if (!existing && requestWindows.size >= MAX_TRACKED_SESSIONS) return false;
  requestWindows.set(sessionId, { count: 1, resetAt: now + 60_000 });
  return true;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Fail closed if unconfigured, matching the CMS side.
  if (!CMS_BASE_URL || !RUX_INGEST_TOKEN) {
    return NextResponse.json({ accepted: 0, duplicate: 0, rejected: 0, disabled: true }, { status: 200 });
  }
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
    return NextResponse.json({ message: 'Payload too large' }, { status: 413 });
  }

  let batch: { schema_version?: number; events?: unknown[] };
  try {
    batch = JSON.parse(raw);
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }
  const events = Array.isArray(batch.events) ? batch.events : [];
  if (events.length === 0) {
    return NextResponse.json({ accepted: 0, duplicate: 0, rejected: 0 }, { status: 200 });
  }
  if (events.length > MAX_EVENTS) {
    return NextResponse.json({ message: 'Batch too large' }, { status: 400 });
  }

  // A batch has one session. This makes the BFF budget meaningful and mirrors
  // the CMS integrity check before any privileged forwarding happens.
  const first = events[0] as { session_id?: string };
  const sessionId = typeof first?.session_id === 'string' ? first.session_id.trim() : '';
  if (!sessionId || !events.every((event) => (event as { session_id?: unknown }).session_id === sessionId)) {
    return NextResponse.json({ message: 'Invalid session batch' }, { status: 400 });
  }
  if (!allowSessionRequest(sessionId)) {
    return NextResponse.json({ message: 'Rate limited' }, { status: 429 });
  }
  const rateKey = deriveRateKey(sessionId);

  const target = new URL('/api/v1/experience/events', `${CMS_BASE_URL.replace(/\/$/, '')}/`);
  try {
    const upstream = await fetch(target.toString(), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-rux-ingest-token': RUX_INGEST_TOKEN,
        'x-rux-rate-key': rateKey,
      },
      body: raw,
      cache: 'no-store',
    });
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: { 'content-type': 'application/json' },
    });
  } catch {
    // Telemetry ingestion failure must never surface to the user experience.
    return NextResponse.json({ accepted: 0, duplicate: 0, rejected: events.length, error: 'upstream' }, { status: 502 });
  }
}
