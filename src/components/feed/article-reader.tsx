'use client';

import { X, Clock, CalendarDays, Share2, Bookmark, Heart, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeedStore } from '@/lib/stores';
import { useLikeMutation, useBookmarkMutation, useContentItem } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { shareContent } from '@/lib/utils/share';
import { adjustedLikeCount } from '@/lib/utils/engagement';
import { formatArticleDate } from '@/lib/utils/time';
import { useTranslations } from '@/lib/i18n/use-translations';
import { useI18n } from '@/lib/i18n/context';
import { isHtml, sanitizeHtml } from '@/lib/utils/html';
import { CommentsPanel } from './comments-panel';
import type { ContentItem } from '@/types';

interface ArticleReaderProps {
    article: ContentItem | null;
    onClose: () => void;
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

const sourceImageFromName = (sourceName?: string): string | undefined => {
    const value = sourceName?.trim();
    if (!value || value.includes(' ')) return undefined;
    const domain = value.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    if (!domain || !domain.includes('.')) return undefined;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
};

const getDisplayImageUrl = (item: ContentItem): string | undefined =>
    item.thumbnail_url || item.source_image_url || sourceImageFromName(item.source_name);

export function ArticleReader({ article, onClose }: ArticleReaderProps) {
    // AnimatePresence must stay mounted across open/close for the exit
    // (slide-down) animation to run, so it lives above the conditional and the
    // inner element is keyed by article id.
    return (
        <AnimatePresence>
            {article && <ArticleReaderInner key={article.id} article={article} onClose={onClose} />}
        </AnimatePresence>
    );
}

function CommentsSection({ article }: { article: ContentItem }) {
    const isLiked = useFeedStore((s) => s.likedIds.has(article.id));
    const isBookmarked = useFeedStore((s) => s.bookmarkedIds.has(article.id));
    const likeMutation = useLikeMutation();
    const bookmarkMutation = useBookmarkMutation();
    const t = useTranslations();

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
                        <span className="text-xs font-medium">{adjustedLikeCount(article.like_count, article.is_liked, isLiked)}</span>
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
                            shareContent({
                                title: article.title,
                                text: article.excerpt || article.body_text,
                                item: article,
                            }).catch(() => {});
                        }}
                        className="text-muted-foreground hover:text-news-accent transition-colors"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Comments heading */}
            <h3 className="text-sm font-bold text-foreground mb-4">{t('articleReader.comments')}</h3>

            <CommentsPanel contentItemId={article.id} />
        </div>
    );
}

function ArticleReaderInner({ article: feedItem, onClose }: { article: ContentItem; onClose: () => void }) {
    const t = useTranslations();
    const { locale } = useI18n();
    // Feed payloads truncate body_text (news feed caps it at 600 chars), so
    // fetch the full item and overlay it on the feed item. The feed copy
    // renders immediately; the complete body swaps in when the fetch lands.
    const { data: fullItem } = useContentItem(feedItem.id);
    const article: ContentItem = fullItem
        ? {
              ...feedItem,
              ...fullItem,
              // Never let an omitted field from the detail response blank out
              // text we already had from the feed.
              title: fullItem.title || feedItem.title,
              body_text: fullItem.body_text || feedItem.body_text,
              excerpt: fullItem.excerpt || feedItem.excerpt,
              thumbnail_url: fullItem.thumbnail_url || feedItem.thumbnail_url || feedItem.source_image_url,
              source_image_url: fullItem.source_image_url || feedItem.source_image_url,
              published_at: fullItem.published_at || feedItem.published_at,
          }
        : feedItem;
    const isBookmarked = useFeedStore((s) => s.bookmarkedIds.has(article.id));
    const bookmarkMutation = useBookmarkMutation();
    const publishedDate = formatArticleDate(article.published_at, locale);
    const articleImageUrl = getDisplayImageUrl(article);

    const getReadTime = (content?: string) => {
        if (!content) return '3m';
        const words = content.split(' ').length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min read`;
    };
    
    const getCategoryLabel = (item: ContentItem) => {
        if (item.type === 'TWEET') return t('articleReader.category.social');
        if (item.type === 'COMMENT') return t('articleReader.category.reaction');
        if (item.topic_tags && item.topic_tags.length > 0) {
            const newsTag = item.topic_tags.find(t => t.startsWith('news-'));
            if (newsTag) {
                const cat = newsTag.replace('news-', '');
                return t(`articleReader.category.${cat}`);
            }
            if (item.topic_tags.includes('news')) return t('articleReader.category.news');
        }
        if (item.source_name) {
            return item.source_name;
        }
        return t('articleReader.category.newsArticle');
    };

    return (
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
                         aria-label={t('articleReader.close')}
                     >
                         <X className="w-5 h-5" />
                     </button>
                     <div className="flex items-center gap-2">
                         <button
                                 onClick={() => bookmarkMutation.mutate({ contentId: article.id, isBookmarked })}
                                 className="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                                 aria-label={t('articleReader.bookmark')}>
                             <Bookmark className={cn('w-5 h-5', isBookmarked && 'text-news-accent fill-news-accent')} />
                         </button>
                         <button
                                 onClick={() => {
                                     shareContent({
                                         title: article.title,
                                         text: article.excerpt || article.body_text,
                                         item: article,
                                     }).catch(() => {});
                                 }}
                                 className="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                                 aria-label={t('articleReader.share')}>
                             <Share2 className="w-5 h-5" />
                         </button>
                     </div>
                 </div>

                {/* Article Content - Scrollable Region */}
                <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
                    {/* Hero Image (if available) */}
                    {articleImageUrl && (
                        <div className="w-full aspect-[16/9] relative">
                            <div
                                className="w-full h-full bg-cover bg-center"
                                style={{ backgroundImage: `url(${articleImageUrl})` }}
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
                                    {publishedDate && (
                                        <span className="flex items-center gap-1">
                                            <CalendarDays className="w-3 h-3" />
                                            {publishedDate}
                                        </span>
                                    )}
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
    );
}
