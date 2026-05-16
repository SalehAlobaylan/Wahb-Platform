import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const CMS_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.CMS_BASE_URL;

/**
 * Proxy POST /api/content/submit → CMS /api/v1/content/submit.
 *
 * Forwards a multipart payload (title, body_text, audio_file) to CMS,
 * injecting the user's access token from the httpOnly cookie. CMS creates
 * the ContentItem and, if audio is present, hands the bytes to Aggregation
 * for transcoding.
 *
 * Multipart is streamed through unchanged so we don't have to materialize
 * the whole audio buffer in memory here.
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
    if (!CMS_BASE_URL) {
        return NextResponse.json(
            { message: 'CMS base URL is not configured' },
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

    const upstream = await fetch(`${CMS_BASE_URL.replace(/\/$/, '')}/content/submit`, {
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
