import type Hls from 'hls.js';

export interface ManagedHlsAttachment {
  destroy(): void;
}

export interface ManagedHlsTelemetry {
  event: 'level_switched' | 'stall' | 'fatal_fallback';
  level?: number;
  detail?: string;
}

/** HLS.js is loaded only by a non-native HLS candidate, never during SSR. */
export async function attachManagedHls(
  media: HTMLMediaElement,
  source: string,
  onFatalError: () => void,
  onTelemetry?: (event: ManagedHlsTelemetry) => void,
): Promise<ManagedHlsAttachment> {
  const { default: HlsConstructor } = await import('hls.js');
  if (!HlsConstructor.isSupported()) throw new Error('managed_hls_not_supported');

  // Pods retains only a short media window. These bounded buffers stop HLS.js
  // from competing with the transcript/audio surfaces for memory on mobile.
  const hls: Hls = new HlsConstructor({
    enableWorker: true,
    maxBufferLength: 30,
    maxMaxBufferLength: 60,
    backBufferLength: 15,
    maxBufferSize: 24_000_000,
    capLevelToPlayerSize: true,
  });
  let destroyed = false;
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    hls.destroy();
  };

  hls.on(HlsConstructor.Events.ERROR, (_event, data) => {
    const detail = typeof data.details === 'string' ? data.details : undefined;
    if (detail?.toLowerCase().includes('buffer') || detail?.toLowerCase().includes('stall')) {
      onTelemetry?.({ event: 'stall', detail });
    }
    if (!data.fatal) return;
    onTelemetry?.({ event: 'fatal_fallback', detail });
    destroy();
    onFatalError();
  });
  if (HlsConstructor.Events.LEVEL_SWITCHED) {
    hls.on(HlsConstructor.Events.LEVEL_SWITCHED, (_event, data) => {
      onTelemetry?.({ event: 'level_switched', level: typeof data.level === 'number' ? data.level : undefined });
    });
  }
  hls.loadSource(source);
  hls.attachMedia(media);
  return { destroy };
}
