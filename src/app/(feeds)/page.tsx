'use client';

import { Suspense, useRef, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForYouFeed, useLikeMutation, useBookmarkMutation } from '@/lib/hooks';
import { useFeedStore, useNowPlayingStore, useAuthStore } from '@/lib/stores';
import { FeedContainer, ForYouCard, ForYouSkeleton, ViewTracker, DraggableBottomSheet, BottomSheetTabs, PullToRefresh } from '@/components/feed';
import type { DraggableBottomSheetHandle } from '@/components/feed/draggable-bottom-sheet';
import { FeedSwitcher } from '@/components/layout';
import { FeedErrorFallback } from '@/components/error-boundary';
import { Search, Bookmark, User, Heart, MessageCircle, RotateCcw, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';
import {
    throttleScroll,
    TokenBucket,
    SwipeSpeedDetector,
    ProgressivePrefetch,
    BackoffManager,
    AdaptiveBuffer,
} from '@/lib/scroll-optimizer';
import type { ContentItem } from '@/types';

// ── Module-level singletons (survive re-renders, reset on HMR) ──────────────
const tokenBucket = new TokenBucket(3, 1);
const backoffMgr = new BackoffManager();
const adaptiveBuffer = new AdaptiveBuffer();

export default function ForYouPage() {
    return (
        <Suspense
            fallback={
                <div className="h-full w-full overflow-hidden relative">
                    <FeedContainer>
                        <ForYouSkeleton />
                        <ForYouSkeleton />
                    </FeedContainer>
                </div>
            }
        >
            <ForYouPageContent />
        </Suspense>
    );
}

function ForYouPageContent() {
    const feedRef = useRef<HTMLDivElement>(null);
    const { user, isAuthenticated } = useAuthStore();
    const {
        forYouActiveIndex, setForYouActiveIndex, resetProgress, progress,
        isPlaying, globalPaused,
        lastActiveForYouItemId, setLastActiveForYouItemId,
        likedIds, bookmarkedIds,
        isFastSwiping, setFastSwiping,
    } = useFeedStore();
    const searchParams = useSearchParams();
    const t = useTranslations();

    // API hooks
    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useForYouFeed();

    const likeMutation = useLikeMutation();
    const bookmarkMutation = useBookmarkMutation();

    // Combine all pages; dedupe by id so cursor overlap does not duplicate keys
    const forYouItems = useMemo(() => {
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

    // Current active item — drives the fixed bottom sheet
    const activeItem = forYouItems[forYouActiveIndex] ?? null;
    const isLiked = activeItem ? likedIds.has(activeItem.id) : false;
    const isBookmarked = activeItem ? bookmarkedIds.has(activeItem.id) : false;

    useEffect(() => {
        if (activeItem?.id) {
            setLastActiveForYouItemId(activeItem.id);
        }
    }, [activeItem?.id, setLastActiveForYouItemId]);

    // Now Playing — register metadata so the bar shows on other pages
    const setCurrentFromVideo = useNowPlayingStore((s) => s.setCurrentFromVideo);
    const handoffToAudio = useNowPlayingStore((s) => s.handoffToAudio);
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
            adaptiveBuffer.setFastSwiping(fast);
        });
        prefetchRef.current = new ProgressivePrefetch();

        return () => {
            swipeDetectorRef.current?.dispose();
            prefetchRef.current?.dispose();
        };
    }, [setFastSwiping]);

    // Update progressive prefetch when active index or items change
    useEffect(() => {
        if (prefetchRef.current && forYouItems.length > 0) {
            prefetchRef.current.update(
                forYouActiveIndex,
                forYouItems,
                adaptiveBuffer.prefetchDepth
            );
        }
    }, [forYouActiveIndex, forYouItems]);

    // ── Throttled scroll handler ─────────────────────────────────────────
    const rawHandleScroll = useCallback(() => {
        if (!feedRef.current) return;

        const scrollPosition = feedRef.current.scrollTop;
        const height = feedRef.current.clientHeight;
        const scrollHeight = feedRef.current.scrollHeight;
        const newIndex = Math.round(scrollPosition / height);

        if (forYouActiveIndex !== newIndex) {
            setForYouActiveIndex(newIndex);
            resetProgress();

            // Record this swipe for speed detection
            swipeDetectorRef.current?.recordSwipe();
        }

        // Gated infinite scroll: token bucket + backoff + fast-swipe check
        const nearBottom = scrollPosition + height >= scrollHeight - height * 2;
        if (
            nearBottom &&
            hasNextPage &&
            !isFetchingNextPage &&
            !isFastSwiping &&
            backoffMgr.canProceed() &&
            tokenBucket.tryConsume()
        ) {
            fetchNextPage();
        }
    }, [forYouActiveIndex, setForYouActiveIndex, resetProgress, hasNextPage, isFetchingNextPage, fetchNextPage, isFastSwiping]);

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
        if (nearBottom && backoffMgr.canProceed() && tokenBucket.tryConsume()) {
            fetchNextPage();
        }
    }, [isFastSwiping, hasNextPage, isFetchingNextPage, fetchNextPage]);

    useEffect(() => {
        shouldResumeOnHandoffRef.current = !globalPaused && isPlaying;
    }, [globalPaused, isPlaying]);

    // Restore scroll position once on mount
    useEffect(() => {
        if (!feedRef.current || hasRestoredScrollRef.current) return;
        if (forYouItems.length === 0) return;
        if (feedRef.current.clientHeight <= 0) return;

        const idMatchedIndex = lastActiveForYouItemId
            ? forYouItems.findIndex((item) => item.id === lastActiveForYouItemId)
            : -1;
        const preferredIndex = idMatchedIndex >= 0 ? idMatchedIndex : forYouActiveIndex;
        const safeIndex = Math.min(Math.max(0, preferredIndex), Math.max(0, forYouItems.length - 1));

        if (safeIndex !== forYouActiveIndex) {
            setForYouActiveIndex(safeIndex);
        }

        feedRef.current.scrollTop = safeIndex * feedRef.current.clientHeight;
        hasRestoredScrollRef.current = true;
    }, [forYouActiveIndex, forYouItems, lastActiveForYouItemId, setForYouActiveIndex]);

    // Deep-link support: /?item=<content_id>
    useEffect(() => {
        const targetItemId = searchParams.get('item');
        if (!targetItemId || !feedRef.current || forYouItems.length === 0) return;

        const idx = forYouItems.findIndex((item) => item.id === targetItemId);
        if (idx < 0) {
            if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
            return;
        }

        if (forYouActiveIndex !== idx) {
            setForYouActiveIndex(idx);
            resetProgress();
        }

        const targetTop = idx * feedRef.current.clientHeight;
        if (Math.abs(feedRef.current.scrollTop - targetTop) > 2) {
            feedRef.current.scrollTo({ top: targetTop, behavior: 'smooth' });
        }
    }, [searchParams, forYouItems, forYouActiveIndex, setForYouActiveIndex, resetProgress, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Register active item with the now-playing store (metadata only, no <audio> playback)
    useEffect(() => {
        if (activeItem && activeItem.media_url) {
            setCurrentFromVideo(activeItem, !globalPaused && isPlaying);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeItem?.id, globalPaused, isPlaying]);

    // On unmount (user leaves For You page): hand off playback to <audio> provider
    useEffect(() => {
        return () => {
            const { currentItem } = useNowPlayingStore.getState();
            if (currentItem) {
                handoffToAudio(videoTimeRef.current, shouldResumeOnHandoffRef.current);
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
        useFeedStore.getState().setForYouPlayback(activeItem.id, nextTime, nextProgress);
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
                        message={error?.message || t('feed.error.foryou')}
                    />
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-hidden relative">
            {/* Header — Profile | Feed Switcher | Search + Bookmark */}
            <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none bg-gradient-to-b from-black/70 to-transparent">
                <div className="flex justify-between items-center p-4 pt-6">
                    {/* Profile avatar */}
                    <Link href="/profile" className="pointer-events-auto">
                        <div className="w-9 h-9 rounded-full bg-gold/40 flex items-center justify-center border border-white/20 hover:border-white/40 transition-all">
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
                            <ForYouSkeleton />
                            <ForYouSkeleton />
                        </>
                    ) : (
                        forYouItems.map((item, index) => (
                            <ViewTracker key={item.id} contentId={item.id} className="h-full w-full snap-start snap-always">
                                <ForYouCard
                                    item={item}
                                    isActive={index === forYouActiveIndex}
                                    videoTimeRef={index === forYouActiveIndex ? videoTimeRef : undefined}
                                />
                            </ViewTracker>
                        ))
                    )}

                    {/* Loading more indicator */}
                    {isFetchingNextPage && (
                        <div className="h-20 flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                        </div>
                    )}
                </FeedContainer>
            </PullToRefresh>

            {/* ── Fixed Progress Bar ─────────────────────────────── */}
            <div className="absolute bottom-[80px] left-0 right-0 h-1 bg-white/10 z-30">
                <div
                    className="h-full bg-gold transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(218,164,40,0.5)]"
                    style={{ width: `${progress}%` }}
                />
            </div>

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
                                <span className="text-[10px] text-muted-foreground font-medium">{activeItem.like_count}</span>
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

                            {/* Rewind */}
                            <div ref={rewindButtonRef} className="relative">
                                <button
                                    className="flex flex-col items-center gap-1"
                                aria-label={t('foryou.seek.back')}
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
                                    <span className="text-[10px] text-muted-foreground">{t('foryou.seek.forward', { count: 15 })}</span>
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
                                                {t('foryou.seek.forwardMinute')}
                                            </button>
                                            <button
                                                className="rounded-lg px-2.5 py-2 text-xs whitespace-nowrap hover:bg-muted/60"
                                                onClick={() => {
                                                    seekActiveVideo(15);
                                                    setShowSeekMenu(false);
                                                }}
                                            >
                                                {t('foryou.seek.forward', { count: 15 })}
                                            </button>
                                            <button
                                                className="rounded-lg px-2.5 py-2 text-xs whitespace-nowrap hover:bg-muted/60"
                                                onClick={() => {
                                                    seekActiveVideo(-60);
                                                    setShowSeekMenu(false);
                                                }}
                                            >
                                                {t('foryou.seek.back')}
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

            {/* ── Floating Action Button (Create/Plus) ───────────── */}
            <div className="absolute left-4 bottom-[calc(env(safe-area-inset-bottom)+8rem)] z-40 pointer-events-auto">
                <Link
                    href="/create"
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-gold hover:bg-gold/90 transition-all shadow-lg shadow-black/50 active:scale-95"
                    aria-label="Create Post"
                >
                    <Plus className="w-6 h-6 text-white" />
                </Link>
            </div>
        </div>
    );
}
