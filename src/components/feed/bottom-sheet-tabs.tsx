'use client';

import { useMemo, useState } from 'react';
import { MessageCircle, FileText, Info, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';
import { shareContent } from '@/lib/utils/share';
import { readComments, addComment as persistComment, type LocalComment } from '@/lib/utils/comments';
import { useTranscript, useRequestTranscription } from '@/lib/hooks';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { ContentType } from '@/types';

type TabKey = 'comments' | 'transcript' | 'about';

type CommentItem = LocalComment;

interface BottomSheetTabsProps {
    /** Number of comments to display in the tab badge */
    commentCount?: number;
    /** Whether transcript is available */
    hasTranscript?: boolean;
    /** Transcript public ID for fetching content */
    transcriptId?: string;
    /** Content item ID for on-demand transcript generation */
    contentItemId?: string;
    /** Content type for share deep-linking fallback */
    contentType?: ContentType;
    /** Item title for the About tab */
    title?: string;
    /** Item description / excerpt */
    description?: string;
    /** Item author */
    author?: string;
    /** Topic tags */
    tags?: string[];
}

const TABS: { key: TabKey; labelKey: string; icon: typeof MessageCircle }[] = [
    { key: 'comments', labelKey: 'comments.title', icon: MessageCircle },
    { key: 'transcript', labelKey: 'transcript.title', icon: FileText },
    { key: 'about', labelKey: 'about.title', icon: Info },
];

/**
 * Tabbed content displayed inside the expanded bottom sheet.
 * Currently uses placeholder/mock content for Comments and Transcript.
 */
export function BottomSheetTabs({
    commentCount = 0,
    hasTranscript = false,
    transcriptId,
    contentItemId,
    contentType,
    title,
    description,
    author,
    tags,
}: BottomSheetTabsProps) {
    const t = useTranslations();
    const [activeTab, setActiveTab] = useState<TabKey>('comments');
    // Derive comments from storage during render (recomputed when the active
    // item changes, or when commentVersion bumps after adding one) — no effect,
    // no setState-in-render.
    const [commentVersion, setCommentVersion] = useState(0);
    const comments = useMemo<CommentItem[]>(
        () => (contentItemId ? readComments(contentItemId) : []),
        [contentItemId, commentVersion]
    );

    const totalComments = commentCount + comments.length;

    const addComment = (text: string) => {
        if (!contentItemId) return;
        persistComment(contentItemId, text);
        setCommentVersion((v) => v + 1);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Tab bar */}
            <div className="flex items-center border-b border-border/40 mb-3 pr-2">
                <div className="flex gap-1 flex-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all',
                                activeTab === tab.key
                                    ? 'text-news-accent border-b-2 border-news-accent bg-news-accent/5'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                            )}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {t(tab.labelKey)}
                            {tab.key === 'comments' && totalComments > 0 && (
                                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-news-accent/20 text-news-accent">
                                    {totalComments}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Relocated Share Button */}
                <button
                    onClick={() => {
                        shareContent({
                            title: title || t('share.title'),
                            text: description || t('share.description'),
                            item: contentItemId && contentType ? { id: contentItemId, type: contentType } : null,
                        }).catch(() => {});
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-muted/30 rounded-lg text-muted-foreground hover:text-foreground transition-all"
                    aria-label={t('share.action')}
                >
                    <Share2 className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">{t('share.action')}</span>
                </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'comments' && (
                    <CommentsTab
                        commentCount={commentCount}
                        comments={comments}
                        onAddComment={addComment}
                    />
                )}
                {activeTab === 'transcript' && (
                    <TranscriptTab hasTranscript={hasTranscript} transcriptId={transcriptId} contentItemId={contentItemId} />
                )}
                {activeTab === 'about' && (
                    <AboutTab
                        title={title}
                        description={description}
                        author={author}
                        tags={tags}
                    />
                )}
            </div>
        </div>
    );
}

// ── Comments Tab ────────────────────────────────────────────

function CommentsTab({
    commentCount,
    comments,
    onAddComment,
}: {
    commentCount: number;
    comments: CommentItem[];
    onAddComment: (text: string) => void;
}) {
    const t = useTranslations();
    const [draft, setDraft] = useState('');
    const allComments = comments;

    const submit = () => {
        onAddComment(draft);
        setDraft('');
    };

    return (
        <div className="space-y-3">
            {/* Comment input */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-news-accent/30 flex items-center justify-center text-xs font-bold text-news-accent shrink-0">
                    Y
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
                        disabled={!draft.trim()}
                        className="px-3 py-1.5 text-xs font-semibold rounded-full bg-news-accent text-white disabled:opacity-50"
                    >
                        {t('comments.post')}
                    </button>
                </div>

            {/* Comments list */}
            {commentCount === 0 && allComments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <MessageCircle className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-sm">{t('comments.empty')}</p>
                    <p className="text-xs mt-1">{t('comments.emptyHint')}</p>
                </div>
            ) : (
                allComments.map((comment) => (
                    <div key={comment.id} className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0 mt-0.5">
                            {comment.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-foreground">{comment.author}</span>
                                <span className="text-[10px] text-muted-foreground">{comment.time}</span>
                            </div>
                            <p dir="auto" className="text-sm text-foreground/80 mt-0.5 leading-relaxed">{comment.text}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

// ── Transcript Tab ──────────────────────────────────────────

function formatTimestamp(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function TranscriptTab({ hasTranscript, transcriptId, contentItemId }: { hasTranscript: boolean; transcriptId?: string; contentItemId?: string }) {
    const t = useTranslations();
    const { isAuthenticated } = useAuthStore();
    const triggerMutation = useRequestTranscription();
    const { data: transcript, isLoading, error } = useTranscript(
        hasTranscript ? transcriptId : null
    );

    if (!hasTranscript) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">{t('transcript.unavailable')}</p>

                {isAuthenticated && contentItemId ? (
                    triggerMutation.isSuccess ? (
                        <p className="text-xs mt-2 text-news-accent">
                            {t('transcript.generating')}
                        </p>
                    ) : (
                        <button
                            onClick={() => triggerMutation.mutate(contentItemId)}
                            disabled={triggerMutation.isPending}
                            className="mt-3 px-4 py-2 text-xs font-semibold bg-news-accent text-white rounded-lg hover:bg-news-accent/90 disabled:opacity-50 transition-all"
                        >
                            {triggerMutation.isPending ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {t('transcript.generating')}
                                </span>
                            ) : (
                                t('transcript.generate')
                            )}
                        </button>
                    )
                ) : (
                    <p className="text-xs mt-1">{t('transcript.signIn')}</p>
                )}

                {triggerMutation.isError && (
                    <p className="text-xs mt-2 text-destructive">
                        {(triggerMutation.error as Error)?.message || t('transcript.failed')}
                    </p>
                )}
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <div className="w-6 h-6 border-2 border-news-accent/30 border-t-news-accent rounded-full animate-spin mb-3" />
                <p className="text-sm">{t('transcript.loading')}</p>
            </div>
        );
    }

    if (error || !transcript) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">{t('transcript.failed')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">
                {t('transcript.autoGenerated')}
                {transcript.language && (
                    <span className="ml-2 normal-case">({transcript.language})</span>
                )}
            </p>

            {transcript.word_timestamps && transcript.word_timestamps.length > 0 ? (
                <div className="space-y-2.5 text-sm text-foreground/80 leading-relaxed">
                    {transcript.word_timestamps.map((segment, i) => (
                        <p key={i} dir="auto">
                            <span className="text-news-accent font-semibold text-xs mr-2">
                                {formatTimestamp(segment.start)}
                            </span>
                            {segment.text}
                        </p>
                    ))}
                </div>
            ) : (
                <p dir="auto" className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {transcript.full_text}
                </p>
            )}
        </div>
    );
}

// ── About Tab ───────────────────────────────────────────────

function AboutTab({
    title,
    description,
    author,
    tags,
}: {
    title?: string;
    description?: string;
    author?: string;
    tags?: string[];
}) {
    const t = useTranslations();
    return (
        <div className="space-y-4">
            {title && (
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">{t('about.titleLabel')}</p>
                    <h3 dir="auto" className="text-sm font-bold text-foreground leading-snug">{title}</h3>
                </div>
            )}

            {author && (
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">{t('about.by')}</p>
                    <p className="text-sm text-foreground">{author}</p>
                </div>
            )}

            {description && (
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">{t('about.description')}</p>
                    <p dir="auto" className="text-sm text-foreground/80 leading-relaxed">{description}</p>
                </div>
            )}

            {tags && tags.length > 0 && (
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">{t('about.topics')}</p>
                    <div className="flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-news-accent/10 text-news-accent border border-news-accent/20"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
