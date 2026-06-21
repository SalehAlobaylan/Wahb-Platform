'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { searchContent } from '@/lib/api/feeds';
import { useFeedStore } from '@/lib/stores';
import { useBookmarkMutation } from '@/lib/hooks/use-feed';
import { GlobalNowPlayingBar } from '@/components/global-now-playing-bar';
import { ArticleReader } from '@/components/feed';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils/time';
import { useI18n, useTranslations } from '@/lib/i18n';
import {
    ArrowLeft, Search, X, Clock, TrendingUp,
    FileText, Video, Mic, MessageCircle, Bookmark, Rss,
} from 'lucide-react';
import type { ContentItem, ContentType } from '@/types';

/* ══════════════════════════════════════════════════════════
   Constants
   ══════════════════════════════════════════════════════════ */

type FilterKey = 'ALL' | ContentType;

const FILTERS: { key: FilterKey; labelKey: string; icon: React.ReactNode }[] = [
    { key: 'ALL', labelKey: 'search.filters.all', icon: <Search className="w-3.5 h-3.5" /> },
    { key: 'ARTICLE', labelKey: 'search.filters.articles', icon: <FileText className="w-3.5 h-3.5" /> },
    { key: 'PODCAST', labelKey: 'search.filters.podcasts', icon: <Mic className="w-3.5 h-3.5" /> },
    { key: 'VIDEO', labelKey: 'search.filters.videos', icon: <Video className="w-3.5 h-3.5" /> },
    { key: 'TWEET', labelKey: 'search.filters.tweets', icon: <MessageCircle className="w-3.5 h-3.5" /> },
];

const TRENDING_TOPICS = [
    'Artificial Intelligence', 'Quantum Computing', 'Climate Change',
    'Startups', 'Psychology', 'Podcasts', 'Tech Earnings', 'Science',
];

const RECENT_SEARCHES_KEY = 'wahb_recent_searches';

/* ══════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════ */
function getTypeBadge(type: ContentType, t: (key: string) => string) {
    const map: Record<ContentType, { label: string; color: string }> = {
        NEWS: { label: t('saved.badge.article'), color: 'bg-news-accent/20 text-news-accent border-news-accent/30' },
        ARTICLE: { label: t('saved.badge.article'), color: 'bg-news-accent/20 text-news-accent border-news-accent/30' },
        PODCAST: { label: t('saved.badge.podcast'), color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
        VIDEO: { label: t('saved.badge.video'), color: 'bg-news-accent/15 text-news-accent border-news-accent/25' },
        TWEET: { label: t('saved.badge.tweet'), color: 'bg-violet-500/15 text-violet-400 border-violet-500/25' },
        COMMENT: { label: t('saved.badge.comment'), color: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
    };
    return map[type] || { label: type, color: 'bg-muted text-muted-foreground border-border' };
}

function formatDuration(sec?: number) {
    if (!sec) return null;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function loadRecentSearches(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
    } catch { return []; }
}

function saveRecentSearches(searches: string[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, 10)));
}

/* ══════════════════════════════════════════════════════════
   Page Component
   ══════════════════════════════════════════════════════════ */
export default function SearchPage() {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterKey>('ALL');
    const [results, setResults] = useState<ContentItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [selectedArticle, setSelectedArticle] = useState<ContentItem | null>(null);
    const t = useTranslations();
    const { locale } = useI18n();

    const { bookmarkedIds } = useFeedStore();
    const bookmarkMutation = useBookmarkMutation();

    const handleOpenItem = (item: ContentItem) => {
        if (item.type === 'VIDEO' || item.type === 'PODCAST') {
            router.push(`/?item=${encodeURIComponent(item.id)}`);
            return;
        }
        setSelectedArticle(item);
    };

    const handleBookmark = (e: React.MouseEvent, contentId: string) => {
        e.stopPropagation();
        const isBookmarked = bookmarkedIds.has(contentId);
        bookmarkMutation.mutate({ contentId, isBookmarked });
    };

    // Load recent searches on mount & autofocus
    useEffect(() => {
        setRecentSearches(loadRecentSearches());
        // Small delay for page transition
        const t = setTimeout(() => inputRef.current?.focus(), 150);
        return () => clearTimeout(t);
    }, []);

    // Debounced search
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // Monotonic id per request: a slow response for an older query must not
    // overwrite the results of a newer one (debounce alone doesn't prevent
    // out-of-order responses).
    const searchSeqRef = useRef(0);

    // Clear any pending debounce on unmount so it can't fire afterwards
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, []);

    const executeSearch = useCallback(async (q: string) => {
        if (!q.trim()) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        const seq = ++searchSeqRef.current;
        setIsSearching(true);
        setHasSearched(true);

        try {
            const data = await searchContent(q.trim());
            if (seq !== searchSeqRef.current) return; // stale response
            setResults(data);
        } catch {
            if (seq === searchSeqRef.current) setResults([]);
        } finally {
            if (seq === searchSeqRef.current) setIsSearching(false);
        }

        // Save to recent
        const updated = [q.trim(), ...recentSearches.filter(s => s !== q.trim())].slice(0, 10);
        setRecentSearches(updated);
        saveRecentSearches(updated);
    }, [recentSearches]);

    const handleInputChange = (value: string) => {
        setQuery(value);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => executeSearch(value), 400);
    };

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setHasSearched(false);
        inputRef.current?.focus();
    };

    const handleRecentClick = (term: string) => {
        setQuery(term);
        executeSearch(term);
    };

    const handleRemoveRecent = (term: string) => {
        const updated = recentSearches.filter(s => s !== term);
        setRecentSearches(updated);
        saveRecentSearches(updated);
    };

    const handleClearAllRecent = () => {
        setRecentSearches([]);
        saveRecentSearches([]);
    };

    const handleTrendingClick = (topic: string) => {
        setQuery(topic);
        executeSearch(topic);
    };

    // Filter results
    const filteredResults = useMemo(() => {
        if (activeFilter === 'ALL') return results;
        return results.filter((item) => item.type === activeFilter);
    }, [results, activeFilter]);

    const showSuggestions = !hasSearched && !query.trim();

    return (
        <div className="h-full w-full overflow-hidden relative bg-background">
            {/* ═══════════ SEARCH HEADER ═══════════ */}
            <header className="sticky top-0 z-20 bg-background border-b border-border">
                <div className="flex items-center gap-3 p-4 pt-6">
                    {/* Back button */}
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-all shrink-0"
                        aria-label={t('profile.title')}
                    >
                        <ArrowLeft className="w-4.5 h-4.5 text-foreground" />
                    </button>

                    {/* Search input */}
                    <div className="flex-1 relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => handleInputChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                                    executeSearch(query);
                                }
                            }}
                            placeholder={t('search.placeholder')}
                            className={cn(
                                'w-full h-10 pl-9 pr-9 rounded-xl text-sm text-foreground placeholder:text-muted-foreground',
                                'bg-muted border border-border',
                                'focus:outline-none focus:border-news-accent/50 focus:ring-1 focus:ring-news-accent/30',
                                'transition-all'
                            )}
                        />
                        {query && (
                            <button
                                onClick={handleClear}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-muted-foreground/30 transition-colors"
                                aria-label={t('search.clear')}
                            >
                                <X className="w-3 h-3 text-foreground" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter chips — only shown when we have results */}
                {hasSearched && results.length > 0 && (
                    <div className="flex gap-2 px-4 pb-3 overflow-x-auto hide-scrollbar">
                    {FILTERS.map((filter) => {
                        const isActive = activeFilter === filter.key;
                        const count = filter.key === 'ALL'
                            ? results.length
                            : results.filter((i) => i.type === filter.key).length;
                            if (filter.key !== 'ALL' && count === 0) return null;
                            return (
                                <button
                                    key={filter.key}
                                    onClick={() => setActiveFilter(filter.key)}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border',
                                        isActive
                                            ? 'bg-news-accent text-white border-news-accent shadow-lg shadow-news-accent/20'
                                            : 'bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground'
                                    )}
                                >
                                    {filter.icon}
                                    {t(filter.labelKey)}
                                    <span className={cn(
                                        'text-[10px] min-w-[16px] h-[16px] rounded-full flex items-center justify-center font-bold',
                                        isActive ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                                    )}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </header>

            {/* ═══════════ SCROLLABLE CONTENT ═══════════ */}
            <div className="h-full overflow-y-auto hide-scrollbar pb-32" style={{ maxHeight: 'calc(100vh - 100px)' }}>
                {showSuggestions ? (
                    /* ── Pre-search: Trending + Recent ── */
                    <div className="px-5 pt-5">
                        {/* Trending Topics */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-4 h-4 text-news-accent" />
                                <h2 className="text-sm font-bold text-foreground uppercase tracking-widest font-serif">{t('search.trending')}</h2>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {TRENDING_TOPICS.map((topic) => (
                                    <button
                                        key={topic}
                                        onClick={() => handleTrendingClick(topic)}
                                        className="px-3.5 py-2 rounded-full text-xs font-medium bg-muted text-foreground border border-border hover:bg-news-accent/20 hover:text-news-accent hover:border-news-accent/30 transition-all"
                                    >
                                        {topic}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recent Searches */}
                        {recentSearches.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest font-serif">{t('search.recent')}</h2>
                                    </div>
                                    <button
                                        onClick={handleClearAllRecent}
                                        className="text-[11px] text-news-accent hover:text-news-accent/70 transition-colors font-semibold uppercase tracking-wider"
                                    >
                                        {t('search.clearAll')}
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {recentSearches.map((term) => (
                                        <div
                                            key={term}
                                            className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
                                            onClick={() => handleRecentClick(term)}
                                        >
                                            <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                            <span className="flex-1 text-sm text-foreground/80 group-hover:text-foreground transition-colors truncate">{term}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveRecent(term);
                                                }}
                                                className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all opacity-0 group-hover:opacity-100"
                                        aria-label={`${t('search.clear')} ${term}`}
                                    >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : isSearching ? (
                    /* ── Loading Skeletons ── */
                    <div className="px-5 pt-4 space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="bg-card rounded-xl p-3 flex gap-3 items-center border border-border animate-pulse">
                                <div className="w-14 h-14 rounded-lg bg-muted shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-2.5 bg-muted rounded w-16" />
                                    <div className="h-3.5 bg-muted rounded w-3/4" />
                                    <div className="h-2.5 bg-muted rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredResults.length === 0 && hasSearched ? (
                    /* ── No Results ── */
                    <div className="flex flex-col items-center justify-center px-8 pt-20">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-news-accent/10 rounded-full blur-2xl scale-150" />
                            <div className="relative w-20 h-20 rounded-full bg-card border border-border flex items-center justify-center">
                                <Search className="w-8 h-8 text-muted-foreground" />
                            </div>
                        </div>
                        <h2 className="text-xl font-serif text-foreground mb-2 font-medium">{t('search.noResults')}</h2>
                        <p className="text-sm text-muted-foreground text-center leading-relaxed max-w-[260px]">
                            {t('search.noResultsBody')}
                        </p>
                        <button
                            onClick={handleClear}
                            className="mt-4 px-4 py-2 rounded-full bg-news-accent/20 text-news-accent text-xs font-bold uppercase tracking-wider border border-news-accent/30 hover:bg-news-accent/30 transition-colors"
                        >
                            {t('search.clear')}
                        </button>
                    </div>
                ) : (
                    /* ── Results List ── */
                    <div className="px-5 pt-4 space-y-3 pb-4">
                        <p className="text-xs text-muted-foreground font-mono mb-2">
                            {filteredResults.length === 1
                                ? t('search.resultsSingle')
                                : t('search.results', { count: filteredResults.length })}
                        </p>
                        {filteredResults.map((item) => {
                            const badge = getTypeBadge(item.type, t);
                            const duration = formatDuration(item.duration_sec);
                            return (
                                <article
                                    key={item.id}
                                    onClick={() => handleOpenItem(item)}
                                    className="bg-card rounded-xl p-3 flex gap-3 items-center border border-border hover:bg-muted/50 hover:border-border transition-all cursor-pointer group"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-14 h-14 shrink-0 overflow-hidden rounded-lg bg-muted relative">
                                        {item.thumbnail_url ? (
                                            <div
                                                className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform"
                                                style={{ backgroundImage: `url(${item.thumbnail_url})` }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/80">
                                                {item.type === 'PODCAST' ? (
                                                    <Mic className="w-5 h-5 text-muted-foreground" />
                                                ) : item.type === 'VIDEO' ? (
                                                    <Video className="w-5 h-5 text-muted-foreground" />
                                                ) : item.type === 'TWEET' ? (
                                                    <MessageCircle className="w-5 h-5 text-muted-foreground" />
                                                ) : (
                                                    <FileText className="w-5 h-5 text-muted-foreground" />
                                                )}
                                            </div>
                                        )}
                                        {duration && (
                                            <div className="absolute bottom-0.5 right-0.5 bg-black/70 text-[9px] text-white font-mono px-1 py-0.5 rounded">
                                                {duration}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn(
                                                'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border',
                                                badge.color
                                            )}>
                                                {badge.label}
                                            </span>
                                            {item.source_name && (
                                                <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                                                    <Rss className="w-2.5 h-2.5" />
                                                    {item.source_name}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-sm font-serif text-foreground leading-snug line-clamp-2 group-hover:text-foreground transition-colors">
                                            {item.title || item.body_text?.slice(0, 80) || t('saved.item.untitled')}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            {item.author && (
                                                <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">
                                                    {item.author}
                                                </span>
                                            )}
                                            {formatRelativeTime(item.published_at, locale) && (
                                                <span className="text-[11px] text-muted-foreground">
                                                    {formatRelativeTime(item.published_at, locale)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bookmark icon */}
                                    <button
                                        onClick={(e) => handleBookmark(e, item.id)}
                                        className={cn(
                                            "shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                            bookmarkedIds.has(item.id)
                                                ? "text-news-accent bg-news-accent/10"
                                                : "text-muted-foreground hover:text-news-accent hover:bg-news-accent/10"
                                        )}
                                        aria-label="Bookmark"
                                    >
                                        <Bookmark className={cn("w-4 h-4", bookmarkedIds.has(item.id) && "fill-news-accent")} />
                                    </button>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ═══════════ NOW PLAYING BAR ═══════════ */}
            <GlobalNowPlayingBar />

            <ArticleReader
                article={selectedArticle}
                onClose={() => setSelectedArticle(null)}
            />
        </div>
    );
}
