'use client';

import { type RefObject } from 'react';
import { useTranslations } from '@/lib/i18n';
import type { ContentItem } from '@/types';
import { SavedRow, type SavedRowAction } from './saved-row';

/**
 * Vertical list of saved/liked rows with an infinite-scroll sentinel and the
 * "loading more" / "caught up" footers. Shared by the Saved page and the
 * profile Saved/Likes tabs.
 */
export function SavedList({
    items,
    onOpen,
    action,
    metaLabelKey,
    isFetchingNextPage,
    hasNextPage,
    sentinelRef,
}: {
    items: ContentItem[];
    onOpen: (item: ContentItem) => void;
    action?: SavedRowAction;
    metaLabelKey?: string;
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    sentinelRef: RefObject<HTMLDivElement | null>;
}) {
    const t = useTranslations();
    return (
        <div className="px-5 space-y-3 pb-4">
            {items.map((item) => (
                <SavedRow
                    key={item.id}
                    item={item}
                    onOpen={onOpen}
                    action={action}
                    metaLabelKey={metaLabelKey}
                />
            ))}
            <div ref={sentinelRef} className="h-1" />
            {isFetchingNextPage && (
                <div className="py-4 text-center text-xs text-muted-foreground">
                    {t('saved.loadingMore')}
                </div>
            )}
            {!hasNextPage && items.length > 6 && (
                <div className="py-4 text-center text-[10px] uppercase tracking-widest text-muted-foreground/60">
                    {t('saved.caughtUp')}
                </div>
            )}
        </div>
    );
}
