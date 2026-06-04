import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const IAM_URL = process.env.IAM_API_URL || process.env.NEXT_PUBLIC_IAM_BASE_URL;

type RefreshTokens = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
};

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function persistTokens(cookieStore: CookieStore, tokens: RefreshTokens) {
  const secure = process.env.NODE_ENV === 'production';
  const maxAge = tokens.expires_in || 3600;
  cookieStore.set('wahb_access_token', tokens.access_token, {
    httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge,
  });
  cookieStore.set('wahb_refresh_token', tokens.refresh_token, {
    httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 30 * 24 * 3600,
  });
  cookieStore.set('wahb_token_expires', String(Date.now() + maxAge * 1000), {
    httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge,
  });
}

async function refreshTokens(refreshToken: string): Promise<RefreshTokens | null> {
  try {
    const res = await fetch(`${IAM_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const tokens = (await res.json()) as RefreshTokens;
    return tokens.access_token ? tokens : null;
  } catch {
    return null;
  }
}

function fetchProfile(accessToken: string) {
  return fetch(`${IAM_URL}/users/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function GET() {
  if (!IAM_URL) {
    return NextResponse.json({ user: null });
  }

  const cookieStore = await cookies();
  let accessToken = cookieStore.get('wahb_access_token')?.value;
  const refreshToken = cookieStore.get('wahb_refresh_token')?.value;

  // The access-token cookie's maxAge equals the JWT lifetime, so the browser
  // drops it at expiry. If it's gone but a (30-day) refresh token survives,
  // refresh here so an expired access token doesn't strand a valid session in a
  // half-signed-in state.
  if (!accessToken && refreshToken) {
    const tokens = await refreshTokens(refreshToken);
    if (tokens) {
      persistTokens(cookieStore, tokens);
      accessToken = tokens.access_token;
    }
  }

  if (!accessToken) {
    return NextResponse.json({ user: null });
  }

  let res = await fetchProfile(accessToken);

  // Access token rejected by IAM (401/403, or any non-ok auth failure) → attempt
  // a single refresh, then retry once.
  if (!res.ok && refreshToken) {
    const tokens = await refreshTokens(refreshToken);
    if (tokens) {
      persistTokens(cookieStore, tokens);
      res = await fetchProfile(tokens.access_token);
    }
  }

  if (!res.ok) {
    return NextResponse.json({ user: null });
  }

  const data = await res.json();
  // IAM may wrap in { data: user } or return user directly
  const user = data.data || data;

  return NextResponse.json({ user });
}
