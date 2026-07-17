/**
 * Feed Scroll & Swipe Optimization Utilities
 *
 * 1. throttleScroll      — RAF-based scroll throttle (≤ 1 call / 200ms)
 * 2. SwipeSpeedDetector  — detects fast swiping, suppresses prefetch
 * 3. ProgressivePrefetch — lightweight connection hints near-visible media
 * 4. AdaptiveBuffer      — limits concurrent downloads & prefetch depth
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
    let trailingTimer: ReturnType<typeof setTimeout> | null = null;

    return () => {
        // Always schedule a trailing call so the last scroll event is never lost
        // (critical for snap scrolling where events stop after the snap animation)
        if (trailingTimer) clearTimeout(trailingTimer);
        trailingTimer = setTimeout(() => {
            trailingTimer = null;
            callback();
        }, intervalMs);

        if (rafId !== null) return;

        rafId = requestAnimationFrame(() => {
            const now = performance.now();
            if (now - lastTime >= intervalMs) {
                lastTime = now;
                // Cancel trailing since we just fired
                if (trailingTimer) {
                    clearTimeout(trailingTimer);
                    trailingTimer = null;
                }
                callback();
            }
            rafId = null;
        });
    };
}

// ─── 2. Swipe Speed Detector ────────────────────────────────────────────────

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

// ─── 3. Progressive Prefetch ────────────────────────────────────────────────

/**
 * Manages lightweight connection hints for near-visible media. Avoid
 * `<link rel="preload" as="video">` here: browsers may pull full media files
 * on metered mobile connections before the user ever reaches the card.
 */
export class ProgressivePrefetch {
    private activeLinkMap = new Map<string, HTMLLinkElement>();

    /**
     * Update which items should have their media preloaded.
     * @param activeIndex current visible item
     * @param items      array of objects with `id` and optional playback URLs
     * @param depth      how many items ahead/behind to preload (default 2)
     */
    update(
        activeIndex: number,
        items: Array<{ id: string; media_url?: string | null; playback_url?: string | null; fallback_playback_url?: string | null }>,
        depth = 2
    ) {
        const keepIds = new Set<string>();

        for (let i = activeIndex - 1; i <= activeIndex + depth; i++) {
            const item = items[i];
            const href = item?.playback_url || item?.media_url || item?.fallback_playback_url;
            if (!href) continue;

            keepIds.add(item.id);

            if (!this.activeLinkMap.has(item.id)) {
                const url = new URL(href, window.location.href);
                const link = document.createElement('link');
                link.rel = 'preconnect';
                link.href = url.origin;
                link.crossOrigin = 'anonymous';
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

// ─── 4. Adaptive Buffer Manager ─────────────────────────────────────────────

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
