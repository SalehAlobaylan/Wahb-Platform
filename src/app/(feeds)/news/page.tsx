'use client';

import { useRef, useCallback, useEffect, useMemo } from 'react';
import { useNewsFeed } from '@/lib/hooks';
import { useFeedStore } from '@/lib/stores';
import { FeedContainer, NewsSlide, NewsSlideSkeleton, ViewTracker } from '@/components/feed';
import { FeedSwitcher } from '@/components/layout';
import { FeedErrorFallback } from '@/components/error-boundary';
import type { ContentItem, NewsSlide as NewsSlideType } from '@/types';

export default function NewsPage() {
    const feedRef = useRef<HTMLDivElement>(null);
    const { activeIndex, setActiveIndex, resetProgress } = useFeedStore();

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

    // Show loading state
    const showLoading = isLoading;

    // Show error state
    if (isError) {
        return (
            <div className="h-full w-full bg-[#f8f5f2]">
                <FeedErrorFallback
                    onRetry={() => refetch()}
                    message={error?.message || 'Failed to load news feed'}
                />
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-hidden relative">
            {/* Header with feed switcher */}
            <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
                <div className="flex justify-between items-center p-4 pt-6">
                    <div className="pointer-events-auto">
                        <span className="text-xl font-black tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                            WAHB
                        </span>
                    </div>

                    <div className="pointer-events-auto">
                        <FeedSwitcher variant="light" />
                    </div>

                    <div className="w-16" /> {/* Spacer for balance */}
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
                    <div className="h-20 flex items-center justify-center bg-[#f8f5f2]">
                        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    </div>
                )}
            </FeedContainer>
        </div>
    );
}
