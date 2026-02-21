'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useBookmarks, useBookmarkMutation } from '@/lib/hooks';
import { useFeedStore, useNowPlayingStore } from '@/lib/stores';
import { FeedSwitcher } from '@/components/layout';
import { FeedErrorFallback } from '@/components/error-boundary';
import { GlobalNowPlayingBar } from '@/components/global-now-playing-bar';
import { cn } from '@/lib/utils';
import {
    User, Search, Bookmark, ArrowUpDown,
    FileText, Video, Mic, MessageCircle, Rss,
} from 'lucide-react';
import type { ContentType } from '@/types';

/* ══════════════════════════════════════════════════════════
   Constants
   ══════════════════════════════════════════════════════════ */

type FilterKey = 'ALL' | ContentType;

const FILTERS: { key: FilterKey; label: string; icon: React.ReactNode }[] = [
    { key: 'ALL', label: 'All', icon: <Bookmark className="w-3.5 h-3.5" /> },
    { key: 'ARTICLE', label: 'Articles', icon: <FileText className="w-3.5 h-3.5" /> },
    { key: 'PODCAST', label: 'Podcasts', icon: <Mic className="w-3.5 h-3.5" /> },
    { key: 'VIDEO', label: 'Videos', icon: <Video className="w-3.5 h-3.5" /> },
    { key: 'TWEET', label: 'Tweets', icon: <MessageCircle className="w-3.5 h-3.5" /> },
];

type SortOrder = 'newest' | 'oldest';

/* ══════════════════════════════════════════════════════════
   Helper: format relative date
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

/* ══════════════════════════════════════════════════════════
   Helper: type badge colors
   ══════════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════════
   Helper: format duration
   ══════════════════════════════════════════════════════════ */
function formatDuration(sec?: number) {
    if (!sec) return null;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ══════════════════════════════════════════════════════════
   Page Component
   ══════════════════════════════════════════════════════════ */
export default function SavedPage() {
    const [activeFilter, setActiveFilter] = useState<FilterKey>('ALL');
    const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

    const { data, isLoading, isError, error, refetch } = useBookmarks();
    const bookmarkMutation = useBookmarkMutation();

    const { play } = useNowPlayingStore();

    const allItems = useMemo(() => {
        if (!data?.pages) return [];
        return data.pages.flatMap((page) => page.items);
    }, [data]);

    const handleRemoveBookmark = (e: React.MouseEvent, contentId: string) => {
        e.stopPropagation();
        bookmarkMutation.mutate({ contentId, isBookmarked: true });
    };

    // Filter
    const filteredItems = useMemo(() => {
        if (activeFilter === 'ALL') return allItems;
        return allItems.filter((item) => item.type === activeFilter);
    }, [allItems, activeFilter]);

    // Sort
    const sortedItems = useMemo(() => {
        return [...filteredItems].sort((a, b) => {
            const dateA = new Date(a.published_at).getTime();
            const dateB = new Date(b.published_at).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
    }, [filteredItems, sortOrder]);

    // Error state
    if (isError) {
        return (
            <div className="h-full w-full bg-[#0a0a0a]">
                <FeedErrorFallback
                    onRetry={() => refetch()}
                    message={error?.message || 'Failed to load saved items'}
                />
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-hidden relative bg-[#0a0a0a]">
            {/* ═══════════ HEADER ═══════════ */}
            <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none bg-gradient-to-b from-black/80 via-black/50 to-transparent pb-4">
                <div className="flex justify-between items-center p-4 pt-6">
                    <Link href="/profile" className="pointer-events-auto">
                        <div className="w-9 h-9 rounded-full bg-bronze/40 flex items-center justify-center border border-white/20 hover:border-white/40 transition-all">
                            <User className="w-4.5 h-4.5 text-white" />
                        </div>
                    </Link>

                    <div className="pointer-events-auto">
                        <FeedSwitcher variant="dark" />
                    </div>

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

            {/* ═══════════ SCROLLABLE CONTENT ═══════════ */}
            <div className="h-full overflow-y-auto hide-scrollbar pt-20 pb-24">
                {/* ── Page Title ── */}
                <div className="px-5 mb-5">
                    <div className="flex items-center gap-3 mb-1">
                        <Bookmark className="w-5 h-5 text-bronze" />
                        <h1 className="text-2xl font-serif font-bold text-white tracking-tight">Saved</h1>
                    </div>
                    <p className="text-xs text-zinc-500 pl-8">Your bookmarked content, all in one place.</p>
                </div>

                {/* ── Filter Chips ── */}
                <div className="flex gap-2 px-5 mb-5 overflow-x-auto hide-scrollbar">
                    {FILTERS.map((filter) => {
                        const isActive = activeFilter === filter.key;
                        const count = filter.key === 'ALL'
                            ? allItems.length
                            : allItems.filter((i) => i.type === filter.key).length;
                        return (
                            <button
                                key={filter.key}
                                onClick={() => setActiveFilter(filter.key)}
                                className={cn(
                                    'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border',
                                    isActive
                                        ? 'bg-bronze text-[#0a0a0a] border-bronze shadow-lg shadow-bronze/20'
                                        : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-zinc-200'
                                )}
                            >
                                {filter.icon}
                                {filter.label}
                                {count > 0 && (
                                    <span className={cn(
                                        'text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold',
                                        isActive ? 'bg-[#0a0a0a]/20 text-[#0a0a0a]' : 'bg-white/10 text-zinc-500'
                                    )}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ── Stats Bar ── */}
                <div className="flex items-center justify-between px-5 mb-4">
                    <span className="text-xs text-zinc-500 font-mono">
                        {sortedItems.length} {sortedItems.length === 1 ? 'item' : 'items'}
                    </span>
                    <button
                        onClick={() => setSortOrder((s) => s === 'newest' ? 'oldest' : 'newest')}
                        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-bronze transition-colors"
                    >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                    </button>
                </div>

                {/* ── Content ── */}
                {isLoading ? (
                    /* Loading Skeletons */
                    <div className="px-5 space-y-3">
                        {Array.from({ length: 6 }).map((_, i) => (
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
                ) : sortedItems.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center px-8 pt-16">
                        <div className="relative mb-6">
                            {/* Glow */}
                            <div className="absolute inset-0 bg-bronze/10 rounded-full blur-2xl scale-150" />
                            <div className="relative w-20 h-20 rounded-full bg-[#1c1c1c] border border-white/10 flex items-center justify-center">
                                <Bookmark className="w-8 h-8 text-bronze/60" />
                            </div>
                        </div>
                        <h2 className="text-xl font-serif text-white mb-2 font-medium">
                            {activeFilter === 'ALL' ? 'No saved items yet' : `No saved ${FILTERS.find(f => f.key === activeFilter)?.label.toLowerCase()}`}
                        </h2>
                        <p className="text-sm text-zinc-500 text-center leading-relaxed max-w-[260px]">
                            {activeFilter === 'ALL'
                                ? 'Tap the bookmark icon on any content to save it here for later.'
                                : 'Try switching to a different filter or bookmark more content.'}
                        </p>
                        {activeFilter !== 'ALL' && (
                            <button
                                onClick={() => setActiveFilter('ALL')}
                                className="mt-4 px-4 py-2 rounded-full bg-bronze/20 text-bronze text-xs font-bold uppercase tracking-wider border border-bronze/30 hover:bg-bronze/30 transition-colors"
                            >
                                View All
                            </button>
                        )}
                    </div>
                ) : (
                    /* Bookmark Card List */
                    <div className="px-5 space-y-3 pb-4">
                        {sortedItems.map((item) => {
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
                                                ) : (
                                                    <FileText className="w-5 h-5 text-zinc-600" />
                                                )}
                                            </div>
                                        )}
                                        {/* Duration overlay */}
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
                                            {item.title || 'Untitled'}
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
                                        onClick={(e) => handleRemoveBookmark(e, item.id)}
                                        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-bronze hover:bg-bronze/10 transition-all"
                                        aria-label="Remove bookmark"
                                    >
                                        <Bookmark className="w-4 h-4 fill-bronze" />
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
