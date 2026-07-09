'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Settings, Loader2, X } from 'lucide-react';
import { useAuthStore, useFeedStore } from '@/lib/stores';
import { usePreferences, useUserStats } from '@/lib/hooks';
import { InterestsModal } from '@/components/profile/interests-modal';
import { GlobalNowPlayingBar } from '@/components/global-now-playing-bar';
import { ArticleReader, ForYouCard } from '@/components/feed';
import { isForYouItem } from '@/components/saved';
import {
    ProfileGuest,
    ProfileHero,
    ProfileStats,
    InterestsRow,
    ProfileTabs,
    SavedTab,
    LikesTab,
    HistoryTab,
    CreationsTab,
    type ProfileTab,
} from '@/components/profile';
import { useTranslations } from '@/lib/i18n';
import type { ContentItem } from '@/types';

const VALID_TABS: ProfileTab[] = ['saved', 'likes', 'history', 'creations'];

function LoadingScreen() {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <ProfileContent />
        </Suspense>
    );
}

function ProfileContent() {
    const { user, isAuthenticated, isLoading } = useAuthStore();
    const stats = useUserStats();
    const preferences = usePreferences(isAuthenticated);
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations();

    const [showInterests, setShowInterests] = useState(false);
    const [playback, setPlayback] = useState<ContentItem | null>(null);
    const [article, setArticle] = useState<ContentItem | null>(null);

    const tabParam = searchParams.get('tab');
    const activeTab: ProfileTab = VALID_TABS.includes(tabParam as ProfileTab)
        ? (tabParam as ProfileTab)
        : 'saved';
    const setTab = (tab: ProfileTab) => router.replace(`/profile?tab=${tab}`, { scroll: false });

    if (isLoading) return <LoadingScreen />;
    if (!isAuthenticated || !user) return <ProfileGuest />;

    const handle = `@${user.username || user.email.split('@')[0]}`;

    const openContentItem = (item: ContentItem) => {
        if (isForYouItem(item)) setPlayback(item);
        else setArticle(item);
    };

    const closePlayback = () => {
        useFeedStore.getState().setPlaying(false);
        setPlayback(null);
    };

    return (
        <>
            <div className="relative flex h-auto min-h-screen w-full flex-col bg-background max-w-md mx-auto shadow-2xl overflow-x-hidden pb-16">
                {/* Header */}
                <div className="flex items-center justify-between bg-background/95 backdrop-blur-md px-4 h-14 sticky top-0 z-20 border-b border-border/40">
                    <Link
                        href="/"
                        className="text-foreground flex size-10 shrink-0 items-center justify-center cursor-pointer hover:bg-muted/50 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 rtl:rotate-180" />
                    </Link>
                    <h2 dir="ltr" className="text-foreground text-base font-bold font-mono leading-tight tracking-tight flex-1 text-center truncate px-2">
                        {handle}
                    </h2>
                    <Link
                        href="/settings"
                        className="flex size-10 items-center justify-center cursor-pointer text-foreground hover:bg-muted/50 rounded-full transition-colors"
                    >
                        <Settings className="w-5 h-5" />
                    </Link>
                </div>

                {/* Identity + stats + interests */}
                <div className="pt-5 flex flex-col gap-5">
                    <ProfileHero user={user} />
                    <ProfileStats stats={stats.data} isLoading={stats.isLoading} onSelect={setTab} />
                    <InterestsRow
                        interests={(preferences.data?.declared ?? []).map((topic) => topic.label_en || topic.label_ar)}
                        onEdit={() => setShowInterests(true)}
                    />
                </div>

                {/* Library tabs */}
                <div className="mt-1">
                    <ProfileTabs active={activeTab} onChange={setTab} />
                    <div className="min-h-[42vh] bg-background">
                        {activeTab === 'saved' && <SavedTab onOpen={openContentItem} />}
                        {activeTab === 'likes' && <LikesTab onOpen={openContentItem} />}
                        {activeTab === 'history' && <HistoryTab />}
                        {activeTab === 'creations' && <CreationsTab />}
                    </div>
                </div>
            </div>

            {!playback && <GlobalNowPlayingBar />}

            {/* For You playback overlay (audio / video) */}
            {playback && (
                <div className="fixed inset-0 z-50 bg-black">
                    <ForYouCard item={playback} isActive />
                    <button
                        type="button"
                        onClick={closePlayback}
                        className="absolute left-4 top-[calc(env(safe-area-inset-top)+1rem)] z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition-colors"
                        aria-label={t('saved.overlay.close')}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            )}

            {/* Article reader overlay (news / writes) */}
            <ArticleReader article={article} onClose={() => setArticle(null)} />

            {/* Interests editor — persists to CMS preferences, not IAM profile. */}
            <InterestsModal
                isOpen={showInterests}
                onClose={() => setShowInterests(false)}
            />
        </>
    );
}
