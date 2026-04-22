import type { ContentItem } from '@/types';

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
