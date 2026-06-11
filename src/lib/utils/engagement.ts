/**
 * Display-time adjustment for engagement counts.
 *
 * Like state is optimistic (a locally-persisted id set flips immediately) but
 * feed caches are deliberately NOT invalidated on like/unlike — refetching
 * every page on each tap disrupted scroll. That left the rendered count
 * frozen: the heart fills but the number doesn't move until a natural
 * refetch. Deriving the count at render closes that gap without touching
 * the cache: server count, +1 when the user liked something the server
 * doesn't know about yet, -1 when they un-liked something it still counts.
 */
export function adjustedLikeCount(
    baseCount: number | undefined,
    serverLiked: boolean | undefined,
    localLiked: boolean
): number {
    const base = baseCount ?? 0;
    if (localLiked === !!serverLiked) return base;
    return Math.max(0, base + (localLiked ? 1 : -1));
}
