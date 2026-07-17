export type PaginationDecision = 'admitted' | 'coalesced' | 'fast_swipe' | 'backed_off' | 'token_limited';

export class PaginationAdmission {
  private tokens: number;
  private lastRefill: number;
  private inFlight = false;
  private backoffUntil = 0;
  private consecutiveBackoffs = 0;

  constructor(
    private readonly capacity = 3,
    private readonly refillPerSecond = 1,
    now = Date.now(),
  ) {
    this.tokens = capacity;
    this.lastRefill = now;
  }

  admit({ fastSwiping, fetching, now = Date.now() }: { fastSwiping: boolean; fetching: boolean; now?: number }): PaginationDecision {
    if (fetching || this.inFlight) return 'coalesced';
    if (fastSwiping) return 'fast_swipe';
    if (now < this.backoffUntil) return 'backed_off';
    this.tokens = Math.min(this.capacity, this.tokens + ((now - this.lastRefill) / 1000) * this.refillPerSecond);
    this.lastRefill = now;
    if (this.tokens < 1) return 'token_limited';
    this.tokens -= 1;
    this.inFlight = true;
    return 'admitted';
  }

  success(): void {
    this.inFlight = false;
    this.consecutiveBackoffs = 0;
  }

  failure(status?: number, retryAfterMs?: number, now = Date.now()): void {
    this.inFlight = false;
    if (status !== 429) return;
    this.consecutiveBackoffs += 1;
    const fallback = 2_000 * 2 ** Math.min(this.consecutiveBackoffs - 1, 5);
    this.backoffUntil = now + Math.max(0, retryAfterMs ?? fallback);
  }
}
