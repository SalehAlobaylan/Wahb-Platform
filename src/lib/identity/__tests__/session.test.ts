import { getAnonymousSessionId } from '@/lib/identity/session';
import { identityCacheKey, resetIdentityCacheKeyForTests } from '@/lib/identity/identity-key';

describe('anonymous session identity', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    resetIdentityCacheKeyForTests();
  });

  it('creates one stable identity per browser tab', () => {
    const first = getAnonymousSessionId();
    const second = getAnonymousSessionId();

    expect(first).toBeTruthy();
    expect(second).toBe(first);
    expect(window.sessionStorage.getItem('wahb_session_id')).toBe(first);
  });

  it('uses verified users and otherwise the tab-scoped anonymous identity for cache keys', () => {
    expect(identityCacheKey('user-123')).toMatch(/^authenticated:/);
    expect(identityCacheKey('user-123')).not.toContain('user-123');
    expect(identityCacheKey()).toBe(`anonymous:${getAnonymousSessionId()}`);
  });
  it('uses a fresh anonymous identity after a managed restart', () => {
    const original = process.env.NEXT_PUBLIC_WAHB_RUNTIME_ID;
    try {
      process.env.NEXT_PUBLIC_WAHB_RUNTIME_ID = 'runtime-one';
      const first = getAnonymousSessionId();
      process.env.NEXT_PUBLIC_WAHB_RUNTIME_ID = 'runtime-two';
      const second = getAnonymousSessionId();
      expect(second).not.toBe(first);
      expect(getAnonymousSessionId()).toBe(second);
    } finally {
      if (original === undefined) delete process.env.NEXT_PUBLIC_WAHB_RUNTIME_ID;
      else process.env.NEXT_PUBLIC_WAHB_RUNTIME_ID = original;
    }
  });

});
