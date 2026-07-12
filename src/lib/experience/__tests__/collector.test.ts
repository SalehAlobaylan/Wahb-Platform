import {
  __getCollectorStateForTest,
  __resetCollectorForTest,
  emitEvent,
  flush,
  initCollector,
} from '../collector';

// jsdom has no Response/Blob-for-beacon; build a minimal fetch response stub.
function mockResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe('RUX collector', () => {
  beforeEach(() => {
    __resetCollectorForTest();
    sessionStorage.clear();
    jest.restoreAllMocks();
  });

  it('assigns a stable page_load_id and monotonic sequence', () => {
    initCollector();
    emitEvent({ event_type: 'session_started', surface: 'foryou' });
    emitEvent({ event_type: 'feed_requested', surface: 'foryou' });
    const s = __getCollectorStateForTest();
    expect(s.pageLoadId).not.toBe('');
    expect(s.sequence).toBe(2); // two events consumed two sequence numbers
  });

  it('flushes a critical event immediately (no timer wait)', () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      mockResponse(200, { accepted: 1 })
    );
    initCollector();
    emitEvent({ event_type: 'playback_failed', surface: 'foryou', measurements: { failure_class: 'media_error' } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/experience/events');
    expect((opts as RequestInit).keepalive).toBe(true);
  });

  it('does not flush a single non-critical success event synchronously', () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse(200, {}));
    initCollector();
    emitEvent({ event_type: 'playback_started', surface: 'foryou' });
    // The event is buffered (waiting for the 5s timer / batch), not delivered.
    expect(__getCollectorStateForTest().queueLength).toBe(1);
  });

  it('goes quiet for the session when the server reports disabled', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse(200, { disabled: true }));
    initCollector();
    emitEvent({ event_type: 'feed_failed', surface: 'foryou' }); // critical → flush
    // let the async deliver() + json() chain settle
    await new Promise((r) => setTimeout(r, 0));
    emitEvent({ event_type: 'feed_requested', surface: 'foryou' });
    const s = __getCollectorStateForTest();
    expect(s.disabled).toBe(true);
    expect(s.queueLength).toBe(0);
  });

  it('never throws even if the batch body is odd', () => {
    initCollector();
    expect(() => flush(true)).not.toThrow(); // empty queue beacon path
  });
});
