'use client';

import { Clock, TrendingUp, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NewsSlide as NewsSlideType, ContentItem } from '@/types';

interface NewsSlideProps {
    slide: NewsSlideType;
    isActive: boolean;
    onOpenArticle: (item: ContentItem) => void;
}

/**
 * Cinematic news slide with a top-half hero area and
 * a bottom-half section showing related articles.
 */
export function NewsSlide({ slide, isActive, onOpenArticle }: NewsSlideProps) {
    const { featured, related } = slide;

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
        if (item.type === 'TWEET') return 'Social';
        if (item.type === 'COMMENT') return 'Reaction';
        if (item.type === 'PODCAST') return 'Podcast';
        if (item.type === 'VIDEO') return 'Video';
        // For ARTICLEs, derive category from topic_tags if available
        if (item.topic_tags && item.topic_tags.length > 0) {
            const newsTag = item.topic_tags.find(t => t.startsWith('news-'));
            if (newsTag) {
                const cat = newsTag.replace('news-', '');
                return cat.charAt(0).toUpperCase() + cat.slice(1);
            }
            if (item.topic_tags.includes('news')) return 'News';
        }
        return item.source_name || 'News';
    };

    const getRelatedBadge = (item: ContentItem) => {
        if (item.type === 'TWEET') return 'Opinion';
        if (item.type === 'COMMENT') return 'Reaction';
        if (item.type === 'VIDEO') return 'Video';
        if (item.type === 'PODCAST') return 'Audio';
        // ARTICLE: use topic_tags-derived category
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
        // For articles, show estimated read time from body_text or excerpt
        if (item.type === 'ARTICLE') return getReadTime(item.body_text || item.excerpt);
        return '';
    };

    const getFeaturedTitle = (item: ContentItem) =>
        item.title || item.excerpt?.slice(0, 100) || item.body_text?.slice(0, 100) || 'Untitled';

    const hasEnoughContent = (item: ContentItem) => {
        const textLength = (item.body_text?.length || 0) + (item.excerpt?.length || 0);
        return textLength > 150 || item.type === 'VIDEO' || item.type === 'PODCAST';
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
                <div className="w-full aspect-[2/1] rounded-lg overflow-hidden mb-3 shadow-md border border-border relative group">
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                {/* Title & Author */}
                <div className="relative">
                    <h1 className={cn(
                        "font-serif text-xl leading-tight font-bold mb-1.5 text-foreground line-clamp-2 transition-colors duration-300",
                        hasEnoughContent(featured) && "group-hover/hero:text-gold"
                    )}>
                        {getFeaturedTitle(featured)}
                    </h1>
                    {(featured.excerpt || featured.body_text) && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                            {featured.excerpt || featured.body_text?.slice(0, 160)}
                        </p>
                    )}
                    <div className="flex items-center gap-2">
                        <img
                            alt="Author"
                            className="w-5 h-5 rounded-full border border-gold object-cover"
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${featured.author || featured.source_name}`}
                        />
                        <span className="text-xs text-muted-foreground font-light italic">
                            {featured.source_name || featured.author || 'Unknown'}
                        </span>
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
                            <article
                                key={item.id}
                                className={cn(
                                    "bg-muted/50 rounded-xl p-2.5 flex gap-3 transition-colors border border-border items-center",
                                    hasEnoughContent(item) ? "hover:bg-muted cursor-pointer group" : "opacity-90"
                                )}
                                onClick={() => hasEnoughContent(item) ? onOpenArticle(item) : undefined}
                            >
                                {/* Thumbnail or icon */}
                                <div className="w-14 h-14 shrink-0 overflow-hidden rounded-md bg-muted">
                                    {item.thumbnail_url ? (
                                        <div
                                            className="w-full h-full bg-cover bg-center opacity-90 group-hover:opacity-100 transition-opacity"
                                            style={{ backgroundImage: `url(${item.thumbnail_url})` }}
                                        />
                                    ) : item.type === 'COMMENT' ? (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/80">
                                            <Quote className="w-5 h-5 text-gold/60" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/80">
                                            <span className="text-lg opacity-30">📄</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex flex-col justify-center flex-1 min-w-0 pr-1">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <span className="text-[8px] text-gold uppercase tracking-wider font-bold">
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
                                    {item.title ? (
                                        <h4 className="font-serif text-[14px] leading-snug text-foreground group-hover:text-foreground line-clamp-2">
                                            {item.title}
                                        </h4>
                                    ) : (
                                        <p className="text-[13px] leading-snug text-muted-foreground italic line-clamp-2">
                                            &ldquo;{item.body_text?.slice(0, 80)}...&rdquo;
                                        </p>
                                    )}
                                </div>
                            </article>
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
