import { isExactSameOrigin, readBoundedBody, readBoundedResponseBody } from '@/lib/auth/request-policy';

function request(url: string, headers: Record<string, string> = {}): Request {
  return { url, headers: new Headers(headers) } as Request;
}

describe('state-changing request policy', () => {
  it('accepts exact same-origin browser requests', () => {
    expect(isExactSameOrigin(request('https://wahb.example/api/auth/logout', {
      origin: 'https://wahb.example', 'sec-fetch-site': 'same-origin',
    }))).toBe(true);
  });

  it('rejects missing, sibling-origin, and cross-origin requests', () => {
    expect(isExactSameOrigin(request('https://wahb.example/api/auth/logout'))).toBe(false);
    expect(isExactSameOrigin(request('https://wahb.example/api/auth/logout', {
      origin: 'https://admin.wahb.example', 'sec-fetch-site': 'same-site',
    }))).toBe(false);
    expect(isExactSameOrigin(request('https://wahb.example/api/auth/logout', {
      origin: 'https://attacker.example',
    }))).toBe(false);
  });

  it('rejects declared and chunked body overflow before forwarding', async () => {
    const declared = request('https://wahb.example/api/content/submit', { 'content-length': '11' });
    await expect(readBoundedBody(declared, 10)).resolves.toBeNull();

    const cancel = jest.fn();
    const chunked = {
      headers: new Headers(),
      body: {
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({ done: false, value: new Uint8Array(6) })
            .mockResolvedValueOnce({ done: false, value: new Uint8Array(6) }),
          cancel,
          releaseLock: jest.fn(),
        }),
      },
    } as unknown as Request;
    await expect(readBoundedBody(chunked, 10)).resolves.toBeNull();
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('returns a bounded body unchanged', async () => {
    const chunk = new Uint8Array([1, 2, 3]);
    const requestWithBody = {
      headers: new Headers(),
      body: {
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({ done: false, value: chunk })
            .mockResolvedValueOnce({ done: true }),
          cancel: jest.fn(),
          releaseLock: jest.fn(),
        }),
      },
    } as unknown as Request;
    await expect(readBoundedBody(requestWithBody, 10)).resolves.toEqual(chunk.buffer);
  });

  it('cancels an oversized chunked upstream response before parsing', async () => {
    const cancel = jest.fn();
    const response = {
      headers: new Headers(),
      body: {
        getReader: () => ({
          read: jest.fn().mockResolvedValueOnce({ done: false, value: new Uint8Array(11) }),
          cancel,
          releaseLock: jest.fn(),
        }),
      },
    } as unknown as Response;
    await expect(readBoundedResponseBody(response, 10)).resolves.toBeNull();
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
