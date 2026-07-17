jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('next/server', () => ({
  NextResponse: { json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }) },
}));

import { POST as refresh } from '@/app/api/auth/refresh/route';
import { POST as clearSession } from '@/app/api/auth/session/clear/route';
import { cookies } from 'next/headers';

const mockCookies = cookies as jest.Mock;

describe('auth refresh route', () => {
  const cookieStore = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    process.env.IAM_API_URL = 'http://iam.test';
    mockCookies.mockResolvedValue(cookieStore);
    cookieStore.get.mockReturnValue({ value: 'refresh-cookie' });
    cookieStore.set.mockReset();
    cookieStore.delete.mockReset();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete process.env.IAM_API_URL;
  });

  function request(): Request {
    return {
      url: 'http://wahb.test/api/auth/refresh',
      headers: new Headers({ origin: 'http://wahb.test', 'sec-fetch-site': 'same-origin' }),
    } as Request;
  }

  it('does not clear a shared session after a losing rotation response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 401 });

    const response = await refresh(request());

    expect(response.status).toBe(401);
    expect(cookieStore.delete).not.toHaveBeenCalled();
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it('does not persist or clear cookies for a malformed rotation response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ access_token: 'only-one-token' }) });

    const response = await refresh(request());

    expect(response.status).toBe(502);
    expect(cookieStore.delete).not.toHaveBeenCalled();
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it('persists only a complete replacement token pair', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'new-access', refresh_token: 'new-refresh', expires_in: 60 }),
    });

    const response = await refresh(request());

    expect(response.status).toBe(200);
    expect(cookieStore.set).toHaveBeenCalledTimes(3);
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });

  it('clears cookies only on the exact same-origin session-clear route', async () => {
    const response = await clearSession(request());

    expect(response.status).toBe(200);
    expect(cookieStore.delete).toHaveBeenCalledTimes(3);
  });

  it('rejects cross-origin session clearing', async () => {
    const response = await clearSession({
      url: 'http://wahb.test/api/auth/session/clear',
      headers: new Headers({ origin: 'http://sibling.wahb.test', 'sec-fetch-site': 'same-site' }),
    } as Request);

    expect(response.status).toBe(403);
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });
});
