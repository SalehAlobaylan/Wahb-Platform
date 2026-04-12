import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const IAM_URL = process.env.IAM_API_URL || process.env.NEXT_PUBLIC_IAM_BASE_URL;

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('wahb_access_token')?.value;

  if (!IAM_URL || !accessToken) {
    return NextResponse.json({ user: null });
  }

  const res = await fetch(`${IAM_URL}/users/profile`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    return NextResponse.json({ user: null });
  }

  const data = await res.json();
  // IAM may wrap in { data: user } or return user directly
  const user = data.data || data;

  return NextResponse.json({ user });
}
