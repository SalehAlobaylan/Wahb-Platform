'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Clock, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NewsSlide as NewsSlideType, ContentItem } from '@/types';

interface NewsSlideProps {
    slide: NewsSlideType;
    isActive: boolean;
    onOpenArticle: (item: ContentItem) => void;
}

/**
 * Magazine-style news slide with 1 Featured + 3 Related items
 */
export function NewsSlide({ slide, isActive, onOpenArticle }: NewsSlideProps) {
    const { featured, related } = slide;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const getReadTime = (content?: string) => {
        if (!content) return '3 min';
        const words = content.split(' ').length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min`;
    };

    return (
        <div className="w-full h-full snap-start shrink-0 overflow-hidden flex flex-col bg-secondary text-foreground">
            {/* Header */}
            <header className="px-6 pt-14 pb-3 border-b-2 border-foreground flex justify-between items-center shrink-0">
                <p className="text-xs font-bold tracking-widest uppercase">
                    {formatDate(new Date().toISOString())}
                </p>
                <span className="text-[10px] font-bold uppercase tracking-widest text-bronze">
                    Wahb News
                </span>
            </header>

            {/* Main Content */}
            <main className="px-6 py-4 flex flex-col flex-grow overflow-hidden">
                {/* Featured Article */}
                <motion.article
                    className="mb-4 group cursor-pointer border-b-2 border-foreground pb-4 shrink-0"
                    onClick={() => onOpenArticle(featured)}
                    whileTap={{ scale: 0.98 }}
                >
                    {/* Featured Image */}
                    <div className="h-40 w-full bg-muted relative overflow-hidden group-hover:grayscale transition-all duration-500 mb-4 rounded-sm border border-foreground">
                        {featured.thumbnail_url ? (
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: `url(${featured.thumbnail_url})` }}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Radio className="w-16 h-16 opacity-20" />
                            </div>
                        )}
                        <div className="absolute top-2 right-2 px-2 py-1 bg-bronze text-white text-[9px] font-bold uppercase tracking-wider">
                            Featured
                        </div>
                    </div>

                    {/* Featured Content */}
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
                            <span>{formatDate(featured.published_at)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {getReadTime(featured.body_text)}
                            </span>
                        </div>

                        <h2 className="text-2xl font-bold font-serif leading-tight mb-2 group-hover:text-bronze transition-colors line-clamp-2">
                            {featured.title}
                        </h2>

                        <p className="text-sm opacity-80 mb-3 leading-relaxed line-clamp-2">
                            {featured.excerpt || featured.body_text?.slice(0, 150)}
                        </p>

                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest border-b border-foreground pb-0.5">
                                By {featured.author || featured.source_name}
                            </span>
                            <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:text-bronze transition-all" />
                        </div>
                    </div>
                </motion.article>

                {/* Related Section Header */}
                <div className="flex justify-between items-end border-b border-foreground mb-2 pb-1 shrink-0">
                    <h3 className="text-lg font-bold font-serif italic">Related Stories</h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                        {related.length} items
                    </span>
                </div>

                {/* Related Items */}
                <div className="flex flex-col space-y-1 overflow-hidden flex-1">
                    {related.slice(0, 3).map((item, idx) => (
                        <motion.article
                            key={item.id}
                            className="group cursor-pointer py-3 border-b border-foreground/20 flex flex-col hover:bg-muted transition-colors px-2 rounded-sm"
                            onClick={() => onOpenArticle(item)}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="flex justify-between items-baseline mb-0.5">
                                <span className={cn(
                                    "text-[9px] font-bold uppercase tracking-widest",
                                    item.type === 'TWEET' ? 'text-bronze' :
                                        item.type === 'COMMENT' ? 'text-muted-foreground' : 'text-bronze'
                                )}>
                                    {item.type === 'TWEET' ? '𝕏 Post' :
                                        item.type === 'COMMENT' ? 'Comment' : 'Article'}
                                </span>
                                <span className="text-[9px] font-bold opacity-50">
                                    {formatDate(item.published_at)}
                                </span>
                            </div>

                            {item.title ? (
                                <h3 className="text-base font-bold font-serif leading-tight group-hover:text-bronze transition-colors line-clamp-1">
                                    {item.title}
                                </h3>
                            ) : (
                                <p className="text-sm leading-snug opacity-80 line-clamp-2">
                                    {item.body_text}
                                </p>
                            )}

                            {item.author && (
                                <span className="text-[10px] opacity-50 mt-1">
                                    — {item.author}
                                </span>
                            )}
                        </motion.article>
                    ))}
                </div>

                {/* Footer decoration */}
                <div className="mt-auto pt-4 text-center opacity-30 shrink-0">
                    <div className="w-8 h-1 bg-bronze mx-auto rounded-full" />
                </div>
            </main>
        </div>
    );
}
