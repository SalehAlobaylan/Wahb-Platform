'use client';

import Link from 'next/link';
import { AudioLines, FileText, Video, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';
import type { MyContentItem } from '@/lib/hooks';

/** A single user-created item (audio / write / video) with status badges. */
export function CreationRow({ item }: { item: MyContentItem }) {
    const t = useTranslations();
    const isProcessing = item.status === 'PENDING' || item.status === 'PROCESSING';
    const isFailed = item.status === 'FAILED';
    const isReady = item.status === 'READY' || item.status === 'ARCHIVED';
    const isAudioLike = item.type === 'PODCAST' || item.type === 'VIDEO';
    const Icon = item.type === 'VIDEO' ? Video : item.type === 'PODCAST' ? AudioLines : FileText;
    const href = isReady ? `/?item=${item.id}` : '#';

    return (
        <Link
            href={href}
            className={cn(
                'flex items-start gap-3 p-4 transition-colors',
                isReady ? 'hover:bg-muted/40' : 'cursor-default'
            )}
            onClick={(e) => {
                if (!isReady) e.preventDefault();
            }}
        >
            <div className="size-12 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0 overflow-hidden">
                {item.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnail_url} alt="" className="h-full w-full object-cover" />
                ) : (
                    <Icon className="w-5 h-5" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p dir="auto" className="text-sm font-semibold text-foreground line-clamp-2">
                    {item.title || t('saved.item.untitled')}
                </p>
                {item.excerpt && (
                    <p dir="auto" className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {item.excerpt}
                    </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                    {isProcessing && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-amber-500">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {t('profile.processing')}
                        </span>
                    )}
                    {isFailed && (
                        <span className="text-[10px] uppercase tracking-widest font-bold text-red-500">
                            {t('profile.failed')}
                        </span>
                    )}
                    {isReady && item.duration_sec && isAudioLike && (
                        <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                            {t('profile.min', { minutes: Math.round(item.duration_sec / 60) })}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
