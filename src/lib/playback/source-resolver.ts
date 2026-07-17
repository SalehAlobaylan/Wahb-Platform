import type { ContentItem } from '@/types';

export type PlaybackSourceType = 'hls' | 'mp4' | 'audio';
export type PlaybackAdapter = 'native-hls' | 'managed-hls' | 'element';

export interface PlaybackCapabilities {
  nativeHls: boolean;
  managedHls: boolean;
}

export interface PlaybackSource {
  url: string;
  type: PlaybackSourceType;
  adapter: PlaybackAdapter;
  reason: 'primary' | 'rendition' | 'fallback' | 'legacy';
}

interface RawSource {
  url?: string;
  type?: string;
  reason: PlaybackSource['reason'];
}

function sourceType(type: string | undefined, fallback: PlaybackSourceType): PlaybackSourceType {
  if (type === 'hls' || type === 'mp4' || type === 'audio') return type;
  return fallback;
}

function cleanUrl(url: string | undefined): string | undefined {
  const trimmed = url?.trim();
  return trimmed || undefined;
}

/**
 * Converts CMS-approved playback metadata into legal browser candidates. This
 * never fabricates URLs or promotes an unsupported HLS manifest to a video
 * source: HLS is included only when a native or managed adapter can own it.
 */
export function resolvePlaybackSources(
  item: Pick<ContentItem, 'playback_url' | 'playback_type' | 'fallback_playback_url' | 'media_url' | 'media_renditions' | 'has_video'>,
  capabilities: PlaybackCapabilities,
): PlaybackSource[] {
  const fallbackType: PlaybackSourceType = item.has_video === false ? 'audio' : 'mp4';
  const raw: RawSource[] = [
    { url: item.playback_url, type: item.playback_type, reason: 'primary' },
    ...(item.media_renditions ?? [])
      .filter((rendition) => rendition.is_primary)
      .map((rendition) => ({ url: rendition.url, type: rendition.type, reason: 'rendition' as const })),
    { url: item.fallback_playback_url, type: fallbackType, reason: 'fallback' },
    { url: item.media_url, type: item.playback_url === item.media_url ? undefined : fallbackType, reason: 'legacy' },
    ...(item.media_renditions ?? [])
      .filter((rendition) => !rendition.is_primary)
      .map((rendition) => ({ url: rendition.url, type: rendition.type, reason: 'rendition' as const })),
  ];

  const candidates: PlaybackSource[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    const url = cleanUrl(entry.url);
    if (!url) continue;
    const type = sourceType(entry.type, fallbackType);
    if (type === 'hls') {
      const adapter: PlaybackAdapter | null = capabilities.nativeHls
        ? 'native-hls'
        : capabilities.managedHls
          ? 'managed-hls'
          : null;
      if (!adapter) continue;
      const key = `${adapter}:${url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push({ url, type, adapter, reason: entry.reason });
      continue;
    }

    const key = `element:${url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push({ url, type, adapter: 'element', reason: entry.reason });
  }
  return candidates;
}

export function playbackCapabilitiesFor(media: HTMLMediaElement | null): PlaybackCapabilities {
  const nativeHls = Boolean(media?.canPlayType('application/vnd.apple.mpegurl'));
  return {
    nativeHls,
    managedHls: typeof window !== 'undefined' && typeof MediaSource !== 'undefined',
  };
}
