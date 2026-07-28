'use client';

import { type MouseEvent } from 'react';
import { Bookmark, FileText, Heart, Mic, Play, Rss, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDuration, formatRelativeTime } from '@/lib/utils/time';
import { useI18n, useTranslations } from '@/lib/i18n';
import type { ContentItem, ContentType } from '@/types';

const TYPE_BADGE_STYLES: Record<ContentType, string> = {
    NEWS: 'bg-news-accent/20 text-news-accent border-news-accent/30',
    ARTICLE: 'bg-news-accent/20 text-news-accent border-news-accent/30',
    PODCAST: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    VIDEO: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
    TWEET: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
    COMMENT: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
};

const TYPE_LABEL_KEYS: Record<ContentType, string> = {
    NEWS: 'saved.badge.article',
    ARTICLE: 'saved.badge.article',
    PODCAST: 'saved.badge.podcast',
    VIDEO: 'saved.badge.video',
    TWEET: 'saved.badge.tweet',
    COMMENT: 'saved.badge.comment',
};

/** Whether the item plays in the Pods overlay (vs. opening as an article). */
export function isPodsItem(item: ContentItem): boolean {
    return item.type === 'VIDEO' || item.type === 'PODCAST';
}

function sourceImageFromName(sourceName?: string): string | null {
    if (!sourceName) return null;
    const compact = sourceName.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').trim();
    if (!compact || compact.includes(' ')) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(compact)}&sz=128`;
}

function savedTimestamp(item: ContentItem): string | undefined {
    return item.bookmarked_at || item.published_at || item.created_at;
}

/** Trailing affordance: a filled bookmark (un-save) or heart (un-like). */
export interface SavedRowAction {
    kind: 'bookmark' | 'like';
    ariaLabel: string;
    onClick: (event: MouseEvent<HTMLButtonElement>, item: ContentItem) => void;
}

export function SavedRow({
    item,
    onOpen,
    action,
    metaLabelKey = 'saved.savedAt',
}: {
    item: ContentItem;
    onOpen: (item: ContentItem) => void;
    action?: SavedRowAction;
    metaLabelKey?: string;
}) {
    const t = useTranslations();
    const { locale } = useI18n();
    const badgeClass = TYPE_BADGE_STYLES[item.type] ?? 'bg-muted text-muted-foreground border-border';
    const badgeLabel = t(TYPE_LABEL_KEYS[item.type] ?? 'saved.badge.article');
    const duration = formatDuration(item.duration_sec);
    const timestamp = formatRelativeTime(savedTimestamp(item), locale);
    const fallbackImage = sourceImageFromName(item.source_name);
    const displayImage = item.thumbnail_url || item.source_image_url || fallbackImage;
    const title = item.title || item.body_text?.slice(0, 90) || t('saved.item.untitled');
    const ActionIcon = action?.kind === 'like' ? Heart : Bookmark;

    return (
        <article className="bg-card rounded-xl p-3 flex gap-3 items-center border border-border hover:bg-muted/50 transition-colors group">
            <button
                type="button"
                onClick={() => onOpen(item)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {displayImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={displayImage}
                            alt=""
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                            {isPodsItem(item) ? (
                                item.type === 'VIDEO' ? (
                                    <Video className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                    <Mic className="h-5 w-5 text-muted-foreground" />
                                )
                            ) : (
                                <FileText className="h-5 w-5 text-muted-foreground" />
                            )}
                        </div>
                    )}
                    {isPodsItem(item) && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
                            <Play className="h-5 w-5 fill-white text-white drop-shadow" />
                        </span>
                    )}
                    {duration && (
                        <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[9px] font-mono text-white">
                            {duration}
                        </span>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                        <span className={cn('rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider', badgeClass)}>
                            {badgeLabel}
                        </span>
                        {item.source_name && (
                            <span className="flex min-w-0 items-center gap-1 text-[9px] text-muted-foreground">
                                <Rss className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate">{item.source_name}</span>
                            </span>
                        )}
                    </div>
                    <h3 dir="auto" className="line-clamp-2 font-serif text-sm leading-snug text-foreground">
                        {title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                        {item.author && <span className="truncate max-w-[120px]">{item.author}</span>}
                        {timestamp && <span className="shrink-0">{t(metaLabelKey, { time: timestamp })}</span>}
                    </div>
                </div>
            </button>

            {action && (
                <button
                    type="button"
                    onClick={(event) => action.onClick(event, item)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-news-accent hover:bg-news-accent/10 transition-colors disabled:opacity-50"
                    aria-label={action.ariaLabel}
                >
                    <ActionIcon className="h-4 w-4 fill-news-accent" />
                </button>
            )}
        </article>
    );
}
