import type { ContentItem } from '@/types';

export const PODS_HARD_MAX_DURATION_SEC = 40 * 60;

export function getPlaybackUrl(item: Pick<ContentItem, 'playback_url' | 'media_url' | 'fallback_playback_url'>): string | undefined {
  return item.playback_url || item.media_url || item.fallback_playback_url || undefined;
}

export function getAudioPlaybackUrl(item: Pick<ContentItem, 'playback_url' | 'media_url' | 'fallback_playback_url' | 'playback_type' | 'media_renditions'>): string | undefined {
  const nativeAudio = item.media_renditions?.find((rendition) => rendition.type === 'audio' && rendition.url)?.url;
  return nativeAudio || (item.playback_type === 'audio' ? item.playback_url : undefined) || item.fallback_playback_url || item.media_url || undefined;
}

export function isVisualPlayback(item: Pick<ContentItem, 'has_video' | 'visual_available' | 'playback_type' | 'playback_url' | 'media_url' | 'fallback_playback_url'>): boolean {
  if (!getPlaybackUrl(item)) return false;
  if (item.playback_type === 'audio') return false;
  return (item.visual_available ?? item.has_video) !== false;
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
