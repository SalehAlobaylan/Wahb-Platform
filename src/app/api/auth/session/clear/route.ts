import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { clearTokenCookies } from '@/lib/auth/token-cookies';
import { isExactSameOrigin } from '@/lib/auth/request-policy';

/** Clears local session cookies only after the browser coordinator elects it. */
export async function POST(request: Request) {
  if (!isExactSameOrigin(request)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  clearTokenCookies(await cookies());
  return NextResponse.json({ success: true });
}
