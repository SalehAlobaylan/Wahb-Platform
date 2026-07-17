import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getIamBaseUrl } from '@/lib/auth/server-config';
import { parseTokenPair, persistTokenPair } from '@/lib/auth/token-cookies';
import { isExactSameOrigin } from '@/lib/auth/request-policy';

export async function POST(request: Request) {
  if (!isExactSameOrigin(request)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const IAM_URL = getIamBaseUrl();
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('wahb_refresh_token')?.value;

  if (!IAM_URL || !refreshToken) {
    return NextResponse.json({ message: 'No session' }, { status: 401 });
  }

  const res = await fetch(`${IAM_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    // A concurrent tab may already have rotated the shared cookie pair. A
    // losing request must never erase that newer session.
    return NextResponse.json({ message: 'Refresh unavailable' }, { status: res.status === 401 ? 401 : 503 });
  }

  const tokens = parseTokenPair(await res.json().catch(() => null));
  if (!tokens) {
    return NextResponse.json({ message: 'Invalid session response' }, { status: 502 });
  }
  persistTokenPair(cookieStore, tokens);

  return NextResponse.json({ success: true });
}
