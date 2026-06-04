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
    const authed = isAuthenticated(request);

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
        homeUrl.pathname = '/';
        homeUrl.search = '';
        const res = NextResponse.redirect(homeUrl);
        setLocaleIfMissing(res, request);
        return res;
    }

    // 2. Token refresh.
    const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    const expiresAt = request.cookies.get(TOKEN_EXPIRES_COOKIE)?.value;

    if (refreshToken) {
        const now = Date.now();
        const expires = Number(expiresAt || 0);
        const expiringSoon = Number.isFinite(expires) && expires > 0 && expires - now <= 60_000;
        // Refresh when the access token is gone (its cookie's maxAge matches the
        // JWT lifetime, so the browser drops it at expiry) OR is within 60s of
        // expiring. Previously this was gated on `accessToken` being present,
        // which meant that once the access cookie was dropped the session could
        // never refresh — leaving a valid refresh token stuck half-signed-in.
        const needsRefresh = !accessToken || expiringSoon;

        if (needsRefresh) {
            try {
                const iamUrl = process.env.IAM_API_URL;
                if (iamUrl) {
                    const res = await fetch(`${iamUrl}/auth/refresh`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refresh_token: refreshToken }),
                    });

                    if (res.ok) {
                        const tokens = await res.json();
                        const response = NextResponse.next();
                        const secure = process.env.NODE_ENV === 'production';
                        const maxAge = tokens.expires_in || 3600;

                        response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.access_token, {
                            httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge,
                        });
                        response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refresh_token, {
                            httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 30 * 24 * 3600,
                        });
                        response.cookies.set(TOKEN_EXPIRES_COOKIE, String(Date.now() + maxAge * 1000), {
                            httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge,
                        });
                        setLocaleIfMissing(response, request);
                        return response;
                    }

                    // Refresh failed — clear cookies, user becomes anonymous.
                    const response = NextResponse.next();
                    response.cookies.delete(ACCESS_TOKEN_COOKIE);
                    response.cookies.delete(REFRESH_TOKEN_COOKIE);
                    response.cookies.delete(TOKEN_EXPIRES_COOKIE);
                    setLocaleIfMissing(response, request);
                    return response;
                }
            } catch {
                // Network or parse error — let the request through; the
                // client-side hooks will surface auth failures on next call.
            }
        }
    }

    const res = NextResponse.next();
    setLocaleIfMissing(res, request);
    return res;
}

// Skip Next internals + the auth API itself (which would recurse during refresh).
export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth/).*)'],
};
