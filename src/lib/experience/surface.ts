import type { RuxSurface } from './types';

export function surfaceForPath(pathname: string | null | undefined): RuxSurface | null {
  if (!pathname) return null;
  if (pathname === '/news' || pathname.startsWith('/news/')) return 'news';
  if (pathname === '/' || pathname === '/foryou' || pathname.startsWith('/foryou/')) return 'foryou';
  return null;
}
