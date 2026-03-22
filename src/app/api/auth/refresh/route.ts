import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const IAM_URL = process.env.IAM_API_URL;

export async function POST() {
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
    // Refresh failed — clear cookies
    cookieStore.delete('wahb_access_token');
    cookieStore.delete('wahb_refresh_token');
    cookieStore.delete('wahb_token_expires');
    return NextResponse.json({ message: 'Session expired' }, { status: 401 });
  }

  const tokens = await res.json();
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

  return NextResponse.json({ success: true });
}
