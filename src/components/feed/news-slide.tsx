'use client';

import { useState } from 'react';
import { Clock, TrendingUp, Quote, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NewsSlide as NewsSlideType, ContentItem } from '@/types';

interface NewsSlideProps {
    slide: NewsSlideType;
    isActive: boolean;
    onOpenArticle: (item: ContentItem) => void;
}

type TabKey = 'related' | 'discussion';

/**
 * Cinematic news slide with a top-half hero area and
 * a bottom-half draggable sheet showing related articles.
 */
export function NewsSlide({ slide, isActive, onOpenArticle }: NewsSlideProps) {
    const { featured, related } = slide;
    const [activeTab, setActiveTab] = useState<TabKey>('related');

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        }).toUpperCase();
    };

    const getReadTime = (content?: string) => {
        if (!content) return '3m';
        const words = content.split(' ').length;
        const minutes = Math.ceil(words / 200);
        return `${minutes}m`;
    };

    const getCategoryLabel = (item: ContentItem) => {
        switch (item.type) {
            case 'TWEET': return 'Social';
            case 'COMMENT': return 'Reaction';
            case 'PODCAST': return 'Podcast';
            case 'VIDEO': return 'Video';
            default: return 'Culture & Society';
        }
    };

    const getRelatedBadge = (item: ContentItem) => {
        switch (item.type) {
            case 'TWEET': return 'Opinion';
            case 'COMMENT': return 'Reaction';
            case 'VIDEO': return 'Video';
            case 'PODCAST': return 'Audio';
            default: return 'Market';
        }
    };

    const getRelatedMeta = (item: ContentItem) => {
        switch (item.type) {
            case 'TWEET': return getReadTime(item.body_text);
            case 'COMMENT': return '2h ago';
            default: return 'Business';
        }
    };

    return (
        <div className="w-full h-full snap-start shrink-0 overflow-hidden flex flex-col bg-[#0a0a0a] text-[#e5e5e5] relative">
            {/* ═══════════════ TOP HALF: Hero ═══════════════ */}
            <div className="h-[50%] w-full flex flex-col px-4 pt-14 pb-4 relative z-10">
                {/* Hero Image */}
                <div className="w-full h-[65%] rounded-lg overflow-hidden mb-5 shadow-2xl border border-white/5 relative group">
                    {featured.thumbnail_url ? (
                        <div
                            className="w-full h-full bg-cover bg-center transform group-hover:scale-105 transition-transform duration-700"
                            style={{ backgroundImage: `url(${featured.thumbnail_url})` }}
                        />
                    ) : (
                        <div className="w-full h-full bg-[#1c1c1c] flex items-center justify-center">
                            <span className="text-4xl opacity-20">📰</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                {/* Title & Author */}
                <div>
                    <h1 className="font-serif text-3xl leading-tight font-bold mb-3 text-white line-clamp-2">
                        {featured.title || 'Untitled Article'}
                    </h1>
                    <div className="flex items-center gap-2">
                        <img
                            alt="Author"
                            className="w-5 h-5 rounded-full border border-bronze object-cover"
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${featured.author || featured.source_name}`}
                        />
                        <span className="text-xs text-[#a3a3a3] font-light italic">
                            By {featured.author || featured.source_name || 'Unknown'}
                        </span>
                    </div>
                </div>
            </div>

            {/* ═══════════════ BOTTOM HALF: Related Sheet ═══════════════ */}
            <div className="absolute bottom-0 left-0 w-full h-[50%] z-20 flex flex-col bg-[#141414] rounded-t-[2rem] shadow-[0_-15px_50px_rgba(0,0,0,0.8)] border-t border-white/5">
                {/* Drag handle */}
                <div className="w-full pt-4 pb-2 flex justify-center">
                    <div className="w-10 h-1 rounded-full bg-bronze opacity-30" />
                </div>

                {/* Tabs & content */}
                <div className="flex flex-col h-full overflow-hidden px-6 pb-8 pt-2">
                    {/* Tab bar */}
                    <div className="flex items-center justify-between mb-5 border-b border-white/5">
                        <div className="flex gap-6">
                            <button
                                onClick={() => setActiveTab('related')}
                                className={cn(
                                    'font-serif text-xs tracking-widest pb-3 transition-colors uppercase',
                                    activeTab === 'related'
                                        ? 'text-bronze font-bold border-b-2 border-bronze'
                                        : 'text-[#a3a3a3] hover:text-bronze'
                                )}
                            >
                                Related
                            </button>
                            <button
                                onClick={() => setActiveTab('discussion')}
                                className={cn(
                                    'font-serif text-xs tracking-widest pb-3 transition-colors uppercase',
                                    activeTab === 'discussion'
                                        ? 'text-bronze font-bold border-b-2 border-bronze'
                                        : 'text-[#a3a3a3] hover:text-bronze'
                                )}
                            >
                                Discussion
                            </button>
                        </div>
                    </div>

                    {/* Scrollable content area */}
                    <div className="flex-1 overflow-y-auto hide-scrollbar space-y-3">
                        {activeTab === 'related' ? (
                            /* ── Related articles ── */
                            related.length > 0 ? (
                                related.slice(0, 4).map((item) => (
                                    <article
                                        key={item.id}
                                        className="bg-[#1c1c1c] rounded-xl p-2.5 flex gap-3 hover:bg-white/5 transition-colors cursor-pointer group border border-white/5 items-center"
                                        onClick={() => onOpenArticle(item)}
                                    >
                                        {/* Thumbnail or icon */}
                                        <div className="w-14 h-14 shrink-0 overflow-hidden rounded-md bg-zinc-800">
                                            {item.thumbnail_url ? (
                                                <div
                                                    className="w-full h-full bg-cover bg-center opacity-90 group-hover:opacity-100 transition-opacity"
                                                    style={{ backgroundImage: `url(${item.thumbnail_url})` }}
                                                />
                                            ) : item.type === 'COMMENT' ? (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-700">
                                                    <Quote className="w-5 h-5 text-bronze/60" />
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-700">
                                                    <span className="text-lg opacity-30">📄</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex flex-col justify-center flex-1 min-w-0 pr-1">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <span className="text-[8px] text-bronze uppercase tracking-wider font-bold">
                                                    {getRelatedBadge(item)}
                                                </span>
                                                <div className="flex items-center gap-1 text-[9px] text-zinc-500">
                                                    {item.type === 'ARTICLE' ? (
                                                        <>
                                                            <TrendingUp className="w-[10px] h-[10px]" />
                                                            {getRelatedMeta(item)}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock className="w-[10px] h-[10px]" />
                                                            {getRelatedMeta(item)}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {item.title ? (
                                                <h4 className="font-serif text-[14px] leading-snug text-zinc-100 group-hover:text-white line-clamp-2">
                                                    {item.title}
                                                </h4>
                                            ) : (
                                                <p className="text-[13px] leading-snug text-zinc-300 italic line-clamp-2">
                                                    &ldquo;{item.body_text?.slice(0, 80)}...&rdquo;
                                                </p>
                                            )}
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <div className="flex items-center justify-center h-24 text-zinc-500 text-sm">
                                    No related stories available
                                </div>
                            )
                        ) : (
                            /* ── Discussion tab ── */
                            <div className="flex flex-col items-center justify-center h-32 text-zinc-500">
                                <p className="text-sm mb-1">Discussion coming soon</p>
                                <p className="text-xs opacity-60">Join the conversation</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════════ FAB Button ═══════════════ */}
            <div className="absolute bottom-6 right-6 z-30">
                <button className="w-14 h-14 rounded-full bg-bronze text-[#0a0a0a] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                    <Plus className="w-7 h-7" strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}
