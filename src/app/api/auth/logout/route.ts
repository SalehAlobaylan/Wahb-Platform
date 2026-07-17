import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getIamBaseUrl } from '@/lib/auth/server-config';
import { clearTokenCookies } from '@/lib/auth/token-cookies';
import { isExactSameOrigin } from '@/lib/auth/request-policy';

export async function POST(request: Request) {
  if (!isExactSameOrigin(request)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const IAM_URL = getIamBaseUrl();
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('wahb_refresh_token')?.value;

  // IAM revokes sessions by the refresh-token request body, not by a Bearer
  // access token. Local clearing remains best-effort and always happens.
  if (IAM_URL && refreshToken) {
    await fetch(`${IAM_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: AbortSignal.timeout(10_000),
    }).catch(() => undefined);
  }

  // Always clear cookies regardless of IAM response
  clearTokenCookies(cookieStore);

  return NextResponse.json({ success: true });
}
