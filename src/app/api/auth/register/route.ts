import { NextResponse } from 'next/server';

const IAM_URL = process.env.IAM_API_URL || process.env.NEXT_PUBLIC_IAM_BASE_URL;

export async function POST(request: Request) {
  if (!IAM_URL) {
    return NextResponse.json({ message: 'IAM service not configured' }, { status: 500 });
  }

  const body = await request.json();

  const res = await fetch(`${IAM_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: body.email,
      password: body.password,
      ...(body.username && { username: body.username }),
    }),
  });

  const data = await res.json().catch(() => ({ message: 'Registration failed' }));

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json(data, { status: 201 });
}
