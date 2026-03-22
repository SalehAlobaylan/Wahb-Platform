import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const IAM_URL = process.env.IAM_API_URL;

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('wahb_access_token')?.value;

  // Call IAM logout if we have a token (best-effort)
  if (IAM_URL && accessToken) {
    await fetch(`${IAM_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }).catch(() => {});
  }

  // Always clear cookies regardless of IAM response
  cookieStore.delete('wahb_access_token');
  cookieStore.delete('wahb_refresh_token');
  cookieStore.delete('wahb_token_expires');

  return NextResponse.json({ success: true });
}
