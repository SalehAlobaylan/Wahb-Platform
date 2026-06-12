'use client';

import { useState } from 'react';
import { Clock, TrendingUp, Quote, ChevronLeft, Heart, Bookmark, Share2, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adjustedLikeCount } from '@/lib/utils/engagement';
import { formatRelativeTime } from '@/lib/utils/time';
import { useTranslations } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/context';
import { useFeedStore } from '@/lib/stores';
import { useLikeMutation, useBookmarkMutation } from '@/lib/hooks';
import { shareContent } from '@/lib/utils/share';
import { isHtml, sanitizeHtml, stripHtml } from '@/lib/utils/html';
import type { NewsSlide as NewsSlideType, ContentItem } from '@/types';

/**
 * Collapse newlines and multiple whitespace into a single space for
 * single-line / line-clamped display. Preserves the full text for
 * expanded / body views.
 */
const normalizeForTitle = (text: string): string =>
    text.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

const normalizeForCompare = (text: string): string =>
    normalizeForTitle(isHtml(text) ? stripHtml(text) : text)
        .replace(/[\u200e\u200f\u061c]/g, '')
        .replace(/[^\p{L}\p{N}]+/gu, '')
        .toLowerCase();

const isSameDisplayText = (a: string, b: string): boolean => {
    const left = normalizeForCompare(a);
    const right = normalizeForCompare(b);
    return left.length > 0 && left === right;
};

const firstMeaningfulLine = (text: string): string => {
    const plain = isHtml(text) ? stripHtml(text) : text;
    return plain
        .split(/\r?\n/)
        .map(line => line.trim())
        .find(line => meaningfulCharCount(line) > 8) || plain.trim();
};

const compactBodyTitle = (text: string): string => {
    const line = firstMeaningfulLine(text);
    const bulletIndex = line.search(/[•▪●◦-]\s*/u);
    const colonIndex = line.search(/[:：]\s*/u);
    const cutAt = [bulletIndex, colonIndex]
        .filter(index => index > 20)
        .sort((a, b) => a - b)[0];
    const compact = cutAt ? line.slice(0, cutAt + 1) : line;
    return normalizeForTitle(compact).slice(0, 180).trim();
};

const sourceImageFromName = (sourceName?: string): string | undefined => {
    const value = sourceName?.trim();
    if (!value || value.includes(' ')) return undefined;
    const domain = value.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    if (!domain || !domain.includes('.')) return undefined;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
};

const getDisplayImageUrl = (item: ContentItem): string | undefined =>
    item.thumbnail_url || item.source_image_url || sourceImageFromName(item.source_name);

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
    const body = item.body_text ?? item.excerpt ?? '';
    const HEADER_SUFFIXES = [':', '،', '..', '…'];
    const isHeaderSuffix = HEADER_SUFFIXES.some(s => title.endsWith(s));
    const isTooShort = meaningfulCharCount(title) < 20;
    const titleDuplicatesBody = Boolean(body) && isSameDisplayText(title, body);

    if (title && !isHeaderSuffix && !isTooShort && !titleDuplicatesBody) {
        return normalizeForTitle(title);
    }
    // Fall through to body_text — but render only a compact headline so the
    // expanded panel can reveal the full structured text without duplication.
    if (body) return compactBodyTitle(body);
    return title || 'Untitled';
};

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
    if (item.type === 'TWEET') return 'news.badge.opinion';
    if (item.type === 'COMMENT') return 'news.badge.reaction';
    if (item.type === 'VIDEO') return 'news.badge.video';
    if (item.type === 'PODCAST') return 'news.badge.audio';
    if (item.topic_tags) {
        if (item.topic_tags.includes('news-politics')) return 'news.badge.politics';
        if (item.topic_tags.includes('news-economy')) return 'news.badge.economy';
        if (item.topic_tags.includes('news-conflict')) return 'news.badge.conflict';
        if (item.topic_tags.includes('news-disaster')) return 'news.badge.disaster';
        if (item.topic_tags.includes('news')) return 'news.badge.news';
    }
    return 'news.badge.article';
};

const getRelatedMeta = (item: ContentItem, t: (key: string, vars?: Record<string, string | number>) => string) => {
    if (item.type === 'TWEET') return getReadTime(item.body_text);
    if (item.type === 'COMMENT') return t('news.meta.comment', { count: 2 });
    if (item.type === 'ARTICLE') return getReadTime(item.body_text || item.excerpt);
    return '';
};

const hasEnoughContent = (item: ContentItem) => {
    const textLength = (item.body_text?.length || 0) + (item.excerpt?.length || 0);
    return textLength > 150 || item.type === 'VIDEO' || item.type === 'PODCAST';
};

const getExpandableText = (item: ContentItem) => {
    const title = getRelatedDisplayTitle(item);
    const candidates = [item.excerpt, item.body_text].filter(
        (value): value is string => Boolean(value?.trim())
    );
    return candidates.find((value) => {
        const plain = isHtml(value) ? stripHtml(value) : value;
        return !isSameDisplayText(plain, title) || meaningfulCharCount(plain) - meaningfulCharCount(title) > 30;
    }) || '';
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
    const t = useTranslations();
    const { locale } = useI18n();
    const likeMutation = useLikeMutation();
    const bookmarkMutation = useBookmarkMutation();
    const publishedAgo = formatRelativeTime(item.published_at, locale);
    const expandableText = getExpandableText(item);
    const plainExpand = getPlainExpandableText(item);
    const displayedTitle = getRelatedDisplayTitle(item);
    const imageUrl = getDisplayImageUrl(item);
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
    const isLiked = useFeedStore((s) => s.likedIds.has(item.id));
    const isBookmarked = useFeedStore((s) => s.bookmarkedIds.has(item.id));

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
                    {imageUrl ? (
                        <div
                            className="w-full h-full bg-cover bg-center opacity-90 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundImage: `url(${imageUrl})` }}
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
                                {t(getRelatedBadge(item))}
                            </span>
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                            {publishedAgo ? (
                                <>
                                    <Clock className="w-[10px] h-[10px]" />
                                    {publishedAgo}
                                </>
                            ) : item.type === 'ARTICLE' ? (
                                <>
                                    <TrendingUp className="w-[10px] h-[10px]" />
                                    {getRelatedMeta(item, t)}
                                </>
                            ) : null}
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
                        aria-label={t('news.badge.article')}
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
                    <span className="text-[10px]">{adjustedLikeCount(item.like_count, item.is_liked, isLiked)}</span>
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
// `isActive` stays in the props contract (callers pass it; future
// active-slide behaviors will need it) but is currently unused.
export function NewsSlide({ slide, onOpenArticle }: NewsSlideProps) {
    const { featured, related, story } = slide;
    const t = useTranslations();
    const { locale } = useI18n();
    const featuredPublishedAgo = formatRelativeTime(featured.published_at, locale);
    const likeMutation = useLikeMutation();
    const bookmarkMutation = useBookmarkMutation();
    const featuredImageUrl = getDisplayImageUrl(featured);
    const isFeaturedLiked = useFeedStore((s) => s.likedIds.has(featured.id));
    const isFeaturedBookmarked = useFeedStore((s) => s.bookmarkedIds.has(featured.id));

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
                    {featuredImageUrl ? (
                        <div
                            className={cn(
                                "w-full h-full bg-cover bg-center transition-transform duration-500",
                                hasEnoughContent(featured) && "group-hover/hero:scale-[1.02]"
                            )}
                            style={{ backgroundImage: `url(${featuredImageUrl})` }}
                        />
                    ) : (
                        <div className={cn(
                            "w-full h-full bg-card flex items-center justify-center transition-transform duration-500",
                            hasEnoughContent(featured) && "group-hover/hero:scale-[1.02]"
                        )}>
                            <span className="text-4xl opacity-20">📰</span>
                        </div>
                    )}

                    {/* Story coverage chip — the aggregation signal: this slide
                        is a STORY grouping several posts (and, when sources
                        overlap, several outlets), not a single article. */}
                    {story && (
                        <div className="absolute bottom-2 start-2 z-10 inline-flex items-center gap-1.5 rounded-sm bg-background/90 backdrop-blur-sm border border-foreground/20 px-2 py-1 shadow-sm">
                            <Layers className="w-3 h-3 text-news-accent" />
                            <span className="text-[10px] font-bold tracking-wide text-foreground leading-none">
                                {t('news.story.posts', { count: story.memberCount })}
                                {story.sourceCount > 1 && (
                                    <span className="text-muted-foreground font-medium">
                                        {' · '}
                                        {t('news.story.sources', { count: story.sourceCount })}
                                    </span>
                                )}
                            </span>
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
                                {featured.source_name || featured.author || t('saved.item.untitled')}
                            </span>
                            {featuredPublishedAgo && (
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    {featuredPublishedAgo}
                                </span>
                            )}
                        </div>
                        {/* Featured action buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={(e) => { e.stopPropagation(); likeMutation.mutate({ contentId: featured.id, isLiked: isFeaturedLiked }); }}
                                className="flex items-center gap-1 text-muted-foreground hover:text-news-accent transition-colors"
                                aria-label={t('profile.guest.feature.likes')}
                            >
                                <Heart className={cn('w-4 h-4', isFeaturedLiked && 'text-news-accent fill-news-accent')} />
                                <span className="text-[11px]">{adjustedLikeCount(featured.like_count, featured.is_liked, isFeaturedLiked)}</span>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); bookmarkMutation.mutate({ contentId: featured.id, isBookmarked: isFeaturedBookmarked }); }}
                                className="text-muted-foreground hover:text-news-accent transition-colors"
                                aria-label={t('saved.title')}
                            >
                                <Bookmark className={cn('w-4 h-4', isFeaturedBookmarked && 'text-news-accent fill-news-accent')} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    shareContent({
                                        title: featured.title,
                                        text: featured.excerpt || featured.body_text,
                                        item: featured,
                                    }).catch(() => {});
                                }}
                                className="text-muted-foreground hover:text-news-accent transition-colors"
                                aria-label={t('share.action')}
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
                <h3 className="shrink-0 font-serif text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2">{t('news.related')}</h3>

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
                            {t('news.related.empty')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
