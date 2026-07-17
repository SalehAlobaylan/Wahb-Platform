import 'server-only';
import type { cookies } from 'next/headers';

export interface TokenPair { access_token: string; refresh_token: string; expires_in?: number; }
type CookieStore = Awaited<ReturnType<typeof cookies>>;

export function parseTokenPair(value: unknown): TokenPair | null {
  if (!value || typeof value !== 'object') return null;
  const tokens = value as Partial<TokenPair>;
  if (typeof tokens.access_token !== 'string' || !tokens.access_token || typeof tokens.refresh_token !== 'string' || !tokens.refresh_token) return null;
  return { access_token: tokens.access_token, refresh_token: tokens.refresh_token, expires_in: typeof tokens.expires_in === 'number' && Number.isFinite(tokens.expires_in) ? Math.max(1, Math.floor(tokens.expires_in)) : 3600 };
}

export function persistTokenPair(cookieStore: CookieStore, tokens: TokenPair): void {
  const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' };
  const maxAge = tokens.expires_in ?? 3600;
  cookieStore.set('wahb_access_token', tokens.access_token, { ...options, maxAge });
  cookieStore.set('wahb_refresh_token', tokens.refresh_token, { ...options, maxAge: 30 * 24 * 3600 });
  cookieStore.set('wahb_token_expires', String(Date.now() + maxAge * 1000), { ...options, maxAge });
}

export function clearTokenCookies(cookieStore: CookieStore): void {
  cookieStore.delete('wahb_access_token');
  cookieStore.delete('wahb_refresh_token');
  cookieStore.delete('wahb_token_expires');
}
