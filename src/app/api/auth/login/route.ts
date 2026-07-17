import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getIamBaseUrl } from '@/lib/auth/server-config';
import { parseTokenPair, persistTokenPair } from '@/lib/auth/token-cookies';

export async function POST(request: Request) {
  const IAM_URL = getIamBaseUrl();
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

  const tokens = parseTokenPair(await res.json().catch(() => null));
  if (!tokens) return NextResponse.json({ message: 'Invalid IAM token response' }, { status: 502 });
  const cookieStore = await cookies();
  persistTokenPair(cookieStore, tokens);

  return NextResponse.json({ success: true });
}
