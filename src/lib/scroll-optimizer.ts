/**
 * Feed Scroll & Swipe Optimization Utilities
 *
 * 1. throttleScroll      — RAF-based scroll throttle (≤ 1 call / 200ms)
 * 2. TokenBucket         — rate limiter for network fetches
 * 3. SwipeSpeedDetector  — detects fast swiping, suppresses prefetch
 * 4. ProgressivePrefetch — metadata-first, then media when near-visible
 * 5. BackoffManager      — respects 429 / Retry-After from server
 * 6. AdaptiveBuffer      — limits concurrent downloads & prefetch depth
 */

// ─── 1. Throttled Scroll ────────────────────────────────────────────────────

/**
 * Returns a scroll handler that fires at most once per `intervalMs` by
 * combining requestAnimationFrame with a timestamp guard.
 */
export function throttleScroll(
    callback: () => void,
    intervalMs = 200
): () => void {
    let lastTime = 0;
    let rafId: number | null = null;

    return () => {
        if (rafId !== null) return;

        rafId = requestAnimationFrame(() => {
            const now = performance.now();
            if (now - lastTime >= intervalMs) {
                lastTime = now;
                callback();
            }
            rafId = null;
        });
    };
}

// ─── 2. Token Bucket Rate Limiter ───────────────────────────────────────────

export class TokenBucket {
    private tokens: number;
    private lastRefill: number;

    constructor(
        private capacity = 3,
        private refillRate = 1, // tokens per second
    ) {
        this.tokens = capacity;
        this.lastRefill = performance.now();
    }

    /** Refills tokens based on elapsed time, capped at capacity. */
    private refill() {
        const now = performance.now();
        const elapsed = (now - this.lastRefill) / 1000;
        this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
        this.lastRefill = now;
    }

    /** Returns true and consumes a token if available. */
    tryConsume(): boolean {
        this.refill();
        if (this.tokens >= 1) {
            this.tokens -= 1;
            return true;
        }
        return false;
    }

    /** Current token count (for debugging). */
    get available() {
        this.refill();
        return Math.floor(this.tokens);
    }
}

// ─── 3. Swipe Speed Detector ────────────────────────────────────────────────

export class SwipeSpeedDetector {
    private timestamps: number[] = [];
    private idleTimer: ReturnType<typeof setTimeout> | null = null;

    /** true while the user is swiping faster than threshold */
    isFastSwiping = false;

    constructor(
        /** Number of index changes within windowMs to trigger fast-swipe */
        private threshold = 3,
        /** Time window for counting swipes (ms) */
        private windowMs = 1000,
        /** How long to wait before declaring "idle" (ms) */
        private idleMs = 800,
        /** Called when fast-swipe state changes */
        private onChange?: (fast: boolean) => void,
    ) { }

    /** Call this every time the active index changes. */
    recordSwipe() {
        const now = performance.now();
        this.timestamps.push(now);

        // Prune old timestamps outside window
        const cutoff = now - this.windowMs;
        this.timestamps = this.timestamps.filter((t) => t >= cutoff);

        const wasFast = this.isFastSwiping;
        this.isFastSwiping = this.timestamps.length >= this.threshold;

        if (this.isFastSwiping !== wasFast) {
            this.onChange?.(this.isFastSwiping);
        }

        // Reset idle timer
        if (this.idleTimer) clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => {
            if (this.isFastSwiping) {
                this.isFastSwiping = false;
                this.timestamps = [];
                this.onChange?.(false);
            }
        }, this.idleMs);
    }

    dispose() {
        if (this.idleTimer) clearTimeout(this.idleTimer);
    }
}

// ─── 4. Progressive Prefetch ────────────────────────────────────────────────

/**
 * Manages media preload links. Only preloads media for items within
 * a window of the active index; cleans up elements that scroll away.
 */
export class ProgressivePrefetch {
    private activeLinkMap = new Map<string, HTMLLinkElement>();

    /**
     * Update which items should have their media preloaded.
     * @param activeIndex current visible item
     * @param items      array of objects with `id` and optional `media_url`
     * @param depth      how many items ahead/behind to preload (default 2)
     */
    update(
        activeIndex: number,
        items: Array<{ id: string; media_url?: string | null }>,
        depth = 2
    ) {
        const keepIds = new Set<string>();

        for (let i = activeIndex - 1; i <= activeIndex + depth; i++) {
            const item = items[i];
            if (!item?.media_url) continue;

            keepIds.add(item.id);

            if (!this.activeLinkMap.has(item.id)) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'video';
                link.href = item.media_url;
                document.head.appendChild(link);
                this.activeLinkMap.set(item.id, link);
            }
        }

        // Remove preloads for items that scrolled out of window
        for (const [id, link] of this.activeLinkMap) {
            if (!keepIds.has(id)) {
                link.remove();
                this.activeLinkMap.delete(id);
            }
        }
    }

    /** Remove all preload links. */
    dispose() {
        for (const link of this.activeLinkMap.values()) {
            link.remove();
        }
        this.activeLinkMap.clear();
    }
}

// ─── 5. Backoff Manager ─────────────────────────────────────────────────────

/**
 * Tracks server-side rate-limiting signals (429 / Retry-After).
 * All automatic loads should call `canProceed()` before firing.
 */
export class BackoffManager {
    /** Timestamp (ms) until which auto-loads are paused. */
    backoffUntil = 0;

    private baseInterval = 2000; // 2s default backoff
    private consecutiveBackoffs = 0;

    /** Returns true if we are NOT in a backoff period. */
    canProceed(): boolean {
        return Date.now() >= this.backoffUntil;
    }

    /** Remaining wait time in ms, or 0 if not backing off. */
    get remainingMs(): number {
        return Math.max(0, this.backoffUntil - Date.now());
    }

    /**
     * Call when you receive a 429 or Retry-After response.
     * @param retryAfterSec value from Retry-After header (seconds), or undefined
     */
    recordThrottle(retryAfterSec?: number) {
        this.consecutiveBackoffs += 1;
        const wait =
            retryAfterSec != null
                ? retryAfterSec * 1000
                : this.baseInterval * Math.pow(2, Math.min(this.consecutiveBackoffs - 1, 5));

        this.backoffUntil = Date.now() + wait;
    }

    /** Call on a successful response to reset the backoff counter. */
    recordSuccess() {
        this.consecutiveBackoffs = 0;
    }
}

// ─── 6. Adaptive Buffer Manager ─────────────────────────────────────────────

/**
 * Limits concurrent media downloads and adjusts prefetch depth
 * based on whether the user is swiping fast.
 */
export class AdaptiveBuffer {
    private activeDownloads = new Set<string>();

    /** Max concurrent downloads (reduced during fast swipe). */
    get maxConcurrent(): number {
        return this.fastSwiping ? 1 : 2;
    }

    /** How many items ahead to prefetch (reduced during fast swipe). */
    get prefetchDepth(): number {
        return this.fastSwiping ? 0 : 2;
    }

    constructor(private fastSwiping = false) { }

    setFastSwiping(fast: boolean) {
        this.fastSwiping = fast;

        // If we just entered fast mode and have too many downloads,
        // the caller should cancel the excess — we just signal the limit.
    }

    /** Returns true if a new download is allowed. */
    canStartDownload(id: string): boolean {
        if (this.activeDownloads.has(id)) return false; // already in progress
        return this.activeDownloads.size < this.maxConcurrent;
    }

    /** Mark a download as started. */
    startDownload(id: string) {
        this.activeDownloads.add(id);
    }

    /** Mark a download as finished (success or cancelled). */
    endDownload(id: string) {
        this.activeDownloads.delete(id);
    }

    /** Number of active downloads. */
    get activeCount(): number {
        return this.activeDownloads.size;
    }
}
