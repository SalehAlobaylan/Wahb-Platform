'use client';

import { Suspense, useRef, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { usePodsFeed, usePodsFeedFreshness, useLikeMutation, useBookmarkMutation } from '@/lib/hooks';
import { useFeedStore, useNowPlayingStore, useAuthStore } from '@/lib/stores';
import { useShallow } from 'zustand/react/shallow';
import { FeedContainer, PodsCard, PodsSkeleton, ViewTracker, DraggableBottomSheet, BottomSheetTabs, PullToRefresh } from '@/components/feed';
import type { DraggableBottomSheetHandle } from '@/components/feed/draggable-bottom-sheet';
import { FeedSwitcher } from '@/components/layout';
import { FeedErrorFallback } from '@/components/error-boundary';
import { Search, Bookmark, User, Heart, MessageCircle, RotateCcw, Plus, Clock3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPlaybackUrl } from '@/lib/utils/playback';
import { useTranslations } from '@/lib/i18n';
import { adjustedLikeCount } from '@/lib/utils/engagement';
import {
    throttleScroll,
    SwipeSpeedDetector,
    ProgressivePrefetch,
    AdaptiveBuffer,
} from '@/lib/scroll-optimizer';
import { PaginationAdmission } from '@/lib/feed-window/pagination-admission';
import type { ContentItem } from '@/types';
import type { PodsDurationPreference } from '@/lib/api/feeds';
import { useFeedLoadTelemetry, usePaginationTelemetry } from '@/lib/experience/use-feed-telemetry';

const durationOptions: PodsDurationPreference[] = [5, 10, 15, 20, 30, 40];

function parseDurationPreference(raw: string | null): PodsDurationPreference | null {
    const value = Number(raw);
    return durationOptions.includes(value as PodsDurationPreference) ? value as PodsDurationPreference : null;
}

function DurationPreferenceSelector({
    value,
    onChange,
}: {
    value: PodsDurationPreference | null;
    onChange: (value: PodsDurationPreference | null) => void;
}) {
    const t = useTranslations();
    return (
        <div className="pointer-events-auto flex max-w-[calc(100vw-1.5rem)] items-center gap-1 overflow-x-auto rounded-full border border-white/15 bg-black/35 p-1 text-white shadow-lg backdrop-blur-md">
            <button
                type="button"
                onClick={() => onChange(null)}
                aria-label={t('pods.duration.all')}
                className={cn(
                    'flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-semibold transition-colors',
                    value === null ? 'bg-white text-black' : 'text-white/80 hover:bg-white/15'
                )}
            >
                <Clock3 className="h-3.5 w-3.5" />
            </button>
            {durationOptions.map((option) => (
                <button
                    key={option}
                    type="button"
                    onClick={() => onChange(option)}
                    aria-label={t('pods.duration.minutes', { duration: option })}
                    className={cn(
                        'h-8 min-w-10 rounded-full px-2 text-xs font-semibold tabular-nums transition-colors',
                        value === option ? 'bg-white text-black' : 'text-white/80 hover:bg-white/15'
                    )}
                >
                    {option}m
                </button>
            ))}
        </div>
    );
}

function PlaybackProgressBar() {
    const progress = useFeedStore((s) => s.progress);
    return (
        <div className="absolute bottom-[80px] inset-x-0 h-1 bg-white/10 z-30">
            <div
                className="h-full bg-news-accent transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(230,57,70,0.5)]"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}

export default function PodsPage() {
    return (
        <Suspense
            fallback={
                <div className="h-full w-full overflow-hidden relative">
                    <FeedContainer>
                        <PodsSkeleton />
                        <PodsSkeleton />
                    </FeedContainer>
                </div>
            }
        >
            <PodsPageContent />
        </Suspense>
    );
}

function PodsPageContent() {
    const feedRef = useRef<HTMLDivElement>(null);
    const activeAnchorIdRef = useRef<string | null>(null);
    const renderedItemIdsRef = useRef<string[]>([]);
    const paginationAdmissionRef = useRef(new PaginationAdmission());
    const adaptiveBufferRef = useRef(new AdaptiveBuffer());
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated } = useAuthStore();
    const {
        podsActiveIndex, setPodsActiveIndex, resetProgress,
        isPlaying, globalPaused,
        lastActivePodsItemId, setLastActivePodsItemId,
        likedIds, bookmarkedIds,
        isFastSwiping, setFastSwiping,
    } = useFeedStore(
        useShallow((s) => ({
            podsActiveIndex: s.podsActiveIndex,
            setPodsActiveIndex: s.setPodsActiveIndex,
            resetProgress: s.resetProgress,
            isPlaying: s.isPlaying,
            globalPaused: s.globalPaused,
            lastActivePodsItemId: s.lastActivePodsItemId,
            setLastActivePodsItemId: s.setLastActivePodsItemId,
            likedIds: s.likedIds,
            bookmarkedIds: s.bookmarkedIds,
            isFastSwiping: s.isFastSwiping,
            setFastSwiping: s.setFastSwiping,
        }))
    );
    const searchParams = useSearchParams();
    const durationPreference = useMemo(
        () => parseDurationPreference(searchParams.get('duration')),
        [searchParams]
    );
    const t = useTranslations();

    // API hooks
    const {
        data,
        status,
        isLoading,
        isError,
        error,
        refetch,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = usePodsFeed(durationPreference);

    const likeMutation = useLikeMutation();
    const bookmarkMutation = useBookmarkMutation();
	const activeSessionId = data?.pages[0]?.session_id;
	const freshness = usePodsFeedFreshness(activeSessionId);

    // Combine all pages; dedupe by id so cursor overlap does not duplicate keys
    const podsItems = useMemo(() => {
        if (!data?.pages) return [];
        const seen = new Set<string>();
        const out: ContentItem[] = [];
        for (const page of data.pages) {
            for (const item of page.items) {
                if (!seen.has(item.id)) {
                    seen.add(item.id);
                    out.push(item);
                }
            }
        }
        return out;
    }, [data]);

    // RUX: emit the Pods feed-load journey terminal (rendered/empty/failed)
    // once per fresh load; a duration switch re-arms via loadKey.
    useFeedLoadTelemetry({
        surface: 'pods',
        status,
        unitCount: podsItems.length,
        renderedContentID: podsItems[0]?.id,
        loadKey: durationPreference ?? 'all',
    });

    // RUX: pagination journey. Arm when a next-page fetch begins; on completion,
    // received if new units arrived, starved if none arrived while more were
    // expected (a genuine pagination gap, not the end of the feed).
    const paginationTelemetry = usePaginationTelemetry('pods');
    const prevFetchingNextRef = useRef(false);
    const preFetchCountRef = useRef(0);
    useEffect(() => {
        if (isFetchingNextPage && !prevFetchingNextRef.current) {
            preFetchCountRef.current = podsItems.length;
            paginationTelemetry.arm();
        } else if (!isFetchingNextPage && prevFetchingNextRef.current) {
            if (podsItems.length > preFetchCountRef.current) paginationTelemetry.received();
            else if (hasNextPage) paginationTelemetry.starved();
            else paginationTelemetry.received();
        }
        prevFetchingNextRef.current = isFetchingNextPage;
    }, [isFetchingNextPage, podsItems.length, hasNextPage, paginationTelemetry]);

    const setDurationPreference = useCallback((duration: PodsDurationPreference | null) => {
        const params = new URLSearchParams(Array.from(searchParams.entries()));
        if (duration) params.set('duration', String(duration));
        else params.delete('duration');
        activeAnchorIdRef.current = null;
        renderedItemIdsRef.current = [];
        setPodsActiveIndex(0);
        resetProgress();
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, [pathname, resetProgress, router, searchParams, setPodsActiveIndex]);

    // Current active item — drives the fixed bottom sheet
    const activeItem = podsItems[podsActiveIndex] ?? null;
    const isLiked = activeItem ? likedIds.has(activeItem.id) : false;
    const isBookmarked = activeItem ? bookmarkedIds.has(activeItem.id) : false;

    useEffect(() => {
        if (activeItem?.id) {
            activeAnchorIdRef.current = activeItem.id;
            setLastActivePodsItemId(activeItem.id);
        }
    }, [activeItem?.id, setLastActivePodsItemId]);

    // TanStack may evict the first query page as it appends the next one. Keep
    // the visible content ID as the source of truth and correct its new array
    // position before paint; an obsolete absolute index would otherwise snap to
    // a different card or clamp at the end of the shortened list.
    useLayoutEffect(() => {
        if (podsItems.length === 0) return;
        const itemIds = podsItems.map((item) => item.id);
        const windowChanged = itemIds.length !== renderedItemIdsRef.current.length ||
            itemIds.some((id, index) => id !== renderedItemIdsRef.current[index]);
        renderedItemIdsRef.current = itemIds;
        if (!windowChanged) {
            activeAnchorIdRef.current = podsItems[podsActiveIndex]?.id ?? activeAnchorIdRef.current;
            return;
        }
        const anchorId = activeAnchorIdRef.current ?? lastActivePodsItemId;
        const anchoredIndex = anchorId ? podsItems.findIndex((item) => item.id === anchorId) : -1;
        const nextIndex = anchoredIndex >= 0
            ? anchoredIndex
            : Math.min(Math.max(0, podsActiveIndex), podsItems.length - 1);
        const container = feedRef.current;
        if (container && container.clientHeight > 0) {
            const targetTop = nextIndex * container.clientHeight;
            if (Math.abs(container.scrollTop - targetTop) > 1) container.scrollTop = targetTop;
        }
        activeAnchorIdRef.current = podsItems[nextIndex]?.id ?? null;
        if (nextIndex !== podsActiveIndex) setPodsActiveIndex(nextIndex);
    }, [podsActiveIndex, podsItems, lastActivePodsItemId, setPodsActiveIndex]);

    // Sync server-side interaction flags into the local sets so like/bookmark
    // icons reflect reality (e.g. interactions made in a previous session).
    useEffect(() => {
        if (podsItems.length === 0) return;
        useFeedStore.getState().seedInteractions(
            podsItems.filter((i) => i.is_liked).map((i) => i.id),
            podsItems.filter((i) => i.is_bookmarked).map((i) => i.id),
            podsItems.map((i) => i.id)
        );
    }, [podsItems]);

    // Now Playing — register metadata so the bar shows on other pages
    const setCurrentFromPods = useNowPlayingStore((s) => s.setCurrentFromPods);
    const handoffToGlobalAudio = useNowPlayingStore((s) => s.handoffToGlobalAudio);
    const videoTimeRef = useRef(0);
    const [showSeekMenu, setShowSeekMenu] = useState(false);
    const sheetRef = useRef<DraggableBottomSheetHandle>(null);
    const rewindButtonRef = useRef<HTMLDivElement>(null);
    const rewindPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rewindLongPressTriggeredRef = useRef(false);
    const hasRestoredScrollRef = useRef(false);
    const shouldResumeOnHandoffRef = useRef(true);

    // ── Scroll optimization refs (stable across renders) ─────────────────
    const swipeDetectorRef = useRef<SwipeSpeedDetector | null>(null);
    const prefetchRef = useRef<ProgressivePrefetch | null>(null);

    // Initialize optimization instances on mount
    useEffect(() => {
        swipeDetectorRef.current = new SwipeSpeedDetector(3, 1000, 800, (fast) => {
            setFastSwiping(fast);
            adaptiveBufferRef.current.setFastSwiping(fast);
        });
        prefetchRef.current = new ProgressivePrefetch();

        return () => {
            swipeDetectorRef.current?.dispose();
            prefetchRef.current?.dispose();
        };
    }, [setFastSwiping]);

    // Update progressive prefetch when active index or items change
    useEffect(() => {
        if (prefetchRef.current && podsItems.length > 0) {
            prefetchRef.current.update(
                podsActiveIndex,
                podsItems,
                adaptiveBufferRef.current.prefetchDepth
            );
        }
    }, [podsActiveIndex, podsItems]);

    const requestNextPage = useCallback(() => {
        if (!hasNextPage) return;
        const admission = paginationAdmissionRef.current;
        if (admission.admit({ fastSwiping: isFastSwiping, fetching: isFetchingNextPage }) !== 'admitted') return;
        void fetchNextPage()
            .then((result) => {
                if (result.isError) {
                    const error = result.error as { status?: number; retryAfterMs?: number } | null;
                    admission.failure(error?.status, error?.retryAfterMs);
                } else {
                    admission.success();
                }
            })
            .catch((error: { status?: number; retryAfterMs?: number }) => {
                admission.failure(error?.status, error?.retryAfterMs);
            });
    }, [fetchNextPage, hasNextPage, isFastSwiping, isFetchingNextPage]);

    // ── Throttled scroll handler ─────────────────────────────────────────
    const rawHandleScroll = useCallback(() => {
        if (!feedRef.current) return;

        const scrollPosition = feedRef.current.scrollTop;
        const height = feedRef.current.clientHeight;
        const scrollHeight = feedRef.current.scrollHeight;
        const newIndex = Math.round(scrollPosition / height);

        if (podsActiveIndex !== newIndex) {
            activeAnchorIdRef.current = podsItems[newIndex]?.id ?? null;
            setPodsActiveIndex(newIndex);
            resetProgress();

            // Record this swipe for speed detection
            swipeDetectorRef.current?.recordSwipe();
        }

        // All automatic pagination paths share one per-query admission state.
        const nearBottom = scrollPosition + height >= scrollHeight - height * 2;
        if (nearBottom) requestNextPage();
    }, [podsActiveIndex, podsItems, requestNextPage, setPodsActiveIndex, resetProgress]);

    // Wrap with throttle (fires at most once per 200ms)
    const handleScroll = useMemo(
        () => throttleScroll(rawHandleScroll, 200),
        [rawHandleScroll]
    );

    // When fast-swiping ends, re-check if we need to fetch more
    // (no scroll events fire after snap settles, so the scroll handler won't re-evaluate)
    useEffect(() => {
        if (isFastSwiping || !feedRef.current || !hasNextPage || isFetchingNextPage) return;
        const { scrollTop, clientHeight, scrollHeight } = feedRef.current;
        const nearBottom = scrollTop + clientHeight >= scrollHeight - clientHeight * 2;
        if (nearBottom) requestNextPage();
    }, [isFastSwiping, hasNextPage, isFetchingNextPage, requestNextPage]);

    useEffect(() => {
        shouldResumeOnHandoffRef.current = !globalPaused && isPlaying;
    }, [globalPaused, isPlaying]);

    // Restore scroll position once on mount
    useEffect(() => {
        if (!feedRef.current || hasRestoredScrollRef.current) return;
        if (podsItems.length === 0) return;
        if (feedRef.current.clientHeight <= 0) return;

        const idMatchedIndex = lastActivePodsItemId
            ? podsItems.findIndex((item) => item.id === lastActivePodsItemId)
            : -1;
        const preferredIndex = idMatchedIndex >= 0 ? idMatchedIndex : podsActiveIndex;
        const safeIndex = Math.min(Math.max(0, preferredIndex), Math.max(0, podsItems.length - 1));

        if (safeIndex !== podsActiveIndex) {
            setPodsActiveIndex(safeIndex);
        }

        feedRef.current.scrollTop = safeIndex * feedRef.current.clientHeight;
        hasRestoredScrollRef.current = true;
    }, [podsActiveIndex, podsItems, lastActivePodsItemId, setPodsActiveIndex]);

    // Deep-link support: /?item=<content_id>
    useEffect(() => {
        const targetItemId = searchParams.get('item');
        if (!targetItemId || !feedRef.current || podsItems.length === 0) return;

        const idx = podsItems.findIndex((item) => item.id === targetItemId);
        if (idx < 0) {
            requestNextPage();
            return;
        }

        if (podsActiveIndex !== idx) {
            setPodsActiveIndex(idx);
            resetProgress();
        }

        const targetTop = idx * feedRef.current.clientHeight;
        if (Math.abs(feedRef.current.scrollTop - targetTop) > 2) {
            feedRef.current.scrollTo({ top: targetTop, behavior: 'smooth' });
        }
    }, [searchParams, podsItems, podsActiveIndex, setPodsActiveIndex, resetProgress, requestNextPage]);

    // Register active item with the now-playing store (metadata only, no <audio> playback)
    useEffect(() => {
        if (activeItem && getPlaybackUrl(activeItem)) {
            setCurrentFromPods(activeItem, !globalPaused && isPlaying);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeItem?.id, globalPaused, isPlaying]);

    // On unmount (user leaves Pods page): hand off playback to <audio> provider
    useEffect(() => {
        return () => {
            const { currentItem } = useNowPlayingStore.getState();
            if (currentItem) {
                handoffToGlobalAudio(videoTimeRef.current, shouldResumeOnHandoffRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLike = () => {
        if (!activeItem) return;
        likeMutation.mutate({ contentId: activeItem.id, isLiked });
    };

    const handleBookmark = () => {
        if (!activeItem) return;
        bookmarkMutation.mutate({ contentId: activeItem.id, isBookmarked });
    };

    const handleOpenComments = () => {
        sheetRef.current?.expand();
    };

    const seekActiveVideo = useCallback((deltaSeconds: number) => {
        if (!feedRef.current || !activeItem) return;

        const activeVideo = Array.from(feedRef.current.querySelectorAll('video')).find(
            (video) => video.dataset.contentId === activeItem.id
        );

        if (!activeVideo) return;

        const duration = Number.isFinite(activeVideo.duration) ? activeVideo.duration : null;
        const upperBound = duration && duration > 0 ? Math.max(0, duration - 0.01) : Number.POSITIVE_INFINITY;
        const nextTime = Math.max(0, Math.min(activeVideo.currentTime + deltaSeconds, upperBound));

        activeVideo.currentTime = nextTime;
        videoTimeRef.current = nextTime;

        const nextProgress = duration && duration > 0 ? (nextTime / duration) * 100 : 0;
        useFeedStore.getState().setPodsPlayback(activeItem.id, nextTime, nextProgress);
        useFeedStore.getState().setProgress(nextProgress);
    }, [activeItem]);

    const startRewindPress = useCallback(() => {
        rewindLongPressTriggeredRef.current = false;
        if (rewindPressTimerRef.current) {
            clearTimeout(rewindPressTimerRef.current);
        }
        rewindPressTimerRef.current = setTimeout(() => {
            rewindLongPressTriggeredRef.current = true;
            setShowSeekMenu(true);
        }, 450);
    }, []);

    const endRewindPress = useCallback(() => {
        if (rewindPressTimerRef.current) {
            clearTimeout(rewindPressTimerRef.current);
            rewindPressTimerRef.current = null;
        }

        if (!rewindLongPressTriggeredRef.current) {
            seekActiveVideo(-15);
        }
    }, [seekActiveVideo]);

    const cancelRewindPress = useCallback(() => {
        if (rewindPressTimerRef.current) {
            clearTimeout(rewindPressTimerRef.current);
            rewindPressTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!showSeekMenu) return;

        const closeOnOutside = (event: MouseEvent | TouchEvent) => {
            if (!rewindButtonRef.current) return;
            if (!rewindButtonRef.current.contains(event.target as Node)) {
                setShowSeekMenu(false);
            }
        };

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowSeekMenu(false);
            }
        };

        window.addEventListener('mousedown', closeOnOutside);
        window.addEventListener('touchstart', closeOnOutside);
        window.addEventListener('keydown', closeOnEscape);

        return () => {
            window.removeEventListener('mousedown', closeOnOutside);
            window.removeEventListener('touchstart', closeOnOutside);
            window.removeEventListener('keydown', closeOnEscape);
        };
    }, [showSeekMenu]);

    // Show loading state
    const showLoading = isLoading;

    // Show error state
    if (isError) {
        return (
            <div className="h-full w-full bg-background">
                    <FeedErrorFallback
                        onRetry={() => refetch()}
                        message={error?.message || t('feed.error.pods')}
                    />
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-hidden relative">
            {/* Header — Profile | Feed Switcher | Search + Bookmark */}
            <header className="absolute top-0 inset-x-0 z-20 pointer-events-none bg-gradient-to-b from-black/70 to-transparent">
                <div className="flex justify-between items-center p-4 pt-6">
                    {/* Profile avatar */}
                    <Link href="/profile" className="pointer-events-auto">
                        <div className="w-9 h-9 rounded-full bg-news-accent/40 flex items-center justify-center border border-white/20 hover:border-white/40 transition-all">
                            {isAuthenticated && user ? (
                                <span className="text-sm font-bold text-white uppercase">{(user.username || user.email)[0]}</span>
                            ) : (
                                <User className="w-4.5 h-4.5 text-white" />
                            )}
                        </div>
                    </Link>

                    {/* Feed switcher (center) */}
                    <div className="pointer-events-auto">
                        <FeedSwitcher variant="dark" />
                    </div>

                    {/* Search */}
                    <div className="pointer-events-auto">
                        <Link href="/search">
                            <div
                                className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all"
                                aria-label={t('search.title')}
                            >
                                <Search className="w-4.5 h-4.5 text-white" />
                            </div>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="pointer-events-none absolute inset-x-0 top-[76px] z-20 flex justify-center px-3">
                <DurationPreferenceSelector
                    value={durationPreference}
                    onChange={setDurationPreference}
                />
            </div>
			{freshness.data && (
				<div className="pointer-events-none absolute inset-x-0 top-[122px] z-20 flex justify-center px-3">
					<button type="button" className="pointer-events-auto rounded-full bg-news-accent px-4 py-2 text-xs font-semibold text-white shadow-lg" onClick={() => void refetch()}>
						{t('pods.newContent')}
					</button>
				</div>
			)}

            {/* Feed content. PullToRefresh reads scrollTop from feedRef so it
                doesn't add a second scroll container; pulling down at the
                top of the first card invalidates the query and refetches. */}
            <PullToRefresh
                onRefresh={async () => {
                    await refetch();
                }}
                isRefreshing={isLoading}
                externalScrollRef={feedRef}
                className="h-full"
            >
                <FeedContainer ref={feedRef} onScroll={handleScroll}>
                    {showLoading ? (
                        <>
                            <PodsSkeleton />
                            <PodsSkeleton />
                        </>
                    ) : (
                        podsItems.map((item, index) => (
                            <ViewTracker key={item.id} contentId={item.id} className="h-full w-full snap-start snap-always">
                                <PodsCard
                                    item={item}
                                    isActive={index === podsActiveIndex}
                                    shouldLoadMedia={Math.abs(index - podsActiveIndex) <= adaptiveBufferRef.current.prefetchDepth}
                                    videoTimeRef={index === podsActiveIndex ? videoTimeRef : undefined}
                                />
                            </ViewTracker>
                        ))
                    )}

                    {!showLoading && podsItems.length === 0 && (
                        <div className="flex h-full w-full snap-start snap-always items-center justify-center bg-black px-6 text-center text-white">
                            <div>
                                <p className="text-lg font-semibold">
                                    {durationPreference
                                        ? t('pods.empty.duration', { duration: durationPreference })
                                        : t('pods.empty.title')}
                                </p>
                                <p className="mt-2 text-sm text-white/60">
                                    {t('pods.empty.body')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Loading more indicator */}
                    {isFetchingNextPage && (
                        <div className="h-20 flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-news-accent/30 border-t-news-accent rounded-full animate-spin" />
                        </div>
                    )}
                </FeedContainer>
            </PullToRefresh>

            {/* ── Fixed Progress Bar ─────────────────────────────── */}
            <PlaybackProgressBar />

            {/* ── Fixed Draggable Bottom Sheet ──────────────────── */}
            {activeItem && (
                <div className="news-page">
                    <DraggableBottomSheet
                        ref={sheetRef}
                        minHeight={80}
                        maxHeight={480}
                        defaultHeight={80}
                        expandedContent={
                            <BottomSheetTabs
                                commentCount={activeItem.comment_count}
                                hasTranscript={!!activeItem.transcript_id}
                                transcriptId={activeItem.transcript_id}
                                contentItemId={activeItem.id}
                                contentType={activeItem.type}
                                title={activeItem.title}
                                description={activeItem.excerpt || activeItem.body_text}
                                author={activeItem.author}
                                tags={activeItem.topic_tags}
                            />
                        }
                    >
                        {/* Horizontal action buttons row — data changes with active item */}
                        <div className="flex items-center justify-around w-full">
                            {/* Like */}
                            <button
                                onClick={handleLike}
                                className="flex flex-col items-center gap-1"
                                aria-label={t('profile.guest.feature.likes')}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                    isLiked ? "bg-news-accent" : "bg-muted/50 hover:bg-muted"
                                )}>
                                    <Heart className={cn("w-5 h-5", isLiked ? "text-white fill-white" : "text-foreground")} />
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium">{adjustedLikeCount(activeItem.like_count, activeItem.is_liked, isLiked)}</span>
                            </button>

                            {/* Comment */}
                            <button
                                onClick={handleOpenComments}
                                className="flex flex-col items-center gap-1"
                                aria-label={t('news.badge.reaction')}
                            >
                                <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-all">
                                    <MessageCircle className="w-5 h-5 text-foreground" />
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium">{activeItem.comment_count}</span>
                            </button>

                            {/* Bookmark */}
                            <button
                                onClick={handleBookmark}
                                className="flex flex-col items-center gap-1"
                                aria-label={t('saved.title')}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                    isBookmarked ? "bg-news-accent" : "bg-muted/50 hover:bg-muted"
                                )}>
                                    <Bookmark className={cn("w-5 h-5", isBookmarked ? "text-white fill-white" : "text-foreground")} />
                                </div>
                            </button>

                            {/* Create — kept in the sheet so it never obscures feed content in RTL/LTR. */}
                            <Link
                                href="/create"
                                className="flex flex-col items-center gap-1"
                                aria-label={t('create.action')}
                            >
                                <div className="w-10 h-10 rounded-full bg-news-accent flex items-center justify-center transition-all hover:bg-news-accent/90 active:scale-95">
                                    <Plus className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium">{t('create.action')}</span>
                            </Link>

                            {/* Rewind */}
                            <div ref={rewindButtonRef} className="relative">
                                <button
                                    className="flex flex-col items-center gap-1"
                                    aria-label={t('pods.seek.backSeconds', { count: 15 })}
                                    onPointerDown={startRewindPress}
                                    onPointerUp={endRewindPress}
                                    onPointerCancel={cancelRewindPress}
                                    onPointerLeave={cancelRewindPress}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            seekActiveVideo(-15);
                                        }
                                    }}
                                >
                                    <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-all">
                                        <RotateCcw className="w-4 h-4 text-foreground" />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">{t('pods.seek.backSeconds', { count: 15 })}</span>
                                </button>

                                {showSeekMenu && (
                                    <div className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in-95 duration-150">
                                        <div className="rounded-xl border border-border/70 bg-card/95 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.25)] p-1.5">
                                            <div className="flex items-center gap-1">
                                            <button
                                                className="rounded-lg px-2.5 py-2 text-xs whitespace-nowrap hover:bg-muted/60"
                                                onClick={() => {
                                                    seekActiveVideo(60);
                                                    setShowSeekMenu(false);
                                                }}
                                            >
                                                {t('pods.seek.forwardMinute')}
                                            </button>
                                            <button
                                                className="rounded-lg px-2.5 py-2 text-xs whitespace-nowrap hover:bg-muted/60"
                                                onClick={() => {
                                                    seekActiveVideo(15);
                                                    setShowSeekMenu(false);
                                                }}
                                            >
                                                {t('pods.seek.forward', { count: 15 })}
                                            </button>
                                            <button
                                                className="rounded-lg px-2.5 py-2 text-xs whitespace-nowrap hover:bg-muted/60"
                                                onClick={() => {
                                                    seekActiveVideo(-60);
                                                    setShowSeekMenu(false);
                                                }}
                                            >
                                                {t('pods.seek.back')}
                                            </button>
                                            </div>
                                        </div>
                                        <div className="mx-auto mt-[-1px] h-2.5 w-2.5 rotate-45 border-r border-b border-border/70 bg-card/95" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </DraggableBottomSheet>
                </div>
            )}
        </div>
    );
}
