'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { ArrowDownUp, Bookmark, Search, User, X } from 'lucide-react';
import { useBookmarks, useBookmarkMutation, useInfiniteScroll } from '@/lib/hooks';
import { useFeedStore } from '@/lib/stores';
import { FeedSwitcher } from '@/components/layout';
import { FeedErrorFallback } from '@/components/error-boundary';
import { GlobalNowPlayingBar } from '@/components/global-now-playing-bar';
import { ArticleReader, PodsCard } from '@/components/feed';
import { SavedList, isPodsItem } from '@/components/saved';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';
import { flattenPages } from '@/lib/utils/pages';
import type { BookmarkSort } from '@/lib/api/feeds';
import type { ContentItem } from '@/types';

type SavedFeed = 'pods' | 'news';

const SAVED_FEEDS: Array<{ key: SavedFeed; labelKey: string }> = [
    { key: 'pods', labelKey: 'saved.tabs.pods' },
    { key: 'news', labelKey: 'saved.tabs.news' },
];

function SavedHeader() {
    const t = useTranslations();
    return (
        <header className="absolute top-0 inset-x-0 z-20 pointer-events-none bg-gradient-to-b from-background via-background/85 to-transparent pb-4">
            <div className="flex justify-between items-center p-4 pt-6">
                <Link href="/profile" className="pointer-events-auto">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center border border-border hover:border-primary/40 transition-all">
                        <User className="w-4.5 h-4.5 text-foreground" />
                    </div>
                </Link>

                <div className="pointer-events-auto">
                    <FeedSwitcher />
                </div>

                <Link href="/search" className="pointer-events-auto">
                    <div
                        className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-all"
                        aria-label={t('search.title')}
                    >
                        <Search className="w-4.5 h-4.5 text-foreground" />
                    </div>
                </Link>
            </div>
        </header>
    );
}

function SavedFeedTabs({
    activeFeed,
    podsCount,
    newsCount,
    onChange,
}: {
    activeFeed: SavedFeed;
    podsCount: number;
    newsCount: number;
    onChange: (feed: SavedFeed) => void;
}) {
    const t = useTranslations();
    const counts: Record<SavedFeed, number> = { pods: podsCount, news: newsCount };
    return (
        <div className="grid grid-cols-2 rounded-xl border border-border bg-muted/40 p-1">
            {SAVED_FEEDS.map((feed) => {
                const active = activeFeed === feed.key;
                return (
                    <button
                        key={feed.key}
                        type="button"
                        onClick={() => onChange(feed.key)}
                        className={cn(
                            'h-10 rounded-lg text-xs font-semibold transition-colors',
                            active
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {t(feed.labelKey)}
                        <span className="ms-1 text-[10px] text-muted-foreground">{counts[feed.key]}</span>
                    </button>
                );
            })}
        </div>
    );
}

function SavedToolbar({
    search,
    sort,
    onSearchChange,
    onSortToggle,
}: {
    search: string;
    sort: BookmarkSort;
    onSearchChange: (value: string) => void;
    onSortToggle: () => void;
}) {
    const t = useTranslations();
    return (
        <div className="space-y-3">
            <label className="relative block">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder={t('saved.search.placeholder')}
                    className="h-11 w-full rounded-xl border border-border bg-card ps-9 pe-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-news-accent/50"
                />
            </label>
            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                    {t('saved.sort.label')}
                </span>
                <button
                    type="button"
                    onClick={onSortToggle}
                    className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
                >
                    <ArrowDownUp className="h-3.5 w-3.5 text-news-accent" />
                    {sort === 'saved_desc' ? t('saved.sort.savedNewest') : t('saved.sort.savedOldest')}
                </button>
            </div>
        </div>
    );
}

function SavedEmptyState({
    activeFeed,
    hasSearch,
}: {
    activeFeed: SavedFeed;
    hasSearch: boolean;
}) {
    const t = useTranslations();
    const title = hasSearch
        ? t('saved.empty.search.title')
        : activeFeed === 'pods'
            ? t('saved.empty.pods.title')
            : t('saved.empty.news.title');
    const body = hasSearch
        ? t('saved.empty.search.body')
        : activeFeed === 'pods'
            ? t('saved.empty.pods.body')
            : t('saved.empty.news.body');

    return (
        <div className="flex flex-col items-center justify-center px-8 pt-16 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-border bg-card">
                <Bookmark className="h-8 w-8 text-news-accent/60" />
            </div>
            <h2 className="mb-2 font-serif text-xl font-medium text-foreground">{title}</h2>
            <p className="max-w-[280px] text-sm leading-relaxed text-muted-foreground">{body}</p>
        </div>
    );
}

function SavedSkeletonList() {
    return (
        <div className="px-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl p-3 flex gap-3 items-center border border-border animate-pulse">
                    <div className="w-16 h-16 rounded-lg bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-2.5 bg-muted rounded w-16" />
                        <div className="h-3.5 bg-muted rounded w-3/4" />
                        <div className="h-2.5 bg-muted rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function SavedPlaybackOverlay({
    item,
    onClose,
}: {
    item: ContentItem | null;
    onClose: () => void;
}) {
    const t = useTranslations();
    if (!item) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black">
            <PodsCard item={item} isActive />
            <button
                type="button"
                onClick={onClose}
                className="absolute start-4 top-[calc(env(safe-area-inset-top)+1rem)] z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition-colors"
                aria-label={t('saved.overlay.close')}
            >
                <X className="h-5 w-5" />
            </button>
        </div>
    );
}

export default function SavedPage() {
    const [activeFeed, setActiveFeed] = useState<SavedFeed>('pods');
    const [sort, setSort] = useState<BookmarkSort>('saved_desc');
    const [search, setSearch] = useState('');
    const [selectedArticle, setSelectedArticle] = useState<ContentItem | null>(null);
    const [selectedPlayback, setSelectedPlayback] = useState<ContentItem | null>(null);
    const deferredSearch = useDeferredValue(search.trim());
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const t = useTranslations();

    const podsQuery = useBookmarks({ feed: 'pods', sort, q: deferredSearch });
    const newsQuery = useBookmarks({ feed: 'news', sort, q: deferredSearch });
    const activeQuery = activeFeed === 'pods' ? podsQuery : newsQuery;
    const bookmarkMutation = useBookmarkMutation();

    const podsItems = useMemo(() => flattenPages(podsQuery.data), [podsQuery.data]);
    const newsItems = useMemo(() => flattenPages(newsQuery.data), [newsQuery.data]);
    const activeItems = activeFeed === 'pods' ? podsItems : newsItems;

    const sentinelRef = useInfiniteScroll({
        hasNextPage: Boolean(activeQuery.hasNextPage),
        isFetching: activeQuery.isFetching,
        isFetchingNextPage: activeQuery.isFetchingNextPage,
        fetchNextPage: activeQuery.fetchNextPage,
        root: scrollRef,
    });

    useEffect(() => {
        const allItems = [...podsItems, ...newsItems];
        if (allItems.length === 0) return;
        useFeedStore.getState().seedInteractions(
            allItems.filter((item) => item.is_liked).map((item) => item.id),
            allItems.map((item) => item.id),
            allItems.map((item) => item.id)
        );
    }, [podsItems, newsItems]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
    }, [activeFeed, deferredSearch, sort]);

    const handleOpenItem = (item: ContentItem) => {
        if (isPodsItem(item)) {
            setSelectedPlayback(item);
            return;
        }
        setSelectedArticle(item);
    };

    const handleRemoveBookmark = (event: MouseEvent<HTMLButtonElement>, item: ContentItem) => {
        event.stopPropagation();
        bookmarkMutation.mutate({ contentId: item.id, isBookmarked: true });
    };

    const handleClosePlayback = () => {
        useFeedStore.getState().setPlaying(false);
        setSelectedPlayback(null);
    };

    const isInitialLoading =
        activeQuery.isLoading ||
        (activeFeed === 'pods' && podsQuery.isLoading) ||
        (activeFeed === 'news' && newsQuery.isLoading);
    const isError = activeQuery.isError;
    const hasSearch = deferredSearch.length > 0;

    if (isError) {
        return (
            <div className="h-full w-full bg-background">
                <FeedErrorFallback
                    onRetry={() => activeQuery.refetch()}
                    message={activeQuery.error?.message || t('feed.error.saved')}
                />
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-hidden relative bg-background">
            <SavedHeader />

            <div ref={scrollRef} className="h-full overflow-y-auto hide-scrollbar pt-20 pb-24">
                <div className="px-5 mb-5">
                    <div className="mb-1 flex items-center gap-3">
                        <Bookmark className="h-5 w-5 text-news-accent" />
                        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
                            {t('saved.title')}
                        </h1>
                    </div>
                    <p className="ps-8 text-xs text-muted-foreground">{t('saved.subtitle')}</p>
                </div>

                <div className="px-5 mb-4 space-y-4">
                    <SavedFeedTabs
                        activeFeed={activeFeed}
                        podsCount={podsItems.length}
                        newsCount={newsItems.length}
                        onChange={setActiveFeed}
                    />
                    <SavedToolbar
                        search={search}
                        sort={sort}
                        onSearchChange={setSearch}
                        onSortToggle={() => setSort((current) => current === 'saved_desc' ? 'saved_asc' : 'saved_desc')}
                    />
                </div>

                <div className="px-5 mb-4">
                    <span className="text-xs text-muted-foreground font-mono">
                        {activeItems.length === 1
                            ? t('saved.countSingle')
                            : t('saved.count', { count: activeItems.length })}
                    </span>
                </div>

                {isInitialLoading ? (
                    <SavedSkeletonList />
                ) : activeItems.length === 0 ? (
                    <SavedEmptyState activeFeed={activeFeed} hasSearch={hasSearch} />
                ) : (
                    <SavedList
                        items={activeItems}
                        onOpen={handleOpenItem}
                        action={{
                            kind: 'bookmark',
                            ariaLabel: t('saved.removeBookmark'),
                            onClick: handleRemoveBookmark,
                        }}
                        isFetchingNextPage={activeQuery.isFetchingNextPage}
                        hasNextPage={Boolean(activeQuery.hasNextPage)}
                        sentinelRef={sentinelRef}
                    />
                )}
            </div>

            {!selectedPlayback && <GlobalNowPlayingBar />}

            <SavedPlaybackOverlay item={selectedPlayback} onClose={handleClosePlayback} />
            <ArticleReader article={selectedArticle} onClose={() => setSelectedArticle(null)} />
        </div>
    );
}
