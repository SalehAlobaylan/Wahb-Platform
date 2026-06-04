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
import { throttleScroll } from '@/lib/scroll-optimizer';
import { User, Search, Plus } from 'lucide-react';
import type { ContentItem, NewsSlide as NewsSlideType } from '@/types';
import { useTranslations } from '@/lib/i18n';
import { useShallow } from 'zustand/react/shallow';

// Module-level throttle for infinite-scroll fetches: at most one fetch per
// 800 ms regardless of how often the scroll handler fires. Module scope (not a
// React ref) keeps the read/write out of render-time ref access.
let lastNewsFetchAt = 0;

export default function NewsPage() {
    const feedRef = useRef<HTMLDivElement>(null);
    const { newsActiveIndex, setNewsActiveIndex, resetProgress } = useFeedStore(
        useShallow((s) => ({
            newsActiveIndex: s.newsActiveIndex,
            setNewsActiveIndex: s.setNewsActiveIndex,
            resetProgress: s.resetProgress,
        }))
    );
    const setBottomSheetMounted = useNowPlayingStore((s) => s.setBottomSheetMounted);
    const t = useTranslations();
    
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

    // The CMS already returns editorially-grouped slides (1 featured ARTICLE +
    // up to 3 related TWEET/COMMENT/ARTICLE). Consume them as-is — re-deriving the
    // grouping client-side corrupts it whenever a slide has fewer than 3 related
    // items. Only dedupe by slide_id so cursor overlap across pages does not
    // produce duplicate React keys.
    const newsSlides = useMemo(() => {
        if (!data?.pages) return [];
        const seen = new Set<string>();
        const out: NewsSlideType[] = [];
        for (const page of data.pages) {
            for (const slide of page.slides) {
                if (!slide?.featured) continue;
                const key = slide.slide_id || slide.featured.id;
                if (seen.has(key)) continue;
                seen.add(key);
                out.push(slide);
            }
        }
        return out;
    }, [data]);

    // Active slide data
    const activeSlide = newsSlides[newsActiveIndex];
    const activeFeatured = activeSlide?.featured;

    const rawHandleScroll = useCallback(() => {
        if (!feedRef.current) return;
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
            const now = Date.now();
            if (now - lastNewsFetchAt > 800) {
                lastNewsFetchAt = now;
                fetchNextPage();
            }
        }
    }, [newsActiveIndex, setNewsActiveIndex, resetProgress, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Throttle to at most once per 200 ms (matches the For You feed) so we don't
    // read layout / force a reflow on every scroll frame during snap scrolling.
    // The throttled wrapper is built inside an effect (never at render) and
    // delegates to the latest rawHandleScroll via a ref, so the stable
    // handleScroll passed to onScroll never touches a ref during render.
    const rawHandleScrollRef = useRef(rawHandleScroll);
    useEffect(() => {
        rawHandleScrollRef.current = rawHandleScroll;
    }, [rawHandleScroll]);

    const throttledScrollRef = useRef<(() => void) | null>(null);
    useEffect(() => {
        throttledScrollRef.current = throttleScroll(() => rawHandleScrollRef.current(), 200);
    }, []);

    const handleScroll = useCallback(() => {
        throttledScrollRef.current?.();
    }, []);

    // Restore scroll position to the last viewed slide on mount.
    // newsActiveIndex is persisted by the feed-store, so this survives
    // navigation away and back. Only runs once after slides are first
    // available so we don't fight the user while they scroll.
    const restoredRef = useRef(false);
    useEffect(() => {
        if (restoredRef.current || newsSlides.length === 0 || !feedRef.current) return;
        restoredRef.current = true;
        const target = Math.min(newsActiveIndex, newsSlides.length - 1);
        if (target > 0) {
            feedRef.current.scrollTop = target * feedRef.current.clientHeight;
        }
    }, [newsSlides.length, newsActiveIndex]);

    const handleOpenArticle = (item: ContentItem) => {
        setSelectedArticle(item);
    };

    const showLoading = isLoading;

    if (isError) {
        return (
            <div className="h-full w-full bg-background">
                <FeedErrorFallback
                    onRetry={() => refetch()}
                    message={error?.message || t('feed.error.news')}
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
                            <div className="w-9 h-9 rounded-sm bg-secondary flex items-center justify-center hover:bg-foreground/10 transition-all" aria-label={t('search.title')}>
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
                        <ViewTracker key={slide.slide_id || slide.featured.id} contentId={slide.featured.id} className="h-full w-full snap-start">
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
                    aria-label={t('create.publish')}
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
