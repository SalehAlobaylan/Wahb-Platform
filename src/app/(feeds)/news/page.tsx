'use client';

import { Suspense, useRef, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useNewsFeed, useContentItem } from '@/lib/hooks';
import { useFeedStore } from '@/lib/stores';
import { useNowPlayingStore } from '@/lib/stores/now-playing-store';
import {
    FeedContainer,
    NewsSlide,
    NewsSlideSkeleton,
    ViewTracker,
    DraggableBottomSheet,
    NewsBottomSheetContent,
    NewsSquareTile,
    ArticleReader,
} from '@/components/feed';
import { FeedSwitcher } from '@/components/layout';
import { FeedErrorFallback } from '@/components/error-boundary';
import { throttleScroll } from '@/lib/scroll-optimizer';
import { User, Search } from 'lucide-react';
import type { ContentItem, NewsSlide as NewsSlideType, NewsWindow } from '@/types';
import { useFeedLoadTelemetry, usePaginationTelemetry } from '@/lib/experience/use-feed-telemetry';
import { beginArticle, type ArticleJourney } from '@/lib/experience/journeys';
import { useTranslations } from '@/lib/i18n';
import { useShallow } from 'zustand/react/shallow';
import { PaginationAdmission } from '@/lib/feed-window/pagination-admission';

const NEWS_WINDOW_OPTIONS: Array<{ value: NewsWindow; labelKey: string }> = [
    { value: 'today', labelKey: 'news.window.today' },
    { value: 'week', labelKey: 'news.window.week' },
    { value: 'month', labelKey: 'news.window.month' },
];

export default function NewsPage() {
    // useSearchParams must live under a Suspense boundary (same pattern as the
    // Pods page).
    return (
        <Suspense
            fallback={
                <div className="h-full w-full overflow-hidden relative bg-background news-page">
                    <FeedContainer>
                        <NewsSlideSkeleton />
                        <NewsSlideSkeleton />
                    </FeedContainer>
                </div>
            }
        >
            <NewsPageContent />
        </Suspense>
    );
}

function NewsPageContent() {
    const feedRef = useRef<HTMLDivElement>(null);
    const activeSlideIdRef = useRef<string | null>(null);
    const renderedSlideIdsRef = useRef<string[]>([]);
    const paginationAdmissionRef = useRef(new PaginationAdmission());
    const restoredRef = useRef(false);
    // Hide-on-scroll (LinkedIn/X): track scroll direction to conceal the sheet.
    const lastScrollTopRef = useRef(0);
    const scrollRafRef = useRef(false);
    const [sheetConcealed, setSheetConcealed] = useState(false);
    const { newsActiveIndex, setNewsActiveIndex, resetProgress } = useFeedStore(
        useShallow((s) => ({
            newsActiveIndex: s.newsActiveIndex,
            setNewsActiveIndex: s.setNewsActiveIndex,
            resetProgress: s.resetProgress,
        }))
    );
    const setBottomSheetMounted = useNowPlayingStore((s) => s.setBottomSheetMounted);
    const t = useTranslations();
    const searchParams = useSearchParams();
    const [selectedWindow, setSelectedWindow] = useState<NewsWindow>('today');

    // Reader Overlay State
    const [selectedArticle, setSelectedArticle] = useState<ContentItem | null>(null);
    // Coverage (the other sources behind the same story) for the open article —
    // rendered at the bottom of the reader. Empty for deep-links / standalone items.
    const [articleCoverage, setArticleCoverage] = useState<ContentItem[]>([]);

    // Deep-link support: /news?item=<content_id> (this is what shareContent
    // generates for ARTICLE/TWEET/COMMENT items). The deep-linked article is
    // derived at render — no effect — and closing the reader marks the id
    // dismissed so it doesn't reopen.
    const deepLinkId = searchParams.get('item');
    const [dismissedDeepLinkId, setDismissedDeepLinkId] = useState<string | null>(null);
    const { data: deepLinkItem } = useContentItem(deepLinkId);
    const deepLinkArticle =
        deepLinkItem && deepLinkItem.id !== dismissedDeepLinkId ? deepLinkItem : null;
    const openArticle = selectedArticle ?? deepLinkArticle;
    const handleCloseArticle = () => {
        setSelectedArticle(null);
        setArticleCoverage([]);
        if (deepLinkArticle) setDismissedDeepLinkId(deepLinkArticle.id);
    };

    // Tell global store a bottom-sheet lives here
    useEffect(() => {
        setBottomSheetMounted(true);
        return () => setBottomSheetMounted(false);
    }, [setBottomSheetMounted]);

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
    } = useNewsFeed(selectedWindow);

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

    // RUX: emit the News feed-load journey terminal once per fresh load; a
    // window switch (today/week/...) re-arms via loadKey.
    useFeedLoadTelemetry({
        surface: 'news',
        status,
        unitCount: newsSlides.length,
        loadKey: selectedWindow,
    });
    const paginationTelemetry = usePaginationTelemetry('news');
    const previousSlideCount = useRef(newsSlides.length);
    useEffect(() => {
        if (!isFetchingNextPage && previousSlideCount.current < newsSlides.length) {
            paginationTelemetry.received();
        } else if (!isFetchingNextPage && hasNextPage && previousSlideCount.current === newsSlides.length) {
            paginationTelemetry.starved();
        }
        previousSlideCount.current = newsSlides.length;
    }, [isFetchingNextPage, hasNextPage, newsSlides.length, paginationTelemetry]);

    // Active slide data
    const activeSlide = newsSlides[newsActiveIndex];
    const activeFeatured = activeSlide?.featured;

    // Top breaking story (lifecycle === 'breaking') — surfaced in the idle
    // square tile when no audio is playing.
    const breakingSlide = useMemo(
        () => newsSlides.find((s) => s.story?.lifecycle === 'breaking' && s.featured?.title) ?? null,
        [newsSlides]
    );

    const requestNextPage = useCallback(() => {
        if (!hasNextPage) return;
        const admission = paginationAdmissionRef.current;
        if (admission.admit({ fastSwiping: false, fetching: isFetchingNextPage }) !== 'admitted') return;
        paginationTelemetry.arm();
        void fetchNextPage()
            .then((result) => {
                if (result.isError) {
                    const error = result.error as { status?: number; retryAfterMs?: number } | null;
                    admission.failure(error?.status, error?.retryAfterMs);
                } else admission.success();
            })
            .catch((error: { status?: number; retryAfterMs?: number }) => {
                admission.failure(error?.status, error?.retryAfterMs);
            });
    }, [fetchNextPage, hasNextPage, isFetchingNextPage, paginationTelemetry]);

    useLayoutEffect(() => {
        if (newsSlides.length === 0) return;
        const ids = newsSlides.map((slide) => slide.slide_id || slide.featured.id);
        const changed = ids.length !== renderedSlideIdsRef.current.length ||
            ids.some((id, index) => id !== renderedSlideIdsRef.current[index]);
        renderedSlideIdsRef.current = ids;
        if (!changed) {
            activeSlideIdRef.current = ids[newsActiveIndex] ?? activeSlideIdRef.current;
            return;
        }
        const anchoredIndex = activeSlideIdRef.current ? ids.indexOf(activeSlideIdRef.current) : -1;
        const nextIndex = anchoredIndex >= 0 ? anchoredIndex : Math.min(Math.max(0, newsActiveIndex), ids.length - 1);
        const container = feedRef.current;
        if (container?.clientHeight) container.scrollTop = nextIndex * container.clientHeight;
        activeSlideIdRef.current = ids[nextIndex] ?? null;
        if (nextIndex !== newsActiveIndex) setNewsActiveIndex(nextIndex);
    }, [newsActiveIndex, newsSlides, setNewsActiveIndex]);

    const rawHandleScroll = useCallback(() => {
        if (!feedRef.current) return;
        const scrollPosition = feedRef.current.scrollTop;
        const height = feedRef.current.clientHeight;
        const scrollHeight = feedRef.current.scrollHeight;
        const newIndex = Math.round(scrollPosition / height);

        if (newsActiveIndex !== newIndex) {
            activeSlideIdRef.current = newsSlides[newIndex]?.slide_id || newsSlides[newIndex]?.featured.id || null;
            setNewsActiveIndex(newIndex);
            resetProgress();
        }

        // Prefetch the next page while the user still has 5 slides to read —
        // past the cached slides the server assembles pages live (seconds on a
        // remote DB), so the fetch must start well before the user hits the
        // end or they stare at an empty loading slide.
        if (scrollPosition + height >= scrollHeight - height * 5) requestNextPage();
    }, [newsActiveIndex, newsSlides, requestNextPage, setNewsActiveIndex, resetProgress]);

    // Throttle to at most once per 200 ms (matches the Pods feed) so we don't
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
        // Direction-aware sheet hide. Coalesce the layout read into a single
        // rAF so we don't thrash on every scroll event; React de-dupes the
        // identical setState, so frame-rate calls are cheap.
        if (!scrollRafRef.current) {
            scrollRafRef.current = true;
            requestAnimationFrame(() => {
                scrollRafRef.current = false;
                const el = feedRef.current;
                if (!el) return;
                const st = el.scrollTop;
                const delta = st - lastScrollTopRef.current;
                if (st < 24) setSheetConcealed(false); // at the top → always show
                else if (delta > 6) setSheetConcealed(true); // scrolling down → hide
                else if (delta < -6) setSheetConcealed(false); // scrolling up → show
                lastScrollTopRef.current = st;
            });
        }
        throttledScrollRef.current?.();
    }, []);

    const handleWindowChange = useCallback((nextWindow: NewsWindow) => {
        if (nextWindow === selectedWindow) return;
        setSelectedWindow(nextWindow);
        setNewsActiveIndex(0);
        resetProgress();
        activeSlideIdRef.current = null;
        renderedSlideIdsRef.current = [];
        restoredRef.current = false;
        if (feedRef.current) feedRef.current.scrollTop = 0;
    }, [selectedWindow, setNewsActiveIndex, resetProgress]);

    // Restore scroll position to the last viewed slide on mount.
    // newsActiveIndex is persisted by the feed-store, so this survives
    // navigation away and back. Only runs once after slides are first
    // available so we don't fight the user while they scroll.
    useEffect(() => {
        if (restoredRef.current || newsSlides.length === 0 || !feedRef.current) return;
        restoredRef.current = true;
        const target = Math.min(newsActiveIndex, newsSlides.length - 1);
        if (target > 0) {
            const top = target * feedRef.current.clientHeight;
            feedRef.current.scrollTop = top;
            // Seed the direction baseline so the restore scroll doesn't read as
            // a downward swipe and hide the sheet on load.
            lastScrollTopRef.current = top;
        }
    }, [newsSlides.length, newsActiveIndex]);

    // RUX: article-reader journey — opened on selection, ready when the reader
    // has renderable content (immediate for feed-carried items, measured for
    // deep-linked fetches).
    const articleJourneyRef = useRef<ArticleJourney | null>(null);
    const handleOpenArticle = (item: ContentItem, coverage?: ContentItem[]) => {
        articleJourneyRef.current = beginArticle(null, item.id);
        setSelectedArticle(item);
        setArticleCoverage(coverage ?? []);
    };
    useEffect(() => {
        if (openArticle && articleJourneyRef.current) {
            articleJourneyRef.current.ready();
            articleJourneyRef.current = null;
        }
    }, [openArticle]);

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
                        <Link href="/profile">
                            <div className="w-9 h-9 rounded-sm bg-secondary flex items-center justify-center border border-foreground/20 hover:border-foreground/40 transition-all">
                                <User className="w-4.5 h-4.5 text-foreground" />
                            </div>
                        </Link>
                    </div>
                    <div className="pointer-events-auto">
                        {/* The News tab doubles as the today/week/month trigger: it
                            shows a dropdown arrow on the News page and opens the
                            time-range menu when tapped again. */}
                        <FeedSwitcher
                            variant="light"
                            newsWindowOptions={NEWS_WINDOW_OPTIONS}
                            newsWindowValue={selectedWindow}
                            onNewsWindowChange={(v) => handleWindowChange(v as NewsWindow)}
                        />
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
                    concealed={sheetConcealed}
                    className="bg-card/95 border-t border-border rounded-t-sm"
                    expandedContent={<NewsBottomSheetContent featuredItem={activeFeatured} />}
                >
                    {/* Collapsed: just the pull handle — pull up for Up Next / TTS / Share */}
                    <div className="h-1.5 w-full" />
                </DraggableBottomSheet>
            )}

            {/* ── Square tile: now-playing player / idle info tile ───────────── */}
            <div className="absolute end-4 bottom-[calc(env(safe-area-inset-bottom)+8rem)] z-40 pointer-events-auto">
                <NewsSquareTile
                    breaking={breakingSlide?.featured ?? null}
                    onOpenBreaking={(item) => handleOpenArticle(item, breakingSlide?.coverage)}
                />
            </div>

            {/* ── Full Screen Reader Overlay ───────────── */}
            <ArticleReader
                article={openArticle}
                coverage={articleCoverage}
                onOpenArticle={handleOpenArticle}
                onClose={handleCloseArticle}
            />
        </div>
    );
}
