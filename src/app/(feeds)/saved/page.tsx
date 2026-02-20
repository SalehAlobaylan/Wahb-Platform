'use client';

import { useMemo } from 'react';
import { useBookmarks } from '@/lib/hooks';
import { ForYouCard, ForYouSkeleton, FeedContainer } from '@/components/feed';
import { FeedSwitcher } from '@/components/layout';
import { FeedErrorFallback } from '@/components/error-boundary';
import { User } from 'lucide-react';
import Link from 'next/link';

export default function SavedPage() {
    const { data, isLoading, isError, error, refetch } = useBookmarks();

    const items = useMemo(() => {
        if (!data?.pages) return [];
        return data.pages.flatMap((page) => page.items);
    }, [data]);

    if (isError) {
        return (
            <div className="h-full w-full bg-[#0a0a0a]">
                <FeedErrorFallback
                    onRetry={() => refetch()}
                    message={error?.message || 'Failed to load saved items'}
                />
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-hidden relative bg-[#0a0a0a]">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none bg-gradient-to-b from-black/70 to-transparent">
                <div className="flex justify-between items-center p-4 pt-6">
                    <Link href="/profile" className="pointer-events-auto">
                        <div className="w-9 h-9 rounded-full bg-bronze/40 flex items-center justify-center border border-white/20 hover:border-white/40 transition-all">
                            <User className="w-4.5 h-4.5 text-white" />
                        </div>
                    </Link>

                    <div className="pointer-events-auto">
                        <FeedSwitcher variant="dark" />
                    </div>

                    <div className="w-9" />
                </div>
            </header>

            {/* Content */}
            {isLoading ? (
                <FeedContainer>
                    <ForYouSkeleton />
                    <ForYouSkeleton />
                </FeedContainer>
            ) : items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 px-8">
                    <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mb-6">
                        <span className="text-4xl">📑</span>
                    </div>
                    <h2 className="text-xl font-serif text-white mb-2">No saved items yet</h2>
                    <p className="text-sm text-center leading-relaxed">
                        Bookmark content from the For You feed and it will appear here.
                    </p>
                </div>
            ) : (
                <FeedContainer>
                    {items.map((item, index) => (
                        <div key={item.id} className="h-full w-full snap-start">
                            <ForYouCard
                                item={item}
                                isActive={false}
                            />
                        </div>
                    ))}
                </FeedContainer>
            )}
        </div>
    );
}
