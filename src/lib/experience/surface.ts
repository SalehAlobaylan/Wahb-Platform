import type { RuxSurface } from './types';

export function surfaceForPath(pathname: string | null | undefined): RuxSurface | null {
  if (!pathname) return null;
  if (pathname === '/news' || pathname.startsWith('/news/')) return 'news';
  if (pathname === '/' || pathname === '/pods' || pathname.startsWith('/pods/')) return 'pods';
  return null;
}
