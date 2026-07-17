'use client';

import { useEffect, useMemo, type MouseEvent } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { useMyLikes, useLikeMutation, useInfiniteScroll } from '@/lib/hooks';
import { useFeedStore } from '@/lib/stores';
import { useAuthStore } from '@/lib/stores/auth-store';
import { identityCacheKey } from '@/lib/identity/identity-key';
import { SavedList } from '@/components/saved';
import { useTranslations } from '@/lib/i18n';
import { flattenPages } from '@/lib/utils/pages';
import type { ContentItem, ForYouResponse } from '@/types';
import { TabEmpty, TabSkeleton } from './tab-states';

export function LikesTab({ onOpen }: { onOpen: (item: ContentItem) => void }) {
    const t = useTranslations();
    const queryClient = useQueryClient();
    const query = useMyLikes();
    const likeMutation = useLikeMutation();
    const userId = useAuthStore((state) => state.user?.id ?? null);
    const identityKey = identityCacheKey(userId);

    const items = useMemo(() => flattenPages(query.data), [query.data]);

    const sentinelRef = useInfiniteScroll({
        hasNextPage: Boolean(query.hasNextPage),
        isFetching: query.isFetching,
        isFetchingNextPage: query.isFetchingNextPage,
        fetchNextPage: query.fetchNextPage,
    });

    useEffect(() => {
        if (items.length === 0) return;
        useFeedStore.getState().seedInteractions(
            items.map((i) => i.id),
            [],
            items.map((i) => i.id)
        );
    }, [items]);

    if (query.isLoading) return <TabSkeleton />;
    if (items.length === 0) {
        return (
            <TabEmpty
                icon={Heart}
                title={t('profile.empty.likes.title')}
                body={t('profile.empty.likes.body')}
            />
        );
    }

    const handleUnlike = (event: MouseEvent<HTMLButtonElement>, item: ContentItem) => {
        event.stopPropagation();
        likeMutation.mutate({ contentId: item.id, isLiked: true });
        // Optimistically drop the row from the cached likes pages so it stays
        // gone across remounts (mirrors how bookmarks are removed from cache).
        queryClient.setQueryData<InfiniteData<ForYouResponse>>(['my-likes', identityKey], (current) => {
            if (!current) return current;
            return {
                ...current,
                pages: current.pages.map((page) => ({
                    ...page,
                    items: page.items.filter((i) => i.id !== item.id),
                })),
            };
        });
    };

    return (
        <SavedList
            items={items}
            onOpen={onOpen}
            metaLabelKey="profile.likedAt"
            action={{ kind: 'like', ariaLabel: t('profile.removeLike'), onClick: handleUnlike }}
            isFetchingNextPage={query.isFetchingNextPage}
            hasNextPage={Boolean(query.hasNextPage)}
            sentinelRef={sentinelRef}
        />
    );
}
