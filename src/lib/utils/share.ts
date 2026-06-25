import { toast } from 'sonner';
import type { ContentItem } from '@/types';

type Translate = (key: string, vars?: Record<string, string | number>) => string;

/**
 * Share the current user's profile. Uses the native share sheet when available
 * (mobile / PWA), otherwise copies a link to the clipboard. A cancelled native
 * share is not treated as an error.
 *
 * There is no public profile route yet, so we share the app's /profile URL.
 * When a public `/u/[handle]` page lands later, only the `url` line changes.
 */
export async function shareProfile(name: string, t: Translate): Promise<void> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

  const url = `${window.location.origin}/profile`;
  const title = t('profile.share.title', { name });

  try {
    if (typeof navigator.share === 'function') {
      await navigator.share({ title, text: title, url });
      return;
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      toast.success(t('profile.share.copied'));
      return;
    }
    toast.error(t('profile.share.failed'));
  } catch (err) {
    // User dismissed the native share sheet — not an error worth surfacing.
    if (err instanceof DOMException && err.name === 'AbortError') return;
    toast.error(t('profile.share.failed'));
  }
}

export function getShareUrl(item?: Pick<ContentItem, 'id' | 'original_url' | 'type'> | null): string {
  if (!item) return typeof window !== 'undefined' ? window.location.href : '';
  if (item.original_url) return item.original_url;

  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.origin);
  if (item.type === 'ARTICLE' || item.type === 'TWEET' || item.type === 'COMMENT') {
    url.pathname = '/news';
    url.searchParams.set('item', item.id);
    return url.toString();
  }
  url.pathname = '/';
  url.searchParams.set('item', item.id);
  return url.toString();
}

export async function shareContent(options: {
  title?: string;
  text?: string;
  item?: Pick<ContentItem, 'id' | 'original_url' | 'type'> | null;
}): Promise<void> {
  const url = getShareUrl(options.item);

  if (navigator.share) {
    await navigator.share({
      title: options.title,
      text: options.text,
      url,
    });
    return;
  }

  await navigator.clipboard.writeText(url);
}
