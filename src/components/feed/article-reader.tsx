'use client';

import { useState } from 'react';

import { X, Clock, CalendarDays, Share2, Bookmark, Heart, MessageCircle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useFeedStore } from '@/lib/stores';
import { useLikeMutation, useBookmarkMutation } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import type { ContentItem } from '@/types';

interface ArticleReaderProps {
    article: ContentItem | null;
    onClose: () => void;
}

/** Detect if text contains HTML tags */
const isHtml = (text: string) => /<[a-z][\s\S]*>/i.test(text);

/** Strip dangerous tags and attributes, keep safe markup */
function sanitizeHtml(html: string): string {
    return html
        // Remove script, iframe, object, embed, form tags entirely
        .replace(/<(script|iframe|object|embed|form)[^>]*>[\s\S]*?<\/\1>/gi, '')
        .replace(/<(script|iframe|object|embed|form)[^>]*\/?>/gi, '')
        // Remove on* event handlers
        .replace(/\s+on\w+="[^"]*"/gi, '')
        .replace(/\s+on\w+='[^']*'/gi, '')
        // Remove style attributes (prevents injected styles)
        .replace(/\s+style="[^"]*"/gi, '')
        .replace(/\s+style='[^']*'/gi, '');
}

function BodyContent({ text }: { text: string }) {
    if (isHtml(text)) {
        return (
            <div
                dir="auto"
                className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-p:text-foreground/90 prose-img:rounded-sm prose-img:my-4 prose-a:text-news-accent max-w-none font-sans text-base [&_img]:w-full [&_img]:h-auto"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }}
            />
        );
    }

    // Plain text: split by newlines into paragraphs
    return (
        <div dir="auto" className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-p:text-foreground/90 max-w-none font-sans text-base">
            {text.split('\n').map((paragraph, i) => {
                if (!paragraph.trim()) return null;
                return (
                    <p key={i} className="mb-5 last:mb-0">
                        {paragraph}
                    </p>
                );
            })}
        </div>
    );
}

export function ArticleReader({ article, onClose }: ArticleReaderProps) {
    if (!article) return null;

    return <ArticleReaderInner article={article} onClose={onClose} />;
}

function CommentsSection({ article }: { article: ContentItem }) {
    const [commentText, setCommentText] = useState('');
    const { likedIds, bookmarkedIds } = useFeedStore();
    const likeMutation = useLikeMutation();
    const bookmarkMutation = useBookmarkMutation();
    const isLiked = likedIds.has(article.id);
    const isBookmarked = bookmarkedIds.has(article.id);

    return (
        <div className="px-6 pb-20">
            {/* Action bar */}
            <div className="flex items-center justify-between py-4 border-t border-foreground/10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => likeMutation.mutate({ contentId: article.id, isLiked })}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-news-accent transition-colors"
                    >
                        <Heart className={cn('w-5 h-5', isLiked && 'text-news-accent fill-news-accent')} />
                        <span className="text-xs font-medium">{article.like_count || 0}</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-xs font-medium">{article.comment_count || 0}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => bookmarkMutation.mutate({ contentId: article.id, isBookmarked })}
                        className="text-muted-foreground hover:text-news-accent transition-colors"
                    >
                        <Bookmark className={cn('w-5 h-5', isBookmarked && 'text-news-accent fill-news-accent')} />
                    </button>
                    <button
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({ title: article.title, url: window.location.href }).catch(() => {});
                            } else {
                                navigator.clipboard.writeText(window.location.href);
                            }
                        }}
                        className="text-muted-foreground hover:text-news-accent transition-colors"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Comments heading */}
            <h3 className="text-sm font-bold text-foreground mb-4">Comments</h3>

            {/* Comment input */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-news-accent/20 flex items-center justify-center shrink-0 border border-foreground/10">
                    <span className="text-xs font-bold text-news-accent">Y</span>
                </div>
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full bg-muted/50 border border-foreground/10 rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-news-accent/50 transition-colors"
                    />
                    {commentText.trim() && (
                        <button
                            className="absolute end-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-news-accent flex items-center justify-center"
                            aria-label="Send comment"
                        >
                            <Send className="w-3.5 h-3.5 text-white" />
                        </button>
                    )}
                </div>
            </div>

            {/* Placeholder comments */}
            <div className="space-y-4">
                <p className="text-xs text-muted-foreground text-center py-6">No comments yet. Be the first to share your thoughts!</p>
            </div>
        </div>
    );
}

function ArticleReaderInner({ article, onClose }: { article: ContentItem; onClose: () => void }) {

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
                <div className="flex items-center justify-between p-4 sticky top-0 z-10 bg-background border-b border-foreground/20">
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
                            <span className="px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-news-accent/10 text-news-accent border border-news-accent/20">
                                {getCategoryLabel(article)}
                            </span>
                        </div>

                        <h1 dir="auto" className="text-2xl md:text-3xl font-serif font-bold text-foreground leading-tight mb-4">
                            {article.title || article.excerpt?.slice(0, 100) || 'Untitled'}
                        </h1>

                        <div className="flex items-center gap-3 py-4 border-y border-foreground/20">
                            <div className="w-10 h-10 rounded-sm bg-news-accent/20 flex items-center justify-center overflow-hidden border border-foreground/20">
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
                    <div className="px-6 py-4">
                        {article.body_text || article.excerpt ? (
                            <BodyContent text={article.body_text || article.excerpt || ''} />
                        ) : (
                            <p className="text-muted-foreground italic text-center py-10">
                                Full text content is not available for this item.
                            </p>
                        )}
                    </div>

                    {/* Comments Section */}
                    <CommentsSection article={article} />
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
