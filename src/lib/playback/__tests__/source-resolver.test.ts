import { resolvePlaybackSources } from '@/lib/playback/source-resolver';

const native = { nativeHls: true, managedHls: true };
const managedOnly = { nativeHls: false, managedHls: true };
const noHls = { nativeHls: false, managedHls: false };

describe('resolvePlaybackSources', () => {
  it('keeps corrected legacy podcast HLS and MP4 transports on the audio surface', () => {
    const sources = resolvePlaybackSources({
      playback_url: 'https://cdn.test/chapter/index.m3u8', playback_type: 'hls', has_video: false,
      fallback_playback_url: 'https://cdn.test/chapter/processed.mp4', fallback_playback_type: 'mp4', fallback_has_video: false,
      media_url: 'https://cdn.test/chapter/processed.v2.mp4',
      media_renditions: [
        { type: 'hls', url: 'https://cdn.test/chapter/index.m3u8', is_primary: true, has_video: false },
        { type: 'mp4', url: 'https://cdn.test/chapter/processed.mp4', is_primary: false, has_video: false },
      ],
    }, native, { prefer_audio_when_available: false });
    expect(sources.map(({ type, hasVideo }) => ({ type, hasVideo }))).toEqual([
      { type: 'hls', hasVideo: false }, { type: 'mp4', hasVideo: false }, { type: 'audio', hasVideo: false },
    ]);
  });
  it.each(['hls', 'mp4'])('honors the audio preference using %s rendition track metadata', (type) => {
    const item = { has_video: true, playback_type: 'mp4', playback_url: 'https://cdn.test/video.mp4',
      media_renditions: [{ type, has_video: false, url: `https://cdn.test/audio.${type}` }] };
    expect(resolvePlaybackSources(item, native, { prefer_audio_when_available: true })[0]?.hasVideo).toBe(false);
    expect(resolvePlaybackSources(item, native, { prefer_audio_when_available: false })[0]?.hasVideo).toBe(true);
  });
  it('retains selected rendition evidence for audio-only HLS/MP4 and video PODCASTs', () => {
    const sources = resolvePlaybackSources({ has_video: false, media_renditions: [
      { type: 'hls', url: 'https://cdn.test/audio.m3u8', has_video: false },
      { type: 'mp4', url: 'https://cdn.test/picture.mp4', has_video: true },
    ] }, native);
    expect(sources.map((s) => s.hasVideo)).toEqual([false, true]);
    expect(resolvePlaybackSources({ playback_url: 'https://cdn.test/video.mp4', has_video: true,
      fallback_playback_url: 'https://cdn.test/audio.mp4', fallback_playback_type: 'mp4', fallback_has_video: false }, native)[1]?.hasVideo).toBe(false);
  });
  it('uses native HLS before declared fallbacks', () => {
    expect(resolvePlaybackSources({
      playback_url: 'https://cdn.test/item.m3u8',
      playback_type: 'hls',
      fallback_playback_url: 'https://cdn.test/item.mp4',
    }, native)).toEqual([
      { url: 'https://cdn.test/item.m3u8', type: 'hls', adapter: 'native-hls', reason: 'primary', hasVideo: true },
      { url: 'https://cdn.test/item.mp4', type: 'mp4', adapter: 'element', reason: 'fallback', hasVideo: true },
    ]);
  });

  it('uses managed HLS only when native support is absent', () => {
    expect(resolvePlaybackSources({ playback_url: 'https://cdn.test/item.m3u8', playback_type: 'hls' }, managedOnly))
      .toEqual([{ url: 'https://cdn.test/item.m3u8', type: 'hls', adapter: 'managed-hls', reason: 'primary', hasVideo: true }]);
  });

  it('skips unsupported manifests and selects the declared fallback', () => {
    expect(resolvePlaybackSources({
      playback_url: 'https://cdn.test/item.m3u8',
      playback_type: 'hls',
      fallback_playback_url: 'https://cdn.test/item.mp4',
    }, noHls)).toEqual([
      { url: 'https://cdn.test/item.mp4', type: 'mp4', adapter: 'element', reason: 'fallback', hasVideo: true },
    ]);
  });

  it('keeps audio canonical even when it has artwork and no video', () => {
    expect(resolvePlaybackSources({
      playback_url: 'https://cdn.test/item.mp3',
      playback_type: 'audio',
      has_video: false,
    }, noHls)).toEqual([
      { url: 'https://cdn.test/item.mp3', type: 'audio', adapter: 'element', reason: 'primary', hasVideo: false },
    ]);
  });

  it('deduplicates URLs and never creates a source from empty metadata', () => {
    expect(resolvePlaybackSources({
      playback_url: ' https://cdn.test/item.mp4 ',
      playback_type: 'mp4',
      fallback_playback_url: 'https://cdn.test/item.mp4',
      media_renditions: [{ type: 'mp4', url: 'https://cdn.test/item.mp4', is_primary: true }],
    }, noHls)).toEqual([
      { url: 'https://cdn.test/item.mp4', type: 'mp4', adapter: 'element', reason: 'primary', hasVideo: true },
    ]);
    expect(resolvePlaybackSources({}, noHls)).toEqual([]);
  });
});
