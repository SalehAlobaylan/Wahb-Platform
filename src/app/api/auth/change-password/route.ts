import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const IAM_URL = process.env.IAM_API_URL || process.env.NEXT_PUBLIC_IAM_BASE_URL;

type ChangePasswordBody = {
  currentPassword?: string;
  newPassword?: string;
};

async function parseError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return {
    message:
      body?.message ||
      body?.error ||
      fallback,
  };
}

export async function POST(request: Request) {
  if (!IAM_URL) {
    return NextResponse.json({ message: 'IAM service not configured' }, { status: 500 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('wahb_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ message: 'Please sign in before changing your password.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as ChangePasswordBody;
  const currentPassword = body.currentPassword?.trim();
  const newPassword = body.newPassword?.trim();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ message: 'Current password and new password are required.' }, { status: 400 });
  }

  if (newPassword.length < 4) {
    return NextResponse.json({ message: 'New password must be at least 4 characters.' }, { status: 400 });
  }

  if (currentPassword === newPassword) {
    return NextResponse.json({ message: 'New password must be different from your current password.' }, { status: 400 });
  }

  const res = await fetch(`${IAM_URL}/users/profile/password`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });

  if (res.ok) {
    return NextResponse.json({ success: true });
  }
  const error = await parseError(res, 'Password update failed');
  return NextResponse.json(error, { status: res.status });
}
