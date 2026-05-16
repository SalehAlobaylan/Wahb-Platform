import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const CMS_URL = process.env.NEXT_PUBLIC_API_URL || process.env.CMS_BASE_URL;

if (!CMS_URL) {
  // Surface misconfiguration at build/boot, not at first user request.
  throw new Error(
    'CMS base URL is not configured: set NEXT_PUBLIC_API_URL or CMS_BASE_URL'
  );
}

/**
 * Proxy route for triggering transcription.
 * Reads the JWT from httpOnly cookie and forwards it to CMS as Authorization header.
 * This prevents the client from needing to handle tokens directly.
 *
 * POST /api/transcribe
 * Body: { content_id: string }
 */
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('wahb_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body?.content_id) {
    return NextResponse.json(
      { message: 'content_id is required' },
      { status: 400 }
    );
  }

  const res = await fetch(`${CMS_URL}/content/${body.content_id}/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: '{}',
  });

  const data = await res.json().catch(() => ({ message: 'Unknown error' }));

  return NextResponse.json(data, { status: res.status });
}
