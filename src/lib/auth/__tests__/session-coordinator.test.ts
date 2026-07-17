import {
  refreshSession,
  resetSessionCoordinatorForTests,
  sessionCoordinatorTestKeys,
} from '@/lib/auth/session-coordinator';

describe('session coordinator', () => {
  beforeEach(() => {
    resetSessionCoordinatorForTests();
    global.fetch = jest.fn();
    Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
  });

  it('coalesces concurrent refresh callers into one request', async () => {
    let resolve!: (value: { ok: boolean }) => void;
    (global.fetch as jest.Mock).mockReturnValue(new Promise<{ ok: boolean }>((done) => { resolve = done; }));

    const first = refreshSession();
    const second = refreshSession();
    expect(global.fetch).toHaveBeenCalledTimes(1);

    resolve({ ok: true });
    await expect(first).resolves.toBe(true);
    await expect(second).resolves.toBe(true);
  });

  it('uses an available Web Lock as the elected refresh owner', async () => {
    const request = jest.fn(async (_name, _options, callback) => callback({}));
    Object.defineProperty(navigator, 'locks', { configurable: true, value: { request } });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    await expect(refreshSession()).resolves.toBe(true);
    expect(request).toHaveBeenCalledWith('wahb-session-refresh-v1', { ifAvailable: true }, expect.any(Function));
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('waits for a peer result when a live storage lease belongs to another tab', async () => {
    localStorage.setItem(sessionCoordinatorTestKeys.lease, JSON.stringify({
      version: 1,
      owner: 'other-tab',
      expiresAt: Date.now() + 10_000,
    }));

    const pending = refreshSession();
    await Promise.resolve();
    window.dispatchEvent(new StorageEvent('storage', {
      key: sessionCoordinatorTestKeys.result,
      newValue: JSON.stringify({
        version: 1,
        type: 'refresh-complete',
        owner: 'other-tab',
        success: true,
        completedAt: Date.now(),
      }),
    }));

    await expect(pending).resolves.toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('treats refresh failure as a non-terminal coordination failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    await expect(refreshSession()).resolves.toBe(false);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('lets only a terminal elected refresh clear local cookies', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({ ok: true });

    await expect(refreshSession()).resolves.toBe(false);
    expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/auth/session/clear', { method: 'POST' });
  });
});
