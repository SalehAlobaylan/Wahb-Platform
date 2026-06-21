'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import {
    ArrowDownUp,
    Bookmark,
    FileText,
    Mic,
    Play,
    Rss,
    Search,
    User,
    Video,
    X,
} from 'lucide-react';
import { useBookmarks, useBookmarkMutation } from '@/lib/hooks';
import { useFeedStore } from '@/lib/stores';
import { FeedSwitcher } from '@/components/layout';
import { FeedErrorFallback } from '@/components/error-boundary';
import { GlobalNowPlayingBar } from '@/components/global-now-playing-bar';
import { ArticleReader, ForYouCard } from '@/components/feed';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils/time';
import { useI18n, useTranslations } from '@/lib/i18n';
import type { BookmarkSort } from '@/lib/api/feeds';
import type { ContentItem, ContentType } from '@/types';

type SavedFeed = 'foryou' | 'news';

const SAVED_FEEDS: Array<{ key: SavedFeed; labelKey: string }> = [
    { key: 'foryou', labelKey: 'saved.tabs.foryou' },
    { key: 'news', labelKey: 'saved.tabs.news' },
];

const TYPE_BADGE_STYLES: Record<ContentType, string> = {
    NEWS: 'bg-news-accent/20 text-news-accent border-news-accent/30',
    ARTICLE: 'bg-news-accent/20 text-news-accent border-news-accent/30',
    PODCAST: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    VIDEO: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
    TWEET: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
    COMMENT: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
};

const TYPE_LABEL_KEYS: Record<ContentType, string> = {
    NEWS: 'saved.badge.article',
    ARTICLE: 'saved.badge.article',
    PODCAST: 'saved.badge.podcast',
    VIDEO: 'saved.badge.video',
    TWEET: 'saved.badge.tweet',
    COMMENT: 'saved.badge.comment',
};

function isForYouItem(item: ContentItem): boolean {
    return item.type === 'VIDEO' || item.type === 'PODCAST';
}

function flattenSavedPages(data: ReturnType<typeof useBookmarks>['data']): ContentItem[] {
    if (!data?.pages) return [];
    const seen = new Set<string>();
    const items: ContentItem[] = [];
    for (const page of data.pages) {
        for (const item of page.items) {
            if (!item?.id || seen.has(item.id)) continue;
            seen.add(item.id);
            items.push(item);
        }
    }
    return items;
}

function formatDuration(sec?: number): string | null {
    if (!sec) return null;
    const total = Math.max(0, Math.floor(sec));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function sourceImageFromName(sourceName?: string): string | null {
    if (!sourceName) return null;
    const compact = sourceName.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').trim();
    if (!compact || compact.includes(' ')) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(compact)}&sz=128`;
}

function savedTimestamp(item: ContentItem): string | undefined {
    return item.bookmarked_at || item.published_at || item.created_at;
}

function SavedHeader() {
    const t = useTranslations();
    return (
        <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none bg-gradient-to-b from-background via-background/85 to-transparent pb-4">
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
    forYouCount,
    newsCount,
    onChange,
}: {
    activeFeed: SavedFeed;
    forYouCount: number;
    newsCount: number;
    onChange: (feed: SavedFeed) => void;
}) {
    const t = useTranslations();
    const counts: Record<SavedFeed, number> = { foryou: forYouCount, news: newsCount };
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
                        <span className="ml-1 text-[10px] text-muted-foreground">{counts[feed.key]}</span>
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
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder={t('saved.search.placeholder')}
                    className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-news-accent/50"
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
        : activeFeed === 'foryou'
            ? t('saved.empty.foryou.title')
            : t('saved.empty.news.title');
    const body = hasSearch
        ? t('saved.empty.search.body')
        : activeFeed === 'foryou'
            ? t('saved.empty.foryou.body')
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

function SavedRow({
    item,
    onOpen,
    onRemove,
}: {
    item: ContentItem;
    onOpen: (item: ContentItem) => void;
    onRemove: (event: MouseEvent<HTMLButtonElement>, contentId: string) => void;
}) {
    const t = useTranslations();
    const { locale } = useI18n();
    const badgeClass = TYPE_BADGE_STYLES[item.type] ?? 'bg-muted text-muted-foreground border-border';
    const badgeLabel = t(TYPE_LABEL_KEYS[item.type] ?? 'saved.badge.article');
    const duration = formatDuration(item.duration_sec);
    const timestamp = formatRelativeTime(savedTimestamp(item), locale);
    const fallbackImage = sourceImageFromName(item.source_name);
    const displayImage = item.thumbnail_url || item.source_image_url || fallbackImage;
    const title = item.title || item.body_text?.slice(0, 90) || t('saved.item.untitled');

    return (
        <article
            className="bg-card rounded-xl p-3 flex gap-3 items-center border border-border hover:bg-muted/50 transition-colors group"
        >
            <button
                type="button"
                onClick={() => onOpen(item)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {displayImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={displayImage}
                            alt=""
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                            {isForYouItem(item) ? (
                                item.type === 'VIDEO' ? (
                                    <Video className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                    <Mic className="h-5 w-5 text-muted-foreground" />
                                )
                            ) : (
                                <FileText className="h-5 w-5 text-muted-foreground" />
                            )}
                        </div>
                    )}
                    {isForYouItem(item) && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
                            <Play className="h-5 w-5 fill-white text-white drop-shadow" />
                        </span>
                    )}
                    {duration && (
                        <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[9px] font-mono text-white">
                            {duration}
                        </span>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                        <span className={cn('rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider', badgeClass)}>
                            {badgeLabel}
                        </span>
                        {item.source_name && (
                            <span className="flex min-w-0 items-center gap-1 text-[9px] text-muted-foreground">
                                <Rss className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate">{item.source_name}</span>
                            </span>
                        )}
                    </div>
                    <h3 dir="auto" className="line-clamp-2 font-serif text-sm leading-snug text-foreground">
                        {title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                        {item.author && <span className="truncate max-w-[120px]">{item.author}</span>}
                        {timestamp && <span className="shrink-0">{t('saved.savedAt', { time: timestamp })}</span>}
                    </div>
                </div>
            </button>

            <button
                type="button"
                onClick={(event) => onRemove(event, item.id)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-news-accent hover:bg-news-accent/10 transition-colors disabled:opacity-50"
                aria-label={t('saved.removeBookmark')}
            >
                <Bookmark className="h-4 w-4 fill-news-accent" />
            </button>
        </article>
    );
}

function SavedList({
    items,
    isFetchingNextPage,
    hasNextPage,
    sentinelRef,
    onOpen,
    onRemove,
}: {
    items: ContentItem[];
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    sentinelRef: React.RefObject<HTMLDivElement | null>;
    onOpen: (item: ContentItem) => void;
    onRemove: (event: MouseEvent<HTMLButtonElement>, contentId: string) => void;
}) {
    const t = useTranslations();
    return (
        <div className="px-5 space-y-3 pb-4">
            {items.map((item) => (
                <SavedRow key={item.id} item={item} onOpen={onOpen} onRemove={onRemove} />
            ))}
            <div ref={sentinelRef} className="h-1" />
            {isFetchingNextPage && (
                <div className="py-4 text-center text-xs text-muted-foreground">
                    {t('saved.loadingMore')}
                </div>
            )}
            {!hasNextPage && items.length > 6 && (
                <div className="py-4 text-center text-[10px] uppercase tracking-widest text-muted-foreground/60">
                    {t('saved.caughtUp')}
                </div>
            )}
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
            <ForYouCard item={item} isActive />
            <button
                type="button"
                onClick={onClose}
                className="absolute left-4 top-[calc(env(safe-area-inset-top)+1rem)] z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition-colors"
                aria-label={t('saved.overlay.close')}
            >
                <X className="h-5 w-5" />
            </button>
        </div>
    );
}

export default function SavedPage() {
    const [activeFeed, setActiveFeed] = useState<SavedFeed>('foryou');
    const [sort, setSort] = useState<BookmarkSort>('saved_desc');
    const [search, setSearch] = useState('');
    const [selectedArticle, setSelectedArticle] = useState<ContentItem | null>(null);
    const [selectedPlayback, setSelectedPlayback] = useState<ContentItem | null>(null);
    const deferredSearch = useDeferredValue(search.trim());
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const t = useTranslations();

    const forYouQuery = useBookmarks({ feed: 'foryou', sort, q: deferredSearch });
    const newsQuery = useBookmarks({ feed: 'news', sort, q: deferredSearch });
    const activeQuery = activeFeed === 'foryou' ? forYouQuery : newsQuery;
    const bookmarkMutation = useBookmarkMutation();

    const forYouItems = useMemo(() => flattenSavedPages(forYouQuery.data), [forYouQuery.data]);
    const newsItems = useMemo(() => flattenSavedPages(newsQuery.data), [newsQuery.data]);
    const activeItems = activeFeed === 'foryou' ? forYouItems : newsItems;
    const activeHasNextPage = activeQuery.hasNextPage;
    const activeIsFetching = activeQuery.isFetching;
    const activeIsFetchingNextPage = activeQuery.isFetchingNextPage;
    const activeFetchNextPage = activeQuery.fetchNextPage;

    useEffect(() => {
        const allItems = [...forYouItems, ...newsItems];
        if (allItems.length === 0) return;
        useFeedStore.getState().seedInteractions(
            allItems.filter((item) => item.is_liked).map((item) => item.id),
            allItems.map((item) => item.id)
        );
    }, [forYouItems, newsItems]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
    }, [activeFeed, deferredSearch, sort]);

    useEffect(() => {
        const node = sentinelRef.current;
        if (!node || !activeHasNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && !activeIsFetching && !activeIsFetchingNextPage) {
                    activeFetchNextPage();
                }
            },
            { root: scrollRef.current, rootMargin: '300px' }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [activeHasNextPage, activeIsFetching, activeIsFetchingNextPage, activeFetchNextPage]);

    const handleOpenItem = (item: ContentItem) => {
        if (isForYouItem(item)) {
            setSelectedPlayback(item);
            return;
        }
        setSelectedArticle(item);
    };

    const handleRemoveBookmark = (event: MouseEvent<HTMLButtonElement>, contentId: string) => {
        event.stopPropagation();
        bookmarkMutation.mutate({ contentId, isBookmarked: true });
    };

    const handleClosePlayback = () => {
        useFeedStore.getState().setPlaying(false);
        setSelectedPlayback(null);
    };

    const isInitialLoading =
        activeQuery.isLoading ||
        (activeFeed === 'foryou' && forYouQuery.isLoading) ||
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
                    <p className="pl-8 text-xs text-muted-foreground">{t('saved.subtitle')}</p>
                </div>

                <div className="px-5 mb-4 space-y-4">
                    <SavedFeedTabs
                        activeFeed={activeFeed}
                        forYouCount={forYouItems.length}
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
                        isFetchingNextPage={activeQuery.isFetchingNextPage}
                        hasNextPage={Boolean(activeQuery.hasNextPage)}
                        sentinelRef={sentinelRef}
                        onOpen={handleOpenItem}
                        onRemove={handleRemoveBookmark}
                    />
                )}
            </div>

            {!selectedPlayback && <GlobalNowPlayingBar />}

            <SavedPlaybackOverlay item={selectedPlayback} onClose={handleClosePlayback} />
            <ArticleReader article={selectedArticle} onClose={() => setSelectedArticle(null)} />
        </div>
    );
}
