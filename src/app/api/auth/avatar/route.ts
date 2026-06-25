import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const IAM_URL = process.env.IAM_API_URL || process.env.NEXT_PUBLIC_IAM_BASE_URL;

/**
 * Proxy POST /api/auth/avatar → IAM POST /users/avatar.
 *
 * Forwards a multipart payload (field "avatar") to IAM, injecting the user's
 * access token from the httpOnly cookie. IAM validates the image, stores it in
 * object storage, sets avatar_url, and returns the updated user. The multipart
 * body is streamed through unchanged (boundary preserved via Content-Type).
 */
export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('wahb_access_token')?.value;

    if (!accessToken) {
        return NextResponse.json(
            { message: 'Authentication required' },
            { status: 401 }
        );
    }
    if (!IAM_URL) {
        return NextResponse.json(
            { message: 'IAM base URL is not configured' },
            { status: 500 }
        );
    }

    const incomingType = request.headers.get('content-type') || '';
    if (!incomingType.toLowerCase().startsWith('multipart/form-data')) {
        return NextResponse.json(
            { message: 'Expected multipart/form-data' },
            { status: 400 }
        );
    }

    const body = await request.arrayBuffer();

    const upstream = await fetch(`${IAM_URL.replace(/\/$/, '')}/users/avatar`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': incomingType,
        },
        body,
    });

    const text = await upstream.text();
    let parsed: unknown;
    try {
        parsed = text ? JSON.parse(text) : null;
    } catch {
        parsed = { message: text };
    }
    return NextResponse.json(parsed, { status: upstream.status });
}
