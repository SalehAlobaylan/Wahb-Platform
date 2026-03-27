'use client';

import { useState } from 'react';
import { Clock, TrendingUp, Quote, ChevronLeft, Heart, Bookmark, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFeedStore } from '@/lib/stores';
import { useLikeMutation, useBookmarkMutation } from '@/lib/hooks';
import type { NewsSlide as NewsSlideType, ContentItem } from '@/types';

/** Detect if text contains HTML tags */
const isHtml = (text: string) => /<[a-z][\s\S]*>/i.test(text);

/**
 * Collapse newlines and multiple whitespace into a single space for
 * single-line / line-clamped display. Preserves the full text for
 * expanded / body views.
 */
const normalizeForTitle = (text: string): string =>
    text.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

/**
 * Count meaningful characters: letters + digits only, no spaces, punctuation,
 * or Unicode directional/formatting marks (U+200F RTL mark, U+200E LTR mark, etc.).
 */
const meaningfulCharCount = (text: string): number =>
    (text.match(/[\p{L}\p{N}]/gu) ?? []).length;

/**
 * Pick the best display title for a related item.
 *
 * Telegram/Twitter content often uses a short temporal or attribution header as
 * `title` (e.g. "الأسبوع الماضي ..", "خلال العام القادم ..", "رئيس الحكومة :"),
 * with the real news only in `body_text`. We detect these by:
 *   • title ends with a header-suffix (:  ،  ..  …)
 *   • OR fewer than 20 meaningful (letter/digit) characters after stripping whitespace
 * In those cases we fall through to body_text which contains the full content.
 */
const getRelatedDisplayTitle = (item: ContentItem): string => {
    const title = item.title?.trim() ?? '';
    const HEADER_SUFFIXES = [':', '،', '..', '…'];
    const isHeaderSuffix = HEADER_SUFFIXES.some(s => title.endsWith(s));
    const isTooShort = meaningfulCharCount(title) < 20;

    if (title && !isHeaderSuffix && !isTooShort) {
        return normalizeForTitle(title);
    }
    // Fall through to body_text — it contains the complete content
    const body = item.body_text ?? item.excerpt ?? '';
    if (body) return normalizeForTitle(body);
    return title || 'Untitled';
};

/** Strip dangerous tags and attributes, keep safe markup */
function sanitizeHtml(html: string): string {
    return html
        .replace(/<(script|iframe|object|embed|form)[^>]*>[\s\S]*?<\/\1>/gi, '')
        .replace(/<(script|iframe|object|embed|form)[^>]*\/?>/gi, '')
        .replace(/\s+on\w+="[^"]*"/gi, '')
        .replace(/\s+on\w+='[^']*'/gi, '')
        .replace(/\s+style="[^"]*"/gi, '')
        .replace(/\s+style='[^']*'/gi, '');
}

/** Strip all HTML tags to get plain text */
function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

interface NewsSlideProps {
    slide: NewsSlideType;
    isActive: boolean;
    onOpenArticle: (item: ContentItem) => void;
}

/* ── Helpers ──────────────────────────────────────────────── */

const getReadTime = (content?: string) => {
    if (!content) return '3m';
    const words = content.split(' ').length;
    const minutes = Math.ceil(words / 200);
    return `${minutes}m`;
};

const getRelatedBadge = (item: ContentItem) => {
    if (item.type === 'TWEET') return 'Opinion';
    if (item.type === 'COMMENT') return 'Reaction';
    if (item.type === 'VIDEO') return 'Video';
    if (item.type === 'PODCAST') return 'Audio';
    if (item.topic_tags) {
        if (item.topic_tags.includes('news-politics')) return 'Politics';
        if (item.topic_tags.includes('news-economy')) return 'Economy';
        if (item.topic_tags.includes('news-conflict')) return 'Conflict';
        if (item.topic_tags.includes('news-disaster')) return 'Disaster';
        if (item.topic_tags.includes('news')) return 'News';
    }
    return 'Article';
};

const getRelatedMeta = (item: ContentItem) => {
    if (item.type === 'TWEET') return getReadTime(item.body_text);
    if (item.type === 'COMMENT') return '2h ago';
    if (item.type === 'ARTICLE') return getReadTime(item.body_text || item.excerpt);
    return '';
};

const hasEnoughContent = (item: ContentItem) => {
    const textLength = (item.body_text?.length || 0) + (item.excerpt?.length || 0);
    return textLength > 150 || item.type === 'VIDEO' || item.type === 'PODCAST';
};

const getExpandableText = (item: ContentItem) => {
    return item.excerpt || item.body_text?.slice(0, 400) || '';
};

/** Plain text version for length checks */
const getPlainExpandableText = (item: ContentItem) => {
    const raw = getExpandableText(item);
    return isHtml(raw) ? stripHtml(raw) : raw;
};

const getFeaturedTitle = (item: ContentItem) => {
    const raw = item.title || item.excerpt?.slice(0, 100) || item.body_text?.slice(0, 100) || 'Untitled';
    return normalizeForTitle(raw);
};

/* ── Expandable Related Item ─────────────────────────────── */

function RelatedItem({
    item,
    onOpenArticle,
    isExpanded,
    onToggleExpand,
}: {
    item: ContentItem;
    onOpenArticle: (item: ContentItem) => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
}) {
    const { likedIds, bookmarkedIds } = useFeedStore();
    const likeMutation = useLikeMutation();
    const bookmarkMutation = useBookmarkMutation();
    const expandableText = getExpandableText(item);
    const plainExpand = getPlainExpandableText(item);
    const displayedTitle = getRelatedDisplayTitle(item);
    const expandMeaningful = meaningfulCharCount(plainExpand);
    const titleMeaningful = meaningfulCharCount(displayedTitle);
    // Count non-empty lines in the raw text — multi-line content (bullet lists,
    // paragraphs) is worth expanding even when char counts match, because the
    // expanded panel renders proper line breaks while the title collapses them.
    const nonEmptyLines = plainExpand.split('\n').filter(l => l.trim().length > 2).length;
    const canExpand = expandMeaningful > 40 && (
        nonEmptyLines > 2 ||                      // structured / multi-line content
        expandMeaningful - titleMeaningful > 30    // genuinely more prose than shown
    );
    const isLiked = likedIds.has(item.id);
    const isBookmarked = bookmarkedIds.has(item.id);

    const handleCardClick = () => {
        if (canExpand) {
            onToggleExpand();
        }
    };

    const handleOpenArticle = (e: React.MouseEvent) => {
        e.stopPropagation();
        onOpenArticle(item);
    };

    return (
        <article
            className={cn(
                'bg-muted/50 rounded-sm p-2.5 transition-colors border border-foreground/20',
                canExpand ? 'hover:bg-muted cursor-pointer group' : 'opacity-90'
            )}
            onClick={handleCardClick}
        >
            {/* Top row: thumbnail + title + arrow */}
            <div className="flex gap-3 items-center">
                {/* Thumbnail or icon */}
                <div className="w-14 h-14 shrink-0 overflow-hidden rounded-sm bg-secondary">
                    {item.thumbnail_url ? (
                        <div
                            className="w-full h-full bg-cover bg-center opacity-90 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundImage: `url(${item.thumbnail_url})` }}
                        />
                    ) : item.type === 'COMMENT' ? (
                        <div className="w-full h-full flex items-center justify-center bg-secondary">
                            <Quote className="w-5 h-5 text-news-accent/60" />
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary">
                            <span className="text-lg opacity-30">📄</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex flex-col justify-center flex-1 min-w-0 pe-1">
                    <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-[8px] text-news-accent uppercase tracking-wider font-bold">
                            {getRelatedBadge(item)}
                        </span>
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
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
                    <h4 dir="auto" className={cn(
                        'font-serif text-[14px] leading-snug text-foreground group-hover:text-foreground',
                        !isExpanded && 'line-clamp-2'
                    )}>
                        {getRelatedDisplayTitle(item)}
                    </h4>
                </div>

                {/* Side arrow → opens article reader */}
                {hasEnoughContent(item) && (
                    <button
                        onClick={handleOpenArticle}
                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-sm text-muted-foreground hover:text-news-accent hover:bg-foreground/10 transition-all"
                        aria-label="Open article"
                    >
                        <ChevronLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                    </button>
                )}
            </div>

            {/* Inline action buttons */}
            <div className="flex items-center gap-3 mt-2 ps-0.5">
                <button
                    onClick={(e) => { e.stopPropagation(); likeMutation.mutate({ contentId: item.id, isLiked }); }}
                    className="flex items-center gap-1 text-muted-foreground hover:text-news-accent transition-colors"
                    aria-label="Like"
                >
                    <Heart className={cn('w-3.5 h-3.5', isLiked && 'text-news-accent fill-news-accent')} />
                    <span className="text-[10px]">{item.like_count || 0}</span>
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); bookmarkMutation.mutate({ contentId: item.id, isBookmarked }); }}
                    className="flex items-center gap-1 text-muted-foreground hover:text-news-accent transition-colors"
                    aria-label="Bookmark"
                >
                    <Bookmark className={cn('w-3.5 h-3.5', isBookmarked && 'text-news-accent fill-news-accent')} />
                </button>
            </div>

            {/* Expanded text */}
            <div className={cn(
                'overflow-hidden transition-all duration-200 ease-in-out',
                isExpanded ? 'max-h-[400px] opacity-100 mt-2.5' : 'max-h-0 opacity-0'
            )}>
                <div className="border-t border-foreground/10 pt-2.5 ps-1">
                    {isHtml(expandableText) ? (
                        <div
                            dir="auto"
                            className="text-[13px] text-foreground/80 leading-relaxed [&_img]:w-full [&_img]:h-auto [&_img]:rounded-sm [&_img]:my-2"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(expandableText) }}
                        />
                    ) : (
                        <p dir="auto" className="text-[13px] text-foreground/80 leading-relaxed">
                            {expandableText}
                        </p>
                    )}
                </div>
            </div>
        </article>
    );
}

/* ── Main Component ──────────────────────────────────────── */

/**
 * Cinematic news slide with a top-half hero area and
 * a bottom-half section showing related articles.
 */
export function NewsSlide({ slide, isActive, onOpenArticle }: NewsSlideProps) {
    const { featured, related } = slide;
    const { likedIds, bookmarkedIds } = useFeedStore();
    const likeMutation = useLikeMutation();
    const bookmarkMutation = useBookmarkMutation();
    const isFeaturedLiked = likedIds.has(featured.id);
    const isFeaturedBookmarked = bookmarkedIds.has(featured.id);

    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

    const handleToggleExpanded = (itemId: string) => {
        setExpandedItemId(prev => prev === itemId ? null : itemId);
    };

    return (
        <div className="w-full h-full snap-start shrink-0 overflow-hidden flex flex-col bg-background text-foreground">
            {/* ═══════════════ TOP: Featured Hero ═══════════════ */}
            <div 
                className={cn(
                    "shrink-0 w-full flex flex-col px-4 pt-14 pb-3 relative group/hero",
                    hasEnoughContent(featured) && "cursor-pointer"
                )}
                onClick={() => hasEnoughContent(featured) ? onOpenArticle(featured) : undefined}
            >
                {/* Hero Image */}
                <div className="w-full aspect-[2/1] rounded-sm overflow-hidden mb-3 border border-foreground/20 relative group">
                    {featured.thumbnail_url ? (
                        <div
                            className={cn(
                                "w-full h-full bg-cover bg-center transition-transform duration-500",
                                hasEnoughContent(featured) && "group-hover/hero:scale-[1.02]"
                            )}
                            style={{ backgroundImage: `url(${featured.thumbnail_url})` }}
                        />
                    ) : (
                        <div className={cn(
                            "w-full h-full bg-card flex items-center justify-center transition-transform duration-500",
                            hasEnoughContent(featured) && "group-hover/hero:scale-[1.02]"
                        )}>
                            <span className="text-4xl opacity-20">📰</span>
                        </div>
                    )}

                </div>

                {/* Title & Author */}
                <div className="relative">
                    <h1 dir="auto" className={cn(
                        "font-serif text-xl leading-tight font-bold mb-1.5 text-foreground line-clamp-2 transition-colors duration-300",
                        hasEnoughContent(featured) && "group-hover/hero:text-news-accent"
                    )}>
                        {getFeaturedTitle(featured)}
                    </h1>
                    {(featured.excerpt || featured.body_text) && (
                        <p dir="auto" className="text-sm text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                            {normalizeForTitle(featured.excerpt || featured.body_text?.slice(0, 160) || '')}
                        </p>
                    )}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img
                                alt="Author"
                                className="w-5 h-5 rounded-sm border border-foreground/20 object-cover"
                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${featured.author || featured.source_name}`}
                            />
                            <span className="text-xs text-muted-foreground font-light italic">
                                {featured.source_name || featured.author || 'Unknown'}
                            </span>
                        </div>
                        {/* Featured action buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={(e) => { e.stopPropagation(); likeMutation.mutate({ contentId: featured.id, isLiked: isFeaturedLiked }); }}
                                className="flex items-center gap-1 text-muted-foreground hover:text-news-accent transition-colors"
                                aria-label="Like"
                            >
                                <Heart className={cn('w-4 h-4', isFeaturedLiked && 'text-news-accent fill-news-accent')} />
                                <span className="text-[11px]">{featured.like_count || 0}</span>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); bookmarkMutation.mutate({ contentId: featured.id, isBookmarked: isFeaturedBookmarked }); }}
                                className="text-muted-foreground hover:text-news-accent transition-colors"
                                aria-label="Bookmark"
                            >
                                <Bookmark className={cn('w-4 h-4', isFeaturedBookmarked && 'text-news-accent fill-news-accent')} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (navigator.share) {
                                        navigator.share({ title: featured.title, url: window.location.href }).catch(() => {});
                                    } else {
                                        navigator.clipboard.writeText(window.location.href);
                                    }
                                }}
                                className="text-muted-foreground hover:text-news-accent transition-colors"
                                aria-label="Share"
                            >
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════ Divider ═══════════════ */}
            <div className="shrink-0 mx-4">
                <div className="h-px bg-border" />
            </div>

            {/* ═══════════════ BOTTOM: Related ═══════════════ */}
            <div className="flex-1 min-h-0 flex flex-col px-4 pt-3 pb-24">
                <h3 className="shrink-0 font-serif text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2">Related</h3>

                <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar space-y-2">
                    {related.length > 0 ? (
                        related.slice(0, 4).map((item) => (
                            <RelatedItem
                                key={item.id}
                                item={item}
                                onOpenArticle={onOpenArticle}
                                isExpanded={expandedItemId === item.id}
                                onToggleExpand={() => handleToggleExpanded(item.id)}
                            />
                        ))
                    ) : (
                        <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                            No related available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
