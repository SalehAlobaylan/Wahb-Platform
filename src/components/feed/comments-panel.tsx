'use client';

import { useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { useComments, useAddCommentMutation } from '@/lib/hooks';
import { useAuthStore } from '@/lib/stores/auth-store';
import { formatRelativeTime } from '@/lib/utils/time';
import { useI18n, useTranslations } from '@/lib/i18n';
import type { ContentComment } from '@/types';

/**
 * Server-backed comments: input + list with optimistic posting and
 * cursor-paginated "load more". Shared by the For You / News bottom sheets
 * and the ArticleReader so there is exactly one implementation.
 */
export function CommentsPanel({ contentItemId }: { contentItemId?: string }) {
    const t = useTranslations();
    const { locale } = useI18n();
    const { user } = useAuthStore();
    const [draft, setDraft] = useState('');

    const {
        data,
        isLoading,
        isError,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
    } = useComments(contentItemId);
    const addMutation = useAddCommentMutation(contentItemId ?? '');

    const comments = data?.pages.flatMap((page) => page.items) ?? [];

    const submit = () => {
        const text = draft.trim();
        if (!text || !contentItemId) return;
        addMutation.mutate({ text });
        setDraft('');
    };

    const displayName = (comment: ContentComment) =>
        comment.is_mine ? t('comments.you') : comment.author || t('comments.guest');

    const myInitial = (user?.username || user?.email || t('comments.guest'))[0]?.toUpperCase() ?? '?';

    return (
        <div className="space-y-3">
            {/* Comment input */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-news-accent/30 flex items-center justify-center text-xs font-bold text-news-accent shrink-0">
                    {myInitial}
                </div>
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder={t('comments.placeholder')}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                submit();
                            }
                        }}
                        className="w-full px-3 py-2 text-sm rounded-full bg-muted/50 border border-border/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-news-accent/50 focus:border-news-accent/40"
                    />
                </div>
                <button
                    type="button"
                    onClick={submit}
                    disabled={!draft.trim() || !contentItemId}
                    className="w-9 h-9 rounded-full bg-news-accent text-white disabled:opacity-50 flex items-center justify-center shrink-0"
                    aria-label={t('comments.post')}
                >
                    <Send className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* States */}
            {isLoading ? (
                <div className="flex justify-center py-6">
                    <div className="w-5 h-5 border-2 border-news-accent/30 border-t-news-accent rounded-full animate-spin" />
                </div>
            ) : isError ? (
                <p className="text-xs text-muted-foreground text-center py-6">{t('comments.failed')}</p>
            ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <MessageCircle className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-sm">{t('comments.empty')}</p>
                    <p className="text-xs mt-1">{t('comments.emptyHint')}</p>
                </div>
            ) : (
                <>
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0 mt-0.5">
                                {displayName(comment)[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-foreground">
                                        {displayName(comment)}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {formatRelativeTime(comment.created_at, locale)}
                                    </span>
                                </div>
                                <p dir="auto" className="text-sm text-foreground/80 mt-0.5 leading-relaxed">
                                    {comment.text}
                                </p>
                            </div>
                        </div>
                    ))}

                    {hasNextPage && (
                        <button
                            type="button"
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="w-full py-2 text-xs text-news-accent font-semibold hover:bg-muted/30 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isFetchingNextPage ? t('comments.loading') : t('comments.loadMore')}
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
