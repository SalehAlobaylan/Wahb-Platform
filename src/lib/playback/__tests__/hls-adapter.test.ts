const mockDestroy = jest.fn();
const mockLoadSource = jest.fn();
const mockAttachMedia = jest.fn();
let errorListener: ((event: unknown, data: { fatal: boolean }) => void) | undefined;
const mockOn = jest.fn((_event: unknown, listener: (event: unknown, data: { fatal: boolean }) => void) => {
  errorListener = listener;
});
const MockHls = jest.fn(() => ({
  on: mockOn,
  loadSource: mockLoadSource,
  attachMedia: mockAttachMedia,
  destroy: mockDestroy,
}));
Object.assign(MockHls, {
  isSupported: jest.fn(() => true),
  Events: { ERROR: 'error' },
});

jest.mock('hls.js', () => ({ __esModule: true, default: MockHls }));

import { attachManagedHls } from '@/lib/playback/hls-adapter';

describe('managed HLS adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    errorListener = undefined;
    ((MockHls as unknown as { isSupported: jest.Mock }).isSupported).mockReturnValue(true);
  });

  it('lazily attaches its manifest and destroys exactly once on fatal error', async () => {
    const onFatal = jest.fn();
    const media = document.createElement('video');
    const attachment = await attachManagedHls(media, 'https://cdn.test/media.m3u8', onFatal);

    expect(mockLoadSource).toHaveBeenCalledWith('https://cdn.test/media.m3u8');
    expect(mockAttachMedia).toHaveBeenCalledWith(media);
    errorListener?.('error', { fatal: false });
    expect(onFatal).not.toHaveBeenCalled();

    errorListener?.('error', { fatal: true });
    attachment.destroy();
    expect(onFatal).toHaveBeenCalledTimes(1);
    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });

  it('fails before attaching when managed HLS is unavailable', async () => {
    ((MockHls as unknown as { isSupported: jest.Mock }).isSupported).mockReturnValue(false);

    await expect(attachManagedHls(document.createElement('video'), 'https://cdn.test/media.m3u8', jest.fn()))
      .rejects.toThrow('managed_hls_not_supported');
    expect(mockAttachMedia).not.toHaveBeenCalled();
  });
});
