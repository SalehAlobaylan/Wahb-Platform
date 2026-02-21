'use client';

import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useNewsFeed } from '@/lib/hooks';
import { useFeedStore } from '@/lib/stores';
import { useNowPlayingStore } from '@/lib/stores/now-playing-store';
import {
    FeedContainer,
    NewsSlide,
    NewsSlideSkeleton,
    ViewTracker,
    DraggableBottomSheet,
    NewsBottomSheetContent,
} from '@/components/feed';
import { FeedSwitcher } from '@/components/layout';
import { FeedErrorFallback } from '@/components/error-boundary';
import { User, Search, Bookmark, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContentItem, NewsSlide as NewsSlideType } from '@/types';

export default function NewsPage() {
    const feedRef = useRef<HTMLDivElement>(null);
    const { activeIndex, setActiveIndex, resetProgress } = useFeedStore();
    const setBottomSheetMounted = useNowPlayingStore((s) => s.setBottomSheetMounted);

    const [isBookmarked, setIsBookmarked] = useState(false);

    // Tell global store a bottom-sheet lives here
    useEffect(() => {
        setBottomSheetMounted(true);
        return () => setBottomSheetMounted(false);
    }, [setBottomSheetMounted]);

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
    } = useNewsFeed();

    // Combine all pages of data
    const newsSlides = useMemo(() => {
        if (!data?.pages) return [];
        return data.pages.flatMap((page) => page.slides);
    }, [data]);

    // Active slide data
    const activeSlide = newsSlides[activeIndex];
    const activeFeatured = activeSlide?.featured;

    // Handle scroll to detect active item and load more
    const handleScroll = useCallback(() => {
        if (feedRef.current) {
            const scrollPosition = feedRef.current.scrollTop;
            const height = feedRef.current.clientHeight;
            const scrollHeight = feedRef.current.scrollHeight;
            const newIndex = Math.round(scrollPosition / height);

            if (activeIndex !== newIndex) {
                setActiveIndex(newIndex);
                resetProgress();
            }

            // Load more when near bottom (infinite scroll)
            if (
                hasNextPage &&
                !isFetchingNextPage &&
                scrollPosition + height >= scrollHeight - height * 2
            ) {
                fetchNextPage();
            }
        }
    }, [activeIndex, setActiveIndex, resetProgress, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Reset scroll on mount
    useEffect(() => {
        if (feedRef.current) {
            feedRef.current.scrollTop = 0;
            setActiveIndex(0);
            resetProgress();
        }
    }, [setActiveIndex, resetProgress]);

    const handleOpenArticle = (item: ContentItem) => {
        // TODO: Open article modal or navigate to article page
        console.log('Open article:', item);
    };

    const handleBookmark = () => setIsBookmarked((p) => !p);
    const handleShare = () => {
        if (navigator.share && activeFeatured) {
            navigator.share({ title: activeFeatured.title, url: window.location.href }).catch(() => { });
        }
    };

    // Show loading state
    const showLoading = isLoading;

    // Show error state
    if (isError) {
        return (
            <div className="h-full w-full bg-[#0a0a0a]">
                <FeedErrorFallback
                    onRetry={() => refetch()}
                    message={error?.message || 'Failed to load news feed'}
                />
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-hidden relative bg-[#0a0a0a]">
            {/* Header — cinematic style */}
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

                    {/* Search */}
                    <div className="pointer-events-auto">
                        <Link href="/search">
                            <div
                                className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all"
                                aria-label="Search"
                            >
                                <Search className="w-4.5 h-4.5 text-white" />
                            </div>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Feed content */}
            <FeedContainer ref={feedRef} onScroll={handleScroll}>
                {showLoading ? (
                    // Loading skeletons
                    <>
                        <NewsSlideSkeleton />
                        <NewsSlideSkeleton />
                    </>
                ) : (
                    // News Feed slides with view tracking
                    newsSlides.map((slide, index) => (
                        <ViewTracker key={slide.slide_id} contentId={slide.featured.id} className="h-full w-full snap-start">
                            <NewsSlide
                                slide={slide}
                                isActive={index === activeIndex}
                                onOpenArticle={handleOpenArticle}
                            />
                        </ViewTracker>
                    ))
                )}

                {/* Loading more indicator */}
                {isFetchingNextPage && (
                    <div className="h-20 flex items-center justify-center bg-[#0a0a0a]">
                        <div className="w-8 h-8 border-2 border-bronze/30 border-t-bronze rounded-full animate-spin" />
                    </div>
                )}
            </FeedContainer>

            {/* ── News Draggable Bottom Sheet ─────────────────── */}
            {activeFeatured && (
                <DraggableBottomSheet
                    minHeight={80}
                    maxHeight={550}
                    defaultHeight={80}
                    className="bg-[#141414]/95 border-t-white/5 rounded-t-[2rem] shadow-[0_-15px_50px_rgba(0,0,0,0.8)]"
                    expandedContent={
                        <NewsBottomSheetContent />
                    }
                >
                    {/* Collapsed content — action buttons */}
                    <div className="flex items-center justify-around w-full">
                        {/* Bookmark */}
                        <button
                            onClick={handleBookmark}
                            className="flex flex-col items-center gap-1"
                            aria-label="Bookmark"
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                isBookmarked ? "bg-bronze" : "bg-white/10 hover:bg-white/15"
                            )}>
                                <Bookmark className={cn("w-5 h-5", isBookmarked ? "text-white fill-white" : "text-white")} />
                            </div>
                        </button>

                        {/* Share */}
                        <button
                            onClick={handleShare}
                            className="flex flex-col items-center gap-1"
                            aria-label="Share"
                        >
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/15 transition-all">
                                <Share2 className="w-5 h-5 text-white" />
                            </div>
                        </button>
                    </div>
                </DraggableBottomSheet>
            )}
        </div>
    );
}
