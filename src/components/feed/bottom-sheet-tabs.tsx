'use client';

import { useState } from 'react';
import { MessageCircle, FileText, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabKey = 'comments' | 'transcript' | 'about';

interface BottomSheetTabsProps {
    /** Number of comments to display in the tab badge */
    commentCount?: number;
    /** Whether transcript is available */
    hasTranscript?: boolean;
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
    title,
    description,
    author,
    tags,
}: BottomSheetTabsProps) {
    const [activeTab, setActiveTab] = useState<TabKey>('comments');

    return (
        <div className="flex flex-col h-full">
            {/* Tab bar */}
            <div className="flex border-b border-border/40 mb-3 gap-1">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all',
                            activeTab === tab.key
                                ? 'text-bronze border-b-2 border-bronze bg-bronze/5'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                        )}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                        {tab.key === 'comments' && commentCount > 0 && (
                            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-bronze/20 text-bronze">
                                {commentCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'comments' && (
                    <CommentsTab commentCount={commentCount} />
                )}
                {activeTab === 'transcript' && (
                    <TranscriptTab hasTranscript={hasTranscript} />
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
                <div className="w-8 h-8 rounded-full bg-bronze/30 flex items-center justify-center text-xs font-bold text-bronze shrink-0">
                    Y
                </div>
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Add a comment..."
                        className="w-full px-3 py-2 text-sm rounded-full bg-muted/50 border border-border/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-bronze/50 focus:border-bronze/40"
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
                            <p className="text-sm text-foreground/80 mt-0.5 leading-relaxed">{comment.text}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

// ── Transcript Tab ──────────────────────────────────────────

function TranscriptTab({ hasTranscript }: { hasTranscript: boolean }) {
    if (!hasTranscript) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No transcript available</p>
                <p className="text-xs mt-1">Transcript will appear here when ready</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Auto-generated transcript</p>
            <div className="space-y-2.5 text-sm text-foreground/80 leading-relaxed">
                <p><span className="text-bronze font-semibold text-xs mr-2">0:00</span>Welcome to today&apos;s episode. We&apos;re going to be discussing...</p>
                <p><span className="text-bronze font-semibold text-xs mr-2">0:15</span>This topic is really important because...</p>
                <p><span className="text-bronze font-semibold text-xs mr-2">0:32</span>Let me share some insights from our research...</p>
                <p><span className="text-bronze font-semibold text-xs mr-2">0:48</span>The key takeaway here is that we need to focus on...</p>
            </div>
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
                    <h3 className="text-sm font-bold text-foreground leading-snug">{title}</h3>
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
                    <p className="text-sm text-foreground/80 leading-relaxed">{description}</p>
                </div>
            )}

            {tags && tags.length > 0 && (
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">Topics</p>
                    <div className="flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-bronze/10 text-bronze border border-bronze/20"
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
