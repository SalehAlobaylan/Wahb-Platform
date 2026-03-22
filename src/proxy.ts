import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get('wahb_access_token')?.value;
  const refreshToken = request.cookies.get('wahb_refresh_token')?.value;
  const expiresAt = request.cookies.get('wahb_token_expires')?.value;

  // No tokens — anonymous user, let through
  if (!accessToken || !refreshToken) return NextResponse.next();

  // Check if token expires within 60 seconds
  const now = Date.now();
  const expires = Number(expiresAt || 0);
  if (expires - now > 60_000) return NextResponse.next();

  // Token expiring soon — refresh server-to-server
  try {
    const iamUrl = process.env.IAM_API_URL;
    if (!iamUrl) return NextResponse.next();

    const res = await fetch(`${iamUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      // Refresh failed — clear cookies, user becomes anonymous
      const response = NextResponse.next();
      response.cookies.delete('wahb_access_token');
      response.cookies.delete('wahb_refresh_token');
      response.cookies.delete('wahb_token_expires');
      return response;
    }

    const tokens = await res.json();
    const response = NextResponse.next();
    const secure = process.env.NODE_ENV === 'production';
    const maxAge = tokens.expires_in || 3600;

    response.cookies.set('wahb_access_token', tokens.access_token, {
      httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge,
    });
    response.cookies.set('wahb_refresh_token', tokens.refresh_token, {
      httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 30 * 24 * 3600,
    });
    response.cookies.set('wahb_token_expires', String(Date.now() + maxAge * 1000), {
      httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge,
    });

    return response;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth/).*)'],
};
