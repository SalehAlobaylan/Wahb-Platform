import { NextResponse, type NextRequest } from 'next/server';

const ACCESS_TOKEN_COOKIE = 'wahb_access_token';
const REFRESH_TOKEN_COOKIE = 'wahb_refresh_token';
const TOKEN_EXPIRES_COOKIE = 'wahb_token_expires';
const LOCALE_COOKIE = 'wahb_locale';

const PROTECTED_PREFIXES = ['/profile', '/settings', '/create', '/saved'];
const AUTH_ONLY_PREFIXES = ['/login', '/register'];

function pathMatches(pathname: string, prefixes: string[]): boolean {
    return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function setLocaleIfMissing(response: NextResponse, request: NextRequest): void {
    if (!request.cookies.get(LOCALE_COOKIE)?.value) {
        response.cookies.set(LOCALE_COOKIE, 'ar', {
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
        });
    }
}

function isAccessTokenLive(request: NextRequest): boolean {
    const access = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!access) return false;
    const expiresRaw = request.cookies.get(TOKEN_EXPIRES_COOKIE)?.value;
    if (!expiresRaw) return true;
    const expiresAt = Number(expiresRaw);
    if (!Number.isFinite(expiresAt)) return true;
    return Date.now() < expiresAt;
}

function isAuthenticated(request: NextRequest): boolean {
    if (isAccessTokenLive(request)) return true;
    return Boolean(request.cookies.get(REFRESH_TOKEN_COOKIE)?.value);
}

/**
 * Next.js 16 proxy. Handles three concerns in one pass:
 *
 *   1. Route gating — bounce unauthenticated users away from protected
 *      pages, and bounce already-logged-in users away from /login,/register.
 *   2. Locale cookie default — every visitor gets an Arabic locale cookie
 *      on first request (RTL is the default UX).
 *   3. Server-to-server token refresh — when the access token is about to
 *      expire (within 60s) and a refresh token exists, swap tokens behind
 *      the scenes so client-side fetches don't see a stale 401.
 *
 * Replaces the deprecated middleware.ts (Next 16 rename).
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
    const { pathname, search } = request.nextUrl;
    const runtime = process.env.WAHB_RUNTIME_ID;
    const runtimeMatches = !runtime || request.cookies.get('wahb_runtime_id')?.value === runtime;
    if (runtime && pathname.startsWith('/api/')) {
        const mutation = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
        if (mutation && request.headers.get('origin') !== request.nextUrl.origin) return NextResponse.json({ message: 'Same-origin requests required' }, { status: 403 });
        if ((mutation || request.headers.has('x-wahb-runtime-id')) && request.headers.get('x-wahb-runtime-id') !== runtime) return NextResponse.json({ message: 'The app restarted. Refresh this tab.', code: 'runtime_changed' }, { status: 409 });
        if (!['/api/auth/login', '/api/auth/register'].includes(pathname) && !runtimeMatches && (request.cookies.has(ACCESS_TOKEN_COOKIE) || request.cookies.has(REFRESH_TOKEN_COOKIE))) {
            const headers = new Headers(request.headers);
            const cookie = (request.headers.get('cookie') || '').split(';').filter(part => !['wahb_access_token', 'wahb_refresh_token', 'wahb_token_expires', 'wahb_runtime_id'].includes(part.trim().split('=')[0])).join(';');
            headers.set('cookie', cookie);
            const res = NextResponse.next({ request: { headers } });
            for (const name of [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, TOKEN_EXPIRES_COOKIE, 'wahb_runtime_id']) res.cookies.delete(name);
            return res;
        }
    }
    const authed = runtimeMatches && isAuthenticated(request);

    // 1. Auth-gated route redirects (no point refreshing tokens if we are
    //    about to redirect anyway).
    if (pathMatches(pathname, PROTECTED_PREFIXES) && !authed) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/login';
        loginUrl.search = `?redirect=${encodeURIComponent(pathname + search)}`;
        const res = NextResponse.redirect(loginUrl);
        setLocaleIfMissing(res, request);
        return res;
    }
    if (pathMatches(pathname, AUTH_ONLY_PREFIXES) && authed) {
        const homeUrl = request.nextUrl.clone();
        homeUrl.pathname = '/app';
        homeUrl.search = '';
        const res = NextResponse.redirect(homeUrl);
        setLocaleIfMissing(res, request);
        return res;
    }

    const res = NextResponse.next();
    setLocaleIfMissing(res, request);
    return res;
}

// Skip Next internals + the auth API itself (which would recurse during refresh).
export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
