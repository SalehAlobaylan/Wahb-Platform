import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Prefer public API base for platform proxy. `CMS_BASE_URL` is commonly used
// by other services (e.g. Aggregation) and may point to `/internal`.
const CMS_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.CMS_BASE_URL;

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
    const incomingUrl = new URL(request.url);
    const targetPath = path.join('/');
    const targetUrl = `${CMS_BASE_URL.replace(/\/$/, '')}/${targetPath}${incomingUrl.search}`;

    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete('host');
    // Hop-by-hop / length headers must NOT be forwarded: we re-buffer the body
    // below, and undici hard-fails the whole fetch when a forwarded
    // content-length doesn't match the re-measured body ("Request body length
    // does not match content-length header" → every POST 502'd). fetch
    // computes correct values itself.
    requestHeaders.delete('content-length');
    requestHeaders.delete('connection');
    requestHeaders.delete('transfer-encoding');
    requestHeaders.delete('keep-alive');
    requestHeaders.delete('accept-encoding');

    // Forward the user's access token (kept in an httpOnly cookie) as a
    // standard Bearer header so CMS UserAuthMiddleware-protected routes
    // (e.g. /content/mine, /content/submit) authenticate transparently.
    // If the caller already set an Authorization header (rare in this app)
    // we leave it alone.
    if (!requestHeaders.has('authorization')) {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('wahb_access_token')?.value;
        if (accessToken) {
            requestHeaders.set('Authorization', `Bearer ${accessToken}`);
        }
    }

    const body = request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : await request.arrayBuffer();

    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers: requestHeaders,
      body,
      cache: 'no-store',
    });

    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');
    responseHeaders.delete('transfer-encoding');
    responseHeaders.delete('connection');

    const responseBody = await upstream.arrayBuffer();

    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    // Surface the underlying cause — undici wraps real errors ("connection
    // refused", "body length mismatch", …) in a generic "fetch failed".
    const cause =
      error instanceof Error && error.cause instanceof Error
        ? error.cause.message
        : undefined;
    return NextResponse.json(
      {
        message: 'Proxy request failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        ...(cause ? { cause } : {}),
      },
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
