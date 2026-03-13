'use client';

import { X, Clock, CalendarDays, Share2, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import type { ContentItem } from '@/types';

interface ArticleReaderProps {
    article: ContentItem | null;
    onClose: () => void;
}

export function ArticleReader({ article, onClose }: ArticleReaderProps) {
    if (!article) return null;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getReadTime = (content?: string) => {
        if (!content) return '3m';
        const words = content.split(' ').length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min read`;
    };

    const getCategoryLabel = (item: ContentItem) => {
        if (item.type === 'TWEET') return 'Social';
        if (item.type === 'COMMENT') return 'Reaction';
        if (item.topic_tags && item.topic_tags.length > 0) {
            const newsTag = item.topic_tags.find(t => t.startsWith('news-'));
            if (newsTag) {
                const cat = newsTag.replace('news-', '');
                return cat.charAt(0).toUpperCase() + cat.slice(1);
            }
            if (item.topic_tags.includes('news')) return 'News';
        }
        return item.source_name || 'News Article';
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden w-full h-full sm:max-w-md sm:mx-auto"
            >
                {/* Header Navbar */}
                <div className="flex items-center justify-between p-4 sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted text-foreground transition-colors"
                        aria-label="Close reader"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <button className="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
                            <Bookmark className="w-5 h-5" />
                        </button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Article Content - Scrollable Region */}
                <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
                    {/* Hero Image (if available) */}
                    {article.thumbnail_url && (
                        <div className="w-full aspect-[16/9] relative">
                            <div
                                className="w-full h-full bg-cover bg-center"
                                style={{ backgroundImage: `url(${article.thumbnail_url})` }}
                            />
                        </div>
                    )}

                    {/* Metadata & Title */}
                    <div className="px-6 pt-6 pb-2">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gold/10 text-gold border border-gold/20">
                                {getCategoryLabel(article)}
                            </span>
                        </div>

                        <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground leading-tight mb-4">
                            {article.title || article.excerpt?.slice(0, 100) || 'Untitled'}
                        </h1>

                        <div className="flex items-center gap-3 py-4 border-y border-border">
                            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center overflow-hidden border border-border">
                                <img
                                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${article.author || article.source_name || 'Wahb'}`}
                                    alt="Author avatar"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">
                                    {article.author || article.source_name || 'Unknown Author'}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                    <span className="flex items-center gap-1">
                                        <CalendarDays className="w-3 h-3" />
                                        {formatDate(article.published_at)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {getReadTime(article.body_text)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Body Text */}
                    <div className="px-6 py-4 pb-20">
                        {article.body_text || article.excerpt ? (
                            <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-p:text-foreground/90 max-w-none font-sans text-base">
                                {/* Splitting by newline to simulate paragraphs if pure text comes in */}
                                {(article.body_text || article.excerpt)?.split('\n').map((paragraph, i) => {
                                    if (!paragraph.trim()) return null;
                                    return (
                                        <p key={i} className="mb-5 last:mb-0">
                                            {paragraph}
                                        </p>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic text-center py-10">
                                Full text content is not available for this item.
                            </p>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
