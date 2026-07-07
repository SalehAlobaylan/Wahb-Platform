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

    const body = request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : await request.arrayBuffer();

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
