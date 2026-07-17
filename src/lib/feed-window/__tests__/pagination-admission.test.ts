import { PaginationAdmission } from '@/lib/feed-window/pagination-admission';

describe('PaginationAdmission', () => {
  it('coalesces competing requests and refills its per-query token budget', () => {
    const admission = new PaginationAdmission(1, 1, 0);
    expect(admission.admit({ fastSwiping: false, fetching: false, now: 0 })).toBe('admitted');
    expect(admission.admit({ fastSwiping: false, fetching: false, now: 0 })).toBe('coalesced');
    admission.success();
    expect(admission.admit({ fastSwiping: false, fetching: false, now: 0 })).toBe('token_limited');
    expect(admission.admit({ fastSwiping: false, fetching: false, now: 1_000 })).toBe('admitted');
  });

  it('suppresses fast swipes and honors explicit or exponential 429 backoff', () => {
    const admission = new PaginationAdmission(3, 1, 0);
    expect(admission.admit({ fastSwiping: true, fetching: false, now: 0 })).toBe('fast_swipe');
    expect(admission.admit({ fastSwiping: false, fetching: false, now: 0 })).toBe('admitted');
    admission.failure(429, 5_000, 0);
    expect(admission.admit({ fastSwiping: false, fetching: false, now: 4_999 })).toBe('backed_off');
    expect(admission.admit({ fastSwiping: false, fetching: false, now: 5_000 })).toBe('admitted');
  });
});
