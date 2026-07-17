import type Hls from 'hls.js';

export interface ManagedHlsAttachment {
  destroy(): void;
}

/** HLS.js is loaded only by a non-native HLS candidate, never during SSR. */
export async function attachManagedHls(
  media: HTMLMediaElement,
  source: string,
  onFatalError: () => void,
): Promise<ManagedHlsAttachment> {
  const { default: HlsConstructor } = await import('hls.js');
  if (!HlsConstructor.isSupported()) throw new Error('managed_hls_not_supported');

  const hls: Hls = new HlsConstructor({ enableWorker: true });
  let destroyed = false;
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    hls.destroy();
  };

  hls.on(HlsConstructor.Events.ERROR, (_event, data) => {
    if (!data.fatal) return;
    destroy();
    onFatalError();
  });
  hls.loadSource(source);
  hls.attachMedia(media);
  return { destroy };
}
