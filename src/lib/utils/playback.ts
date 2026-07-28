import type { ContentItem } from '@/types';

export const PODS_HARD_MAX_DURATION_SEC = 40 * 60;

export function getPlaybackUrl(item: Pick<ContentItem, 'playback_url' | 'media_url' | 'fallback_playback_url'>): string | undefined {
  return item.playback_url || item.media_url || item.fallback_playback_url || undefined;
}

export function getAudioPlaybackUrl(item: Pick<ContentItem, 'playback_url' | 'media_url' | 'fallback_playback_url' | 'playback_type'>): string | undefined {
  if (item.playback_type === 'hls') {
    return item.fallback_playback_url || item.media_url || item.playback_url || undefined;
  }
  return getPlaybackUrl(item);
}

export function isVisualPlayback(item: Pick<ContentItem, 'has_video' | 'playback_type' | 'playback_url' | 'media_url' | 'fallback_playback_url'>): boolean {
  if (!getPlaybackUrl(item)) return false;
  if (item.playback_type === 'audio') return false;
  return item.has_video !== false;
}

export function withLegacyMediaUrl<T extends ContentItem>(item: T): T {
  const playbackUrl = getPlaybackUrl(item);
  if (!playbackUrl || item.media_url) return item;
  return { ...item, media_url: playbackUrl };
}

export function isPodsDurationAllowed(item: Pick<ContentItem, 'duration_sec'>): boolean {
  if (!item.duration_sec) return true;
  return item.duration_sec <= PODS_HARD_MAX_DURATION_SEC;
}

export function normalizePodsFeedItem<T extends ContentItem>(item: T): T | null {
  if (!isPodsDurationAllowed(item)) return null;
  return withLegacyMediaUrl(item);
}
