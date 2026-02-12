'use client';

import { useRef, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useForYouFeed, useLikeMutation, useBookmarkMutation } from '@/lib/hooks';
import { useFeedStore } from '@/lib/stores';
import { FeedContainer, ForYouCard, ForYouSkeleton, ViewTracker, DraggableBottomSheet, BottomSheetTabs } from '@/components/feed';
import { FeedSwitcher } from '@/components/layout';
import { FeedErrorFallback } from '@/components/error-boundary';
import { Search, Bookmark, User, Heart, MessageCircle, Share2, RotateCcw, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    const feedRef = useRef<HTMLDivElement>(null);
    const {
        activeIndex, setActiveIndex, resetProgress, progress,
        likedIds, bookmarkedIds,
        isFastSwiping, setFastSwiping, setBackoffUntil,
    } = useFeedStore();

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

    // Combine all pages of data
    const forYouItems = useMemo(() => {
        if (!data?.pages) return [];
        return data.pages.flatMap((page) => page.items);
    }, [data]);

    // Current active item — drives the fixed bottom sheet
    const activeItem = forYouItems[activeIndex] ?? null;
    const isLiked = activeItem ? likedIds.has(activeItem.id) : false;
    const isBookmarked = activeItem ? bookmarkedIds.has(activeItem.id) : false;

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
                activeIndex,
                forYouItems,
                adaptiveBuffer.prefetchDepth
            );
        }
    }, [activeIndex, forYouItems]);

    // ── Throttled scroll handler ─────────────────────────────────────────
    const rawHandleScroll = useCallback(() => {
        if (!feedRef.current) return;

        const scrollPosition = feedRef.current.scrollTop;
        const height = feedRef.current.clientHeight;
        const scrollHeight = feedRef.current.scrollHeight;
        const newIndex = Math.round(scrollPosition / height);

        if (activeIndex !== newIndex) {
            setActiveIndex(newIndex);
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
    }, [activeIndex, setActiveIndex, resetProgress, hasNextPage, isFetchingNextPage, fetchNextPage, isFastSwiping]);

    // Wrap with throttle (fires at most once per 200ms)
    const handleScroll = useMemo(
        () => throttleScroll(rawHandleScroll, 200),
        [rawHandleScroll]
    );

    // Reset scroll on mount
    useEffect(() => {
        if (feedRef.current) {
            feedRef.current.scrollTop = 0;
            setActiveIndex(0);
            resetProgress();
        }
    }, [setActiveIndex, resetProgress]);

    const handleLike = () => {
        if (!activeItem) return;
        likeMutation.mutate({ contentId: activeItem.id, isLiked });
    };

    const handleBookmark = () => {
        if (!activeItem) return;
        bookmarkMutation.mutate({ contentId: activeItem.id, isBookmarked });
    };

    const handleShare = async () => {
        if (!activeItem) return;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: activeItem.title,
                    text: activeItem.excerpt || activeItem.body_text,
                    url: window.location.href,
                });
            } catch {
                // User cancelled or error
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
        }
    };

    // Show loading state
    const showLoading = isLoading;

    // Show error state
    if (isError) {
        return (
            <div className="h-full w-full bg-background">
                <FeedErrorFallback
                    onRetry={() => refetch()}
                    message={error?.message || 'Failed to load feed'}
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
                        <div className="w-9 h-9 rounded-full bg-bronze/40 flex items-center justify-center border border-white/20 hover:border-white/40 transition-all">
                            <User className="w-4.5 h-4.5 text-white" />
                        </div>
                    </Link>

                    {/* Feed switcher (center) */}
                    <div className="pointer-events-auto">
                        <FeedSwitcher variant="dark" />
                    </div>

                    {/* Search + Bookmark */}
                    <div className="pointer-events-auto flex items-center gap-3">
                        <button
                            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all"
                            aria-label="Search"
                        >
                            <Search className="w-4.5 h-4.5 text-white" />
                        </button>
                        <Link href="/saved">
                            <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all">
                                <Bookmark className="w-4.5 h-4.5 text-white" />
                            </div>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Feed content */}
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
                                isActive={index === activeIndex}
                            />
                        </ViewTracker>
                    ))
                )}

                {/* Loading more indicator */}
                {isFetchingNextPage && (
                    <div className="h-20 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-bronze/30 border-t-bronze rounded-full animate-spin" />
                    </div>
                )}
            </FeedContainer>

            {/* ── Fixed Progress Bar ─────────────────────────────── */}
            <div className="absolute bottom-[80px] left-0 right-0 h-1 bg-white/10 z-30">
                <div
                    className="h-full bg-bronze transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(168,134,105,0.5)]"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* ── Fixed Draggable Bottom Sheet ──────────────────── */}
            {activeItem && (
                <DraggableBottomSheet
                    minHeight={80}
                    maxHeight={480}
                    defaultHeight={80}
                    expandedContent={
                        <BottomSheetTabs
                            commentCount={activeItem.comment_count}
                            hasTranscript={!!activeItem.transcript_id}
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
                            aria-label="Like"
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                isLiked ? "bg-bronze" : "bg-muted/50 hover:bg-muted"
                            )}>
                                <Heart className={cn("w-5 h-5", isLiked ? "text-white fill-white" : "text-foreground")} />
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium">{activeItem.like_count}</span>
                        </button>

                        {/* Comment */}
                        <button
                            className="flex flex-col items-center gap-1"
                            aria-label="Comment"
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
                            aria-label="Bookmark"
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                isBookmarked ? "bg-bronze" : "bg-muted/50 hover:bg-muted"
                            )}>
                                <Bookmark className={cn("w-5 h-5", isBookmarked ? "text-white fill-white" : "text-foreground")} />
                            </div>
                        </button>

                        {/* Share */}
                        <button
                            onClick={handleShare}
                            className="flex flex-col items-center gap-1"
                            aria-label="Share"
                        >
                            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-all">
                                <Share2 className="w-5 h-5 text-foreground" />
                            </div>
                        </button>

                        {/* Rewind */}
                        <button
                            className="flex flex-col items-center gap-1"
                            aria-label="Rewind"
                        >
                            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-all">
                                <RotateCcw className="w-4 h-4 text-foreground" />
                            </div>
                            <span className="text-[10px] text-muted-foreground">15s</span>
                        </button>

                        {/* Create / Upload */}
                        <button
                            className="flex flex-col items-center gap-1"
                            aria-label="Create"
                        >
                            <div className="w-10 h-10 rounded-full bg-bronze/80 flex items-center justify-center hover:bg-bronze transition-all shadow-lg shadow-bronze/30">
                                <Plus className="w-5 h-5 text-white" />
                            </div>
                        </button>
                    </div>
                </DraggableBottomSheet>
            )}
        </div>
    );
}
