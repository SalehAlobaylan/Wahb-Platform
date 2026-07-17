import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getIamBaseUrl } from '@/lib/auth/server-config';
import { isExactSameOrigin, MAX_AVATAR_UPLOAD_BYTES, readBoundedBody, readBoundedResponseBody } from '@/lib/auth/request-policy';

/**
 * Proxy POST /api/auth/avatar → IAM POST /users/avatar.
 *
 * Forwards a multipart payload (field "avatar") to IAM, injecting the user's
 * access token from the httpOnly cookie. IAM validates the image, stores it in
 * object storage, sets avatar_url, and returns the updated user. The multipart
 * body is streamed through unchanged (boundary preserved via Content-Type).
 */
export async function POST(request: NextRequest) {
    if (!isExactSameOrigin(request)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    const IAM_URL = getIamBaseUrl();
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

    const body = await readBoundedBody(request, MAX_AVATAR_UPLOAD_BYTES);
    if (!body) return NextResponse.json({ message: 'Avatar upload is too large' }, { status: 413 });

    const upstream = await fetch(`${IAM_URL.replace(/\/$/, '')}/users/avatar`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': incomingType,
        },
        body,
    });

    const upstreamBody = await readBoundedResponseBody(upstream);
    if (!upstreamBody) return NextResponse.json({ message: 'Identity response is too large' }, { status: 502 });
    const text = new TextDecoder().decode(upstreamBody);
    let parsed: unknown;
    try {
        parsed = text ? JSON.parse(text) : null;
    } catch {
        parsed = { message: text };
    }
    return NextResponse.json(parsed, { status: upstream.status });
}
