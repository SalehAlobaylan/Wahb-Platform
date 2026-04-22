'use client';

import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    ArticleReader,
} from '@/components/feed';
import { FeedSwitcher } from '@/components/layout';
import { FeedErrorFallback } from '@/components/error-boundary';
import { NowPlayingBar } from '@/components/now-playing-bar';
import { User, Search, Plus } from 'lucide-react';
import type { ContentItem, NewsSlide as NewsSlideType } from '@/types';

export default function NewsPage() {
    const feedRef = useRef<HTMLDivElement>(null);
    const { newsActiveIndex, setNewsActiveIndex, resetProgress } = useFeedStore();
    const setBottomSheetMounted = useNowPlayingStore((s) => s.setBottomSheetMounted);
    
    // Reader Overlay State
    const [selectedArticle, setSelectedArticle] = useState<ContentItem | null>(null);

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

    // Combine all pages of data and regroup into 1 featured + up to 3 related per slide
    const newsSlides = useMemo(() => {
        if (!data?.pages) return [];
        
        const allItems: ContentItem[] = [];
        data.pages.forEach((page) => {
            page.slides.forEach((slide) => {
                if (slide.featured) allItems.push(slide.featured);
                if (slide.related && slide.related.length > 0) {
                    allItems.push(...slide.related);
                }
            });
        });

        const groupedSlides: NewsSlideType[] = [];
        const chunkSize = 4;
        
        for (let i = 0; i < allItems.length; i += chunkSize) {
            const chunk = allItems.slice(i, i + chunkSize);
            if (chunk.length === 0) continue;
            
            const featured = chunk[0];
            const related = chunk.slice(1);
            
            groupedSlides.push({
                slide_id: `slide-${featured.id}-${i}`,
                featured,
                related,
            });
        }
        
        return groupedSlides;
    }, [data]);

    // Active slide data
    const activeSlide = newsSlides[newsActiveIndex];
    const activeFeatured = activeSlide?.featured;

    // Handle scroll to detect active item and load more
    const handleScroll = useCallback(() => {
        if (feedRef.current) {
            const scrollPosition = feedRef.current.scrollTop;
            const height = feedRef.current.clientHeight;
            const scrollHeight = feedRef.current.scrollHeight;
            const newIndex = Math.round(scrollPosition / height);

            if (newsActiveIndex !== newIndex) {
                setNewsActiveIndex(newIndex);
                resetProgress();
            }

            if (
                hasNextPage &&
                !isFetchingNextPage &&
                scrollPosition + height >= scrollHeight - height * 2
            ) {
                fetchNextPage();
            }
        }
    }, [newsActiveIndex, setNewsActiveIndex, resetProgress, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Reset scroll on mount
    useEffect(() => {
        if (feedRef.current) {
            feedRef.current.scrollTop = 0;
            setNewsActiveIndex(0);
            resetProgress();
        }
    }, [setNewsActiveIndex, resetProgress]);

    const handleOpenArticle = (item: ContentItem) => {
        setSelectedArticle(item);
    };

    const showLoading = isLoading;

    if (isError) {
        return (
            <div className="h-full w-full bg-background">
                <FeedErrorFallback
                    onRetry={() => refetch()}
                    message={error?.message || 'Failed to load news feed'}
                />
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-hidden relative bg-background news-page">
            {/* Header */}
            <header className="absolute top-0 inset-x-0 z-20 pointer-events-none pb-2 pt-2">
                <div className="flex justify-between items-center p-4">
                    <div className="flex items-center gap-3 pointer-events-auto text-foreground">
                        <Image src="/images/Wahb-logo-noblue-removebg.png" alt="Wahb Logo" width={32} height={32} className="object-contain dark:brightness-100 brightness-0" priority />
                        <Link href="/profile">
                            <div className="w-9 h-9 rounded-sm bg-secondary flex items-center justify-center border border-foreground/20 hover:border-foreground/40 transition-all">
                                <User className="w-4.5 h-4.5 text-foreground" />
                            </div>
                        </Link>
                    </div>
                    <div className="pointer-events-auto">
                        <FeedSwitcher variant="light" />
                    </div>
                    <div className="pointer-events-auto">
                        <Link href="/search">
                            <div className="w-9 h-9 rounded-sm bg-secondary flex items-center justify-center hover:bg-foreground/10 transition-all" aria-label="Search">
                                <Search className="w-4.5 h-4.5 text-foreground" />
                            </div>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Feed content */}
            <FeedContainer ref={feedRef} onScroll={handleScroll}>
                {showLoading ? (
                    <>
                        <NewsSlideSkeleton />
                        <NewsSlideSkeleton />
                    </>
                ) : (
                    newsSlides.map((slide, index) => (
                        <ViewTracker key={slide.slide_id} contentId={slide.featured.id} className="h-full w-full snap-start">
                            <NewsSlide
                                slide={slide}
                                isActive={index === newsActiveIndex}
                                onOpenArticle={handleOpenArticle}
                            />
                        </ViewTracker>
                    ))
                )}
                {isFetchingNextPage && (
                    <div className="h-20 flex items-center justify-center bg-background">
                        <div className="w-8 h-8 border-2 border-news-accent/30 border-t-news-accent rounded-full animate-spin" />
                    </div>
                )}
            </FeedContainer>

            {/* ── News Draggable Bottom Sheet ─────────────────── */}
            {activeFeatured && (
                <DraggableBottomSheet
                    minHeight={80}
                    maxHeight={550}
                    defaultHeight={80}
                    className="bg-card/95 border-t border-border rounded-t-sm"
                    expandedContent={<NewsBottomSheetContent featuredItem={activeFeatured} />}
                >
                    <div className="w-full">
                        <NowPlayingBar inline />
                    </div>
                </DraggableBottomSheet>
            )}

            {/* ── Floating Action Button ───────────── */}
            <div className="absolute end-4 bottom-[calc(env(safe-area-inset-bottom)+8rem)] z-40 pointer-events-auto">
                <Link
                    href="/create"
                    className="flex items-center justify-center w-12 h-12 rounded-sm bg-news-accent hover:bg-news-accent/90 transition-all active:scale-95"
                    aria-label="Create Post"
                >
                    <Plus className="w-6 h-6 text-white" />
                </Link>
            </div>

            {/* ── Full Screen Reader Overlay ───────────── */}
            <ArticleReader
                article={selectedArticle}
                onClose={() => setSelectedArticle(null)}
            />
        </div>
    );
}
