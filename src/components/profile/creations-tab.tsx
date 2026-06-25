'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMyContent, useInfiniteScroll, type MyContentItem } from '@/lib/hooks';
import { useTranslations } from '@/lib/i18n';
import { CreationRow } from './creation-row';
import { TabEmpty, TabSkeleton } from './tab-states';

type CreationFilter = 'all' | 'audio' | 'writes' | 'video';
const FILTERS: CreationFilter[] = ['all', 'audio', 'writes', 'video'];

function merge(data: ReturnType<typeof useMyContent>['data']): MyContentItem[] {
    return (data?.pages ?? []).flatMap((p) => p.items);
}

function byNewest(a: MyContentItem, b: MyContentItem): number {
    // In-flight items (no published_at yet) sort to the top so a just-submitted
    // upload shows immediately.
    if (!a.published_at && !b.published_at) return 0;
    if (!a.published_at) return -1;
    if (!b.published_at) return 1;
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
}

export function CreationsTab() {
    const t = useTranslations();
    const [filter, setFilter] = useState<CreationFilter>('all');

    const audio = useMyContent('PODCAST');
    const writes = useMyContent('ARTICLE');
    const video = useMyContent('VIDEO');

    const audioItems = useMemo(() => merge(audio.data), [audio.data]);
    const writeItems = useMemo(() => merge(writes.data), [writes.data]);
    const videoItems = useMemo(() => merge(video.data), [video.data]);

    const allItems = useMemo(
        () => [...audioItems, ...writeItems, ...videoItems].sort(byNewest),
        [audioItems, writeItems, videoItems]
    );

    const visible =
        filter === 'audio'
            ? audioItems
            : filter === 'writes'
                ? writeItems
                : filter === 'video'
                    ? videoItems
                    : allItems;

    // Only paginate the queries that feed the active filter, so scrolling an
    // "Audio" view never fetches hidden Writes/Video pages.
    const activeQueries =
        filter === 'audio'
            ? [audio]
            : filter === 'writes'
                ? [writes]
                : filter === 'video'
                    ? [video]
                    : [audio, writes, video];

    const hasNextPage = activeQueries.some((q) => q.hasNextPage);
    const isFetchingNextPage = activeQueries.some((q) => q.isFetchingNextPage);
    const isFetching = activeQueries.some((q) => q.isFetching);

    const sentinelRef = useInfiniteScroll({
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        fetchNextPage: () => {
            for (const q of activeQueries) {
                if (q.hasNextPage) q.fetchNextPage();
            }
        },
    });

    const isLoading = audio.isLoading || writes.isLoading || video.isLoading;
    if (isLoading && allItems.length === 0) return <TabSkeleton />;

    if (allItems.length === 0) {
        return (
            <TabEmpty
                icon={LayoutGrid}
                title={t('profile.empty.creations.title')}
                body={t('profile.empty.creations.body')}
                action={
                    <Link
                        href="/create"
                        className="inline-flex items-center justify-center rounded-lg h-10 px-5 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors"
                    >
                        {t('profile.empty.creations.cta')}
                    </Link>
                }
            />
        );
    }

    return (
        <div>
            <div className="flex gap-2 px-5 py-3 overflow-x-auto hide-scrollbar">
                {FILTERS.map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold border transition-colors',
                            filter === f
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-card text-muted-foreground border-border hover:border-primary/30'
                        )}
                    >
                        {t(`profile.creations.filter.${f}`)}
                    </button>
                ))}
            </div>

            {visible.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                    {t('profile.empty.creations.filter')}
                </div>
            ) : (
                <ul className="divide-y divide-border/40">
                    {visible.map((item) => (
                        <li key={item.id}>
                            <CreationRow item={item} />
                        </li>
                    ))}
                </ul>
            )}

            <div ref={sentinelRef} className="h-1" />
            {isFetchingNextPage && (
                <div className="py-3 text-center text-xs text-muted-foreground">
                    {t('settings.history.loading')}
                </div>
            )}
        </div>
    );
}
