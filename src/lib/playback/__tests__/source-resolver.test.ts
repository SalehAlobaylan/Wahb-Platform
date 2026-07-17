import { resolvePlaybackSources } from '@/lib/playback/source-resolver';

const native = { nativeHls: true, managedHls: true };
const managedOnly = { nativeHls: false, managedHls: true };
const noHls = { nativeHls: false, managedHls: false };

describe('resolvePlaybackSources', () => {
  it('uses native HLS before declared fallbacks', () => {
    expect(resolvePlaybackSources({
      playback_url: 'https://cdn.test/item.m3u8',
      playback_type: 'hls',
      fallback_playback_url: 'https://cdn.test/item.mp4',
    }, native)).toEqual([
      { url: 'https://cdn.test/item.m3u8', type: 'hls', adapter: 'native-hls', reason: 'primary' },
      { url: 'https://cdn.test/item.mp4', type: 'mp4', adapter: 'element', reason: 'fallback' },
    ]);
  });

  it('uses managed HLS only when native support is absent', () => {
    expect(resolvePlaybackSources({ playback_url: 'https://cdn.test/item.m3u8', playback_type: 'hls' }, managedOnly))
      .toEqual([{ url: 'https://cdn.test/item.m3u8', type: 'hls', adapter: 'managed-hls', reason: 'primary' }]);
  });

  it('skips unsupported manifests and selects the declared fallback', () => {
    expect(resolvePlaybackSources({
      playback_url: 'https://cdn.test/item.m3u8',
      playback_type: 'hls',
      fallback_playback_url: 'https://cdn.test/item.mp4',
    }, noHls)).toEqual([
      { url: 'https://cdn.test/item.mp4', type: 'mp4', adapter: 'element', reason: 'fallback' },
    ]);
  });

  it('keeps audio canonical even when it has artwork and no video', () => {
    expect(resolvePlaybackSources({
      playback_url: 'https://cdn.test/item.mp3',
      playback_type: 'audio',
      has_video: false,
    }, noHls)).toEqual([
      { url: 'https://cdn.test/item.mp3', type: 'audio', adapter: 'element', reason: 'primary' },
    ]);
  });

  it('deduplicates URLs and never creates a source from empty metadata', () => {
    expect(resolvePlaybackSources({
      playback_url: ' https://cdn.test/item.mp4 ',
      playback_type: 'mp4',
      fallback_playback_url: 'https://cdn.test/item.mp4',
      media_renditions: [{ type: 'mp4', url: 'https://cdn.test/item.mp4', is_primary: true }],
    }, noHls)).toEqual([
      { url: 'https://cdn.test/item.mp4', type: 'mp4', adapter: 'element', reason: 'primary' },
    ]);
    expect(resolvePlaybackSources({}, noHls)).toEqual([]);
  });
});
