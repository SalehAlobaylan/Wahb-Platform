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
  const refreshToken = cookieStore.get('wahb_refresh_token')?.value;
  if (!accessToken) {
    // Anonymous browsing is a first-class state. Only return 401 when a
    // refresh credential exists and the client can actually recover a user
    // session; otherwise auth initialization would manufacture two failed
    // requests on every public page load.
    if (!refreshToken) return NextResponse.json({ user: null });
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const res = await fetchProfile(IAM_URL, accessToken);

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      if (refreshToken) return NextResponse.json({ user: null }, { status: 401 });
      cookieStore.delete('wahb_access_token');
      cookieStore.delete('wahb_token_expires');
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({ user: null }, { status: 502 });
  }

  const data = await res.json();
  // IAM may wrap in { data: user } or return user directly
  const user = data.data || data;

  return NextResponse.json({ user });
}
