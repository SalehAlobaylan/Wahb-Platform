'use client';

import { useState } from 'react';
import { MessageCircle, FileText, Info, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';
import { shareContent } from '@/lib/utils/share';
import { useComments, useTranscript, useRequestTranscription } from '@/lib/hooks';
import { useAuthStore } from '@/lib/stores/auth-store';
import { CommentsPanel } from './comments-panel';
import type { ContentType } from '@/types';

type TabKey = 'comments' | 'transcript' | 'about';

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
    // Badge count: prefer the live fetched total (includes optimistic posts)
    // over the feed item's possibly-stale comment_count.
    const { data: commentsData } = useComments(contentItemId);
    const fetchedCount = commentsData?.pages.reduce((sum, page) => sum + page.items.length, 0) ?? 0;
    const totalComments = Math.max(commentCount, fetchedCount);

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
                    <CommentsPanel contentItemId={contentItemId} />
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
