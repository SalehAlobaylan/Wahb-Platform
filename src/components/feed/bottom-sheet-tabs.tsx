'use client';

import { useState } from 'react';
import { MessageCircle, FileText, Info, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranscript, useRequestTranscription } from '@/lib/hooks';
import { useAuthStore } from '@/lib/stores/auth-store';

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
    /** Item title for the About tab */
    title?: string;
    /** Item description / excerpt */
    description?: string;
    /** Item author */
    author?: string;
    /** Topic tags */
    tags?: string[];
}

const TABS: { key: TabKey; label: string; icon: typeof MessageCircle }[] = [
    { key: 'comments', label: 'Comments', icon: MessageCircle },
    { key: 'transcript', label: 'Transcript', icon: FileText },
    { key: 'about', label: 'About', icon: Info },
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
    title,
    description,
    author,
    tags,
}: BottomSheetTabsProps) {
    const [activeTab, setActiveTab] = useState<TabKey>('comments');

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
                            {tab.label}
                            {tab.key === 'comments' && commentCount > 0 && (
                                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-news-accent/20 text-news-accent">
                                    {commentCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Relocated Share Button */}
                <button
                    onClick={() => {
                        if (navigator.share) {
                            navigator.share({
                                title: title || 'Wahb Post',
                                text: description || 'Check out this post on Wahb',
                                url: window.location.href,
                            }).catch(() => { });
                        } else {
                            navigator.clipboard.writeText(window.location.href);
                        }
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-muted/30 rounded-lg text-muted-foreground hover:text-foreground transition-all"
                    aria-label="Share Post"
                >
                    <Share2 className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Share</span>
                </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'comments' && (
                    <CommentsTab commentCount={commentCount} />
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

function CommentsTab({ commentCount }: { commentCount: number }) {
    const mockComments = [
        { id: '1', author: 'Ahmed', text: 'ماشاء الله، محتوى رائع! 🔥', time: '2h ago', avatar: 'A' },
        { id: '2', author: 'Sara', text: 'شكراً على المشاركة', time: '4h ago', avatar: 'S' },
        { id: '3', author: 'Omar', text: 'Very insightful discussion', time: '6h ago', avatar: 'O' },
    ];

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
                        placeholder="Add a comment..."
                        className="w-full px-3 py-2 text-sm rounded-full bg-muted/50 border border-border/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-news-accent/50 focus:border-news-accent/40"
                    />
                </div>
            </div>

            {/* Comments list */}
            {commentCount === 0 && mockComments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <MessageCircle className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-sm">No comments yet</p>
                    <p className="text-xs mt-1">Be the first to comment</p>
                </div>
            ) : (
                mockComments.map((comment) => (
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
    const { isAuthenticated } = useAuthStore();
    const triggerMutation = useRequestTranscription();
    const { data: transcript, isLoading, error } = useTranscript(
        hasTranscript ? transcriptId : null
    );

    if (!hasTranscript) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No transcript available</p>

                {isAuthenticated && contentItemId ? (
                    triggerMutation.isSuccess ? (
                        <p className="text-xs mt-2 text-news-accent">
                            Transcript is being generated. Check back shortly.
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
                                    Generating...
                                </span>
                            ) : (
                                'Generate Transcript'
                            )}
                        </button>
                    )
                ) : (
                    <p className="text-xs mt-1">Sign in to generate a transcript</p>
                )}

                {triggerMutation.isError && (
                    <p className="text-xs mt-2 text-destructive">
                        {(triggerMutation.error as Error)?.message || 'Failed to generate. Try again later.'}
                    </p>
                )}
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <div className="w-6 h-6 border-2 border-news-accent/30 border-t-news-accent rounded-full animate-spin mb-3" />
                <p className="text-sm">Loading transcript...</p>
            </div>
        );
    }

    if (error || !transcript) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">Could not load transcript</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">
                Auto-generated transcript
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
    return (
        <div className="space-y-4">
            {title && (
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Title</p>
                    <h3 dir="auto" className="text-sm font-bold text-foreground leading-snug">{title}</h3>
                </div>
            )}

            {author && (
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">By</p>
                    <p className="text-sm text-foreground">{author}</p>
                </div>
            )}

            {description && (
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Description</p>
                    <p dir="auto" className="text-sm text-foreground/80 leading-relaxed">{description}</p>
                </div>
            )}

            {tags && tags.length > 0 && (
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">Topics</p>
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
