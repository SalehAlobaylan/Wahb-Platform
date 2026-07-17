import { createDraftStorageKey } from '@/lib/identity/draft-storage';
import { resetIdentityCacheKeyForTests } from '@/lib/identity/identity-key';

describe('draft storage identity partition', () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetIdentityCacheKeyForTests();
  });

  it('uses anonymous session and opaque authenticated partitions without raw user ids', () => {
    const anonymous = createDraftStorageKey(null);
    const authenticated = createDraftStorageKey('user-visible-id');

    expect(anonymous).toMatch(/^wahb_create_draft:anonymous:/);
    expect(authenticated).toMatch(/^wahb_create_draft:authenticated:/);
    expect(authenticated).not.toContain('user-visible-id');
    expect(authenticated).not.toBe(anonymous);
  });
});
