'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Trash2 } from 'lucide-react';
import { useWatchHistory, useInfiniteScroll, type WatchHistoryItem } from '@/lib/hooks';
import { HistoryRow } from '@/components/history/history-row';
import { useTranslations } from '@/lib/i18n';
import { TabEmpty, TabError, TabSkeleton } from './tab-states';

export function HistoryTab() {
    const t = useTranslations();
    const router = useRouter();
    const [confirmClear, setConfirmClear] = useState(false);
    const {
        items,
        isLoading,
        isError,
        refetch,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        clear,
        isClearing,
    } = useWatchHistory();

    const sentinelRef = useInfiniteScroll({
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        fetchNextPage,
    });

    const handleOpen = (item: WatchHistoryItem) => {
        const id = encodeURIComponent(item.content_id);
        if (item.type === 'VIDEO' || item.type === 'PODCAST') {
            router.push(`/?item=${id}`);
            return;
        }
        router.push(`/news?item=${id}`);
    };

    if (isLoading) return <TabSkeleton />;
    if (isError) return <TabError message={t('settings.history.failed')} onRetry={refetch} />;
    if (items.length === 0) {
        return (
            <TabEmpty
                icon={Clock}
                title={t('profile.empty.history.title')}
                body={t('profile.empty.history.body')}
            />
        );
    }

    return (
        <div className="px-5 pt-3 pb-4">
            <div className="pb-1">
                {confirmClear ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                clear();
                                setConfirmClear(false);
                            }}
                            disabled={isClearing}
                            className="flex-1 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 hover:bg-destructive/20 transition-colors disabled:opacity-50"
                        >
                            {isClearing ? t('settings.history.loading') : t('settings.history.confirm')}
                        </button>
                        <button
                            onClick={() => setConfirmClear(false)}
                            disabled={isClearing}
                            className="flex-1 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
                        >
                            {t('settings.history.cancel')}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setConfirmClear(true)}
                        className="w-full py-2 rounded-lg border border-border text-muted-foreground text-sm font-medium hover:border-destructive/30 hover:text-destructive transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t('settings.history.clear')}
                    </button>
                )}
            </div>

            <div className="space-y-1">
                {items.map((item) => (
                    <HistoryRow key={item.content_id} item={item} onOpen={handleOpen} />
                ))}
                <div ref={sentinelRef} className="h-1" />
                {isFetchingNextPage && (
                    <div className="py-3 text-center text-xs text-muted-foreground">
                        {t('settings.history.loading')}
                    </div>
                )}
            </div>
        </div>
    );
}
