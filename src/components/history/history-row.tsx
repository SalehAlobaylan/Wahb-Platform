'use client';

import { Play } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatDuration, formatRelativeTime } from '@/lib/utils/time';
import type { WatchHistoryItem } from '@/lib/api/feeds';

/**
 * A single watch/listen-history row (thumbnail + title + source · relative
 * time). Shared by the Settings History panel and the profile History tab.
 */
export function HistoryRow({
    item,
    onOpen,
}: {
    item: WatchHistoryItem;
    onOpen: (item: WatchHistoryItem) => void;
}) {
    const { locale } = useI18n();
    const duration = formatDuration(item.duration_sec);

    return (
        <button
            type="button"
            onClick={() => onOpen(item)}
            className="w-full flex gap-3 py-2.5 border-b border-border/50 last:border-0 rounded-lg text-left hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-news-accent/60 transition-colors"
        >
            <div className="w-20 h-14 rounded-lg bg-muted shrink-0 overflow-hidden relative">
                {item.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-5 h-5 text-muted-foreground" />
                    </div>
                )}
                {duration && (
                    <span className="absolute bottom-1 right-1 text-[10px] font-medium bg-black/70 text-white px-1 rounded">
                        {duration}
                    </span>
                )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                <p dir="auto" className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                    {item.title || 'Untitled'}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                    {item.source_name && (
                        <span className="text-[11px] text-news-accent font-medium truncate max-w-[100px]">
                            {item.source_name}
                        </span>
                    )}
                    {item.source_name && <span className="text-[11px] text-muted-foreground">·</span>}
                    <span className="text-[11px] text-muted-foreground">
                        {formatRelativeTime(item.viewed_at, locale)}
                    </span>
                </div>
            </div>
        </button>
    );
}
