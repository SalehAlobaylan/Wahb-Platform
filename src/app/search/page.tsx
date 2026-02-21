'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { searchContent } from '@/lib/api/feeds';
import { useFeedStore, useNowPlayingStore } from '@/lib/stores';
import { useBookmarkMutation } from '@/lib/hooks/use-feed';
import { GlobalNowPlayingBar } from '@/components/global-now-playing-bar';
import { cn } from '@/lib/utils';
import {
    ArrowLeft, Search, X, Clock, TrendingUp,
    FileText, Video, Mic, MessageCircle, Bookmark, Rss,
} from 'lucide-react';
import type { ContentItem, ContentType } from '@/types';

/* ══════════════════════════════════════════════════════════
   Constants
   ══════════════════════════════════════════════════════════ */

type FilterKey = 'ALL' | ContentType;

const FILTERS: { key: FilterKey; label: string; icon: React.ReactNode }[] = [
    { key: 'ALL', label: 'All', icon: <Search className="w-3.5 h-3.5" /> },
    { key: 'ARTICLE', label: 'Articles', icon: <FileText className="w-3.5 h-3.5" /> },
    { key: 'PODCAST', label: 'Podcasts', icon: <Mic className="w-3.5 h-3.5" /> },
    { key: 'VIDEO', label: 'Videos', icon: <Video className="w-3.5 h-3.5" /> },
    { key: 'TWEET', label: 'Tweets', icon: <MessageCircle className="w-3.5 h-3.5" /> },
];

const TRENDING_TOPICS = [
    'Artificial Intelligence', 'Quantum Computing', 'Climate Change',
    'Startups', 'Psychology', 'Podcasts', 'Tech Earnings', 'Science',
];

const RECENT_SEARCHES_KEY = 'wahb_recent_searches';

/* ══════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════ */
function formatRelativeDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getTypeBadge(type: ContentType) {
    const map: Record<ContentType, { label: string; color: string }> = {
        ARTICLE: { label: 'Article', color: 'bg-bronze/20 text-bronze border-bronze/30' },
        PODCAST: { label: 'Podcast', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
        VIDEO: { label: 'Video', color: 'bg-sky-500/15 text-sky-400 border-sky-500/25' },
        TWEET: { label: 'Tweet', color: 'bg-violet-500/15 text-violet-400 border-violet-500/25' },
        COMMENT: { label: 'Comment', color: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
    };
    return map[type] || { label: type, color: 'bg-white/10 text-zinc-400 border-white/10' };
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

    const { bookmarkedIds } = useFeedStore();
    const { play } = useNowPlayingStore();
    const bookmarkMutation = useBookmarkMutation();

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

    const executeSearch = useCallback(async (q: string) => {
        if (!q.trim()) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        setIsSearching(true);
        setHasSearched(true);

        try {
            const data = await searchContent(q.trim());
            setResults(data);
        } catch {
            setResults([]);
        } finally {
            setIsSearching(false);
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
        <div className="h-full w-full overflow-hidden relative bg-[#0a0a0a]">
            {/* ═══════════ SEARCH HEADER ═══════════ */}
            <header className="sticky top-0 z-20 bg-[#0a0a0a] border-b border-white/5">
                <div className="flex items-center gap-3 p-4 pt-6">
                    {/* Back button */}
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all shrink-0"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-4.5 h-4.5 text-white" />
                    </button>

                    {/* Search input */}
                    <div className="flex-1 relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
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
                            placeholder="Search content..."
                            className={cn(
                                'w-full h-10 pl-9 pr-9 rounded-xl text-sm text-white placeholder:text-zinc-500',
                                'bg-white/5 border border-white/10',
                                'focus:outline-none focus:border-bronze/50 focus:ring-1 focus:ring-bronze/30',
                                'transition-all'
                            )}
                        />
                        {query && (
                            <button
                                onClick={handleClear}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center hover:bg-zinc-600 transition-colors"
                                aria-label="Clear search"
                            >
                                <X className="w-3 h-3 text-zinc-300" />
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
                                            ? 'bg-bronze text-[#0a0a0a] border-bronze shadow-lg shadow-bronze/20'
                                            : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-zinc-200'
                                    )}
                                >
                                    {filter.icon}
                                    {filter.label}
                                    <span className={cn(
                                        'text-[10px] min-w-[16px] h-[16px] rounded-full flex items-center justify-center font-bold',
                                        isActive ? 'bg-[#0a0a0a]/20 text-[#0a0a0a]' : 'bg-white/10 text-zinc-500'
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
                                <TrendingUp className="w-4 h-4 text-bronze" />
                                <h2 className="text-sm font-bold text-white uppercase tracking-widest font-serif">Trending</h2>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {TRENDING_TOPICS.map((topic) => (
                                    <button
                                        key={topic}
                                        onClick={() => handleTrendingClick(topic)}
                                        className="px-3.5 py-2 rounded-full text-xs font-medium bg-white/5 text-zinc-300 border border-white/10 hover:bg-bronze/20 hover:text-bronze hover:border-bronze/30 transition-all"
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
                                        <Clock className="w-4 h-4 text-zinc-500" />
                                        <h2 className="text-sm font-bold text-white uppercase tracking-widest font-serif">Recent</h2>
                                    </div>
                                    <button
                                        onClick={handleClearAllRecent}
                                        className="text-[11px] text-bronze hover:text-bronze/70 transition-colors font-semibold uppercase tracking-wider"
                                    >
                                        Clear All
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {recentSearches.map((term) => (
                                        <div
                                            key={term}
                                            className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer"
                                            onClick={() => handleRecentClick(term)}
                                        >
                                            <Clock className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                                            <span className="flex-1 text-sm text-zinc-300 group-hover:text-white transition-colors truncate">{term}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveRecent(term);
                                                }}
                                                className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                                                aria-label={`Remove ${term}`}
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
                            <div key={i} className="bg-[#1c1c1c] rounded-xl p-3 flex gap-3 items-center border border-white/5 animate-pulse">
                                <div className="w-14 h-14 rounded-lg bg-zinc-800 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-2.5 bg-zinc-800 rounded w-16" />
                                    <div className="h-3.5 bg-zinc-800 rounded w-3/4" />
                                    <div className="h-2.5 bg-zinc-800 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredResults.length === 0 && hasSearched ? (
                    /* ── No Results ── */
                    <div className="flex flex-col items-center justify-center px-8 pt-20">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-bronze/10 rounded-full blur-2xl scale-150" />
                            <div className="relative w-20 h-20 rounded-full bg-[#1c1c1c] border border-white/10 flex items-center justify-center">
                                <Search className="w-8 h-8 text-zinc-600" />
                            </div>
                        </div>
                        <h2 className="text-xl font-serif text-white mb-2 font-medium">No results found</h2>
                        <p className="text-sm text-zinc-500 text-center leading-relaxed max-w-[260px]">
                            Try a different search term or browse the trending topics.
                        </p>
                        <button
                            onClick={handleClear}
                            className="mt-4 px-4 py-2 rounded-full bg-bronze/20 text-bronze text-xs font-bold uppercase tracking-wider border border-bronze/30 hover:bg-bronze/30 transition-colors"
                        >
                            Clear Search
                        </button>
                    </div>
                ) : (
                    /* ── Results List ── */
                    <div className="px-5 pt-4 space-y-3 pb-4">
                        <p className="text-xs text-zinc-500 font-mono mb-2">
                            {filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'}
                        </p>
                        {filteredResults.map((item) => {
                            const badge = getTypeBadge(item.type);
                            const duration = formatDuration(item.duration_sec);
                            return (
                                <article
                                    key={item.id}
                                    onClick={() => play(item)}
                                    className="bg-[#1c1c1c] rounded-xl p-3 flex gap-3 items-center border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer group"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-14 h-14 shrink-0 overflow-hidden rounded-lg bg-zinc-800 relative">
                                        {item.thumbnail_url ? (
                                            <div
                                                className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform"
                                                style={{ backgroundImage: `url(${item.thumbnail_url})` }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                                                {item.type === 'PODCAST' ? (
                                                    <Mic className="w-5 h-5 text-zinc-600" />
                                                ) : item.type === 'VIDEO' ? (
                                                    <Video className="w-5 h-5 text-zinc-600" />
                                                ) : item.type === 'TWEET' ? (
                                                    <MessageCircle className="w-5 h-5 text-zinc-600" />
                                                ) : (
                                                    <FileText className="w-5 h-5 text-zinc-600" />
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
                                                <span className="text-[9px] text-zinc-600 flex items-center gap-1">
                                                    <Rss className="w-2.5 h-2.5" />
                                                    {item.source_name}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-sm font-serif text-zinc-100 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                                            {item.title || item.body_text?.slice(0, 80) || 'Untitled'}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            {item.author && (
                                                <span className="text-[11px] text-zinc-500 truncate max-w-[120px]">
                                                    {item.author}
                                                </span>
                                            )}
                                            <span className="text-[11px] text-zinc-600">
                                                {formatRelativeDate(item.published_at)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bookmark icon */}
                                    <button
                                        onClick={(e) => handleBookmark(e, item.id)}
                                        className={cn(
                                            "shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                            bookmarkedIds.has(item.id)
                                                ? "text-bronze bg-bronze/10"
                                                : "text-zinc-600 hover:text-bronze hover:bg-bronze/10"
                                        )}
                                        aria-label="Bookmark"
                                    >
                                        <Bookmark className={cn("w-4 h-4", bookmarkedIds.has(item.id) && "fill-bronze")} />
                                    </button>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ═══════════ NOW PLAYING BAR ═══════════ */}
            <GlobalNowPlayingBar />
        </div>
    );
}
