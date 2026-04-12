import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const IAM_URL = process.env.IAM_API_URL || process.env.NEXT_PUBLIC_IAM_BASE_URL;

export async function POST(request: Request) {
  if (!IAM_URL) {
    return NextResponse.json({ message: 'IAM service not configured' }, { status: 500 });
  }

  const body = await request.json();

  const res = await fetch(`${IAM_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: body.email, password: body.password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Login failed' }));
    return NextResponse.json(error, { status: res.status });
  }

  const tokens = await res.json();
  const cookieStore = await cookies();
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
