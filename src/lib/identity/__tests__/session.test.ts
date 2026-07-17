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
});
