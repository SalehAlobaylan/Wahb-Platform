import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  buildProxyRequestHeaders,
  buildProxyResponseHeaders,
  buildProxyTargetUrl,
  resolveProxyPath,
} from './proxy-helpers';

// Prefer public API base for platform proxy. `CMS_BASE_URL` is commonly used
// by other services (e.g. Aggregation) and may point to `/internal`.
const CMS_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.CMS_BASE_URL;
const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const PREFERENCE_MUTATION_MAX_BYTES = 16 * 1024;

function isStateChangingMethod(method: string): boolean {
  return STATE_CHANGING_METHODS.has(method.toUpperCase());
}

function hasAllowedOrigin(request: NextRequest): boolean {
  if (!isStateChangingMethod(request.method)) return true;

  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && !['same-origin', 'same-site', 'none'].includes(fetchSite)) {
    return false;
  }

  const origin = request.headers.get('origin');
  if (!origin) return true;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function readProxyBody(request: NextRequest, maxBytes?: number): Promise<ArrayBuffer> {
  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (maxBytes && Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RangeError('request body is too large');
  }
  if (!maxBytes || !request.body) return request.arrayBuffer();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new RangeError('request body is too large');
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body.buffer;
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  try {
    if (!CMS_BASE_URL) {
      return NextResponse.json(
        { message: 'CMS base URL is not configured' },
        { status: 500 }
      );
    }

    const { path } = await context.params;
    const safePath = resolveProxyPath(path);
    if (!safePath) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    if (!hasAllowedOrigin(request)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const incomingUrl = new URL(request.url);
    const targetUrl = buildProxyTargetUrl(CMS_BASE_URL, safePath, incomingUrl.search);

    // Forward the user's access token (kept in an httpOnly cookie) as a
    // standard Bearer header so CMS UserAuthMiddleware-protected routes
    // (e.g. /content/mine, /content/submit) authenticate transparently.
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('wahb_access_token')?.value;
    const requestHeaders = buildProxyRequestHeaders(request.headers, accessToken);

    const preferenceMutation = safePath === 'preferences/topics' && request.method === 'PUT';
    let body: ArrayBuffer | undefined;
    try {
      body = request.method === 'GET' || request.method === 'HEAD'
        ? undefined
        : await readProxyBody(request, preferenceMutation ? PREFERENCE_MUTATION_MAX_BYTES : undefined);
    } catch (error) {
      if (error instanceof RangeError) {
        return NextResponse.json({ message: 'Preference request body is too large' }, { status: 413 });
      }
      throw error;
    }

    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers: requestHeaders,
      body,
      cache: 'no-store',
    });

    const responseHeaders = buildProxyResponseHeaders(upstream.headers);

    const responseBody = await upstream.arrayBuffer();

    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy request failed', error);
    return NextResponse.json(
      { message: 'Proxy request failed' },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function OPTIONS(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}
