import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getIamBaseUrl } from '@/lib/auth/server-config';

function fetchProfile(iamUrl: string, accessToken: string) {
  return fetch(`${iamUrl}/users/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function GET() {
  const IAM_URL = getIamBaseUrl();
  if (!IAM_URL) {
    return NextResponse.json({ user: null });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('wahb_access_token')?.value;
  if (!accessToken) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const res = await fetchProfile(IAM_URL, accessToken);

  if (!res.ok) {
    return NextResponse.json({ user: null }, { status: res.status === 401 || res.status === 403 ? 401 : 502 });
  }

  const data = await res.json();
  // IAM may wrap in { data: user } or return user directly
  const user = data.data || data;

  return NextResponse.json({ user });
}
