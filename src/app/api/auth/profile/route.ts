import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const IAM_URL = process.env.IAM_API_URL || process.env.NEXT_PUBLIC_IAM_BASE_URL;

/**
 * Proxy PUT /api/auth/profile → IAM PUT /users/profile.
 *
 * Reads the JWT from the httpOnly access-token cookie so the client never
 * touches the token, then forwards the JSON body as-is. IAM applies its own
 * field-level validation (length caps, username uniqueness, etc.) — we
 * surface its status code and body unchanged.
 */
export async function PUT(request: Request) {
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

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
        return NextResponse.json(
            { message: 'Invalid JSON body' },
            { status: 400 }
        );
    }

    const res = await fetch(`${IAM_URL}/users/profile`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const text = await res.text();
    let parsed: unknown;
    try {
        parsed = text ? JSON.parse(text) : null;
    } catch {
        parsed = text;
    }

    return NextResponse.json(parsed, { status: res.status });
}
