import { NextRequest, NextResponse } from 'next/server';

const CMS_BASE_URL = process.env.CMS_BASE_URL || process.env.NEXT_PUBLIC_API_URL;

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
    return NextResponse.json(
      {
        message: 'Proxy request failed',
        error: error instanceof Error ? error.message : 'Unknown error',
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
