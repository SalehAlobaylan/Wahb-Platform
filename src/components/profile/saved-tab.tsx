'use client';

import { useEffect, useMemo, type MouseEvent } from 'react';
import { Bookmark } from 'lucide-react';
import { useBookmarks, useBookmarkMutation, useInfiniteScroll } from '@/lib/hooks';
import { useFeedStore } from '@/lib/stores';
import { SavedList } from '@/components/saved';
import { useTranslations } from '@/lib/i18n';
import { flattenPages } from '@/lib/utils/pages';
import type { ContentItem } from '@/types';
import { TabEmpty, TabSkeleton } from './tab-states';

export function SavedTab({ onOpen }: { onOpen: (item: ContentItem) => void }) {
    const t = useTranslations();
    const query = useBookmarks({ feed: 'all', sort: 'saved_desc' });
    const bookmarkMutation = useBookmarkMutation();
    const items = useMemo(() => flattenPages(query.data), [query.data]);

    const sentinelRef = useInfiniteScroll({
        hasNextPage: Boolean(query.hasNextPage),
        isFetching: query.isFetching,
        isFetchingNextPage: query.isFetchingNextPage,
        fetchNextPage: query.fetchNextPage,
    });

    // Seed like/bookmark id sets so the playback overlay shows correct state.
    useEffect(() => {
        if (items.length === 0) return;
        useFeedStore.getState().seedInteractions(
            items.filter((i) => i.is_liked).map((i) => i.id),
            items.map((i) => i.id),
            items.map((i) => i.id)
        );
    }, [items]);

    if (query.isLoading) return <TabSkeleton />;
    if (items.length === 0) {
        return (
            <TabEmpty
                icon={Bookmark}
                title={t('profile.empty.saved.title')}
                body={t('profile.empty.saved.body')}
            />
        );
    }

    const handleRemove = (event: MouseEvent<HTMLButtonElement>, item: ContentItem) => {
        event.stopPropagation();
        bookmarkMutation.mutate({ contentId: item.id, isBookmarked: true });
    };

    return (
        <SavedList
            items={items}
            onOpen={onOpen}
            action={{ kind: 'bookmark', ariaLabel: t('saved.removeBookmark'), onClick: handleRemove }}
            isFetchingNextPage={query.isFetchingNextPage}
            hasNextPage={Boolean(query.hasNextPage)}
            sentinelRef={sentinelRef}
        />
    );
}
