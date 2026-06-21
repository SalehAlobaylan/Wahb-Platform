'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Sparkles,
    Globe,
    Lightbulb,
    Cpu,
    ChevronRight,
    AudioLines,
    FileText,
    Check,
    Loader2,
    LogIn,
    Settings,
    Bookmark,
    Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InterestsModal } from '@/components/profile/interests-modal';
import { GlobalNowPlayingBar } from '@/components/global-now-playing-bar';
import { useAuthStore } from '@/lib/stores';
import { useUpdateProfile } from '@/lib/hooks/use-auth';
import { useMyContent, type MyContentItem } from '@/lib/hooks/use-my-content';
import { toast } from 'sonner';
import { useTranslations } from '@/lib/i18n';

const DEFAULT_INTERESTS = [
    { label: '#AI', icon: Sparkles },
    { label: '#Saudi', icon: Globe },
    { label: '#Innovation', icon: Lightbulb },
    { label: '#Tech', icon: Cpu },
];

const INTEREST_ICON_BY_LABEL: Record<string, typeof Sparkles> = {
    AI: Sparkles,
    SAUDI: Globe,
    INNOVATION: Lightbulb,
    TECH: Cpu,
};

function iconForInterest(label: string): typeof Sparkles {
    return INTEREST_ICON_BY_LABEL[label.replace(/^#/, '').toUpperCase()] ?? Sparkles;
}

/* ═══════════════════════════════════════════════
   Guest Profile — shown when not logged in
   ═══════════════════════════════════════════════ */
function GuestProfile() {
    const t = useTranslations();
    return (
        <>
            <div className="relative flex h-auto min-h-screen w-full flex-col bg-background max-w-md mx-auto shadow-2xl overflow-x-hidden pb-16">
                {/* Header */}
                <div className="flex items-center bg-background p-4 pb-2 justify-between sticky top-0 z-20 border-b-border/40">
                    <Link href="/" className="text-foreground flex size-10 shrink-0 items-center justify-center cursor-pointer hover:bg-muted/50 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h2 className="text-foreground text-lg font-bold font-serif leading-tight tracking-tight flex-1 text-center">{t('profile.title')}</h2>
                    <Link href="/settings" className="flex w-10 items-center justify-end cursor-pointer text-foreground hover:bg-muted/50 rounded-full h-10 transition-colors">
                        <Settings className="w-5 h-5" />
                    </Link>
                </div>

                {/* Guest hero */}
                <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
                    {/* Avatar placeholder */}
                    <div className="w-24 h-24 rounded-full bg-muted/60 flex items-center justify-center mb-6 ring-4 ring-border ring-offset-2 ring-offset-background">
                        <LogIn className="w-10 h-10 text-muted-foreground/50" />
                    </div>

                    <h1 className="font-serif text-2xl font-bold text-foreground mb-2 text-center">
                        {t('profile.guest.title')}
                    </h1>
                    <p className="text-sm text-muted-foreground text-center max-w-[260px] leading-relaxed mb-8">
                        {t('profile.guest.body')}
                    </p>

                    {/* CTA buttons */}
                    <Link href="/login" className="w-full max-w-[280px]">
                        <button className="w-full h-12 rounded-xl bg-news-accent text-background font-semibold text-sm hover:bg-news-accent/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer">
                            <LogIn className="w-4 h-4" />
                            {t('profile.guest.signIn')}
                        </button>
                    </Link>
                    <Link href="/register" className="mt-3">
                        <span className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            {t('auth.login.registerPrompt')} <span className="text-news-accent font-medium">{t('profile.guest.register')}</span>
                        </span>
                    </Link>

                    {/* Feature pills */}
                    <div className="flex flex-wrap gap-2 justify-center mt-10">
                        {[
                            { icon: Heart, label: t('profile.guest.feature.likes') },
                            { icon: Bookmark, label: t('profile.guest.feature.saved') },
                            { icon: AudioLines, label: t('profile.guest.feature.history') },
                            { icon: Sparkles, label: t('profile.guest.feature.foryou') },
                        ].map(({ icon: Icon, label }) => (
                            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/40 border border-border/50">
                                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground font-medium">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <GlobalNowPlayingBar />
        </>
    );
}

/* ═══════════════════════════════════════════════
   Authenticated Profile
   ═══════════════════════════════════════════════ */
export default function ProfilePage() {
    const { user, isAuthenticated, isLoading } = useAuthStore();
    const updateProfile = useUpdateProfile();
    const [showInterestsModal, setShowInterestsModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'audio' | 'writes'>('audio');
    const t = useTranslations();

    // Read interests from the persisted user object; fall back to defaults
    // only when the field is missing entirely (new accounts) so it never
    // looks empty.
    const interests = useMemo<string[]>(() => {
        if (!user) return [];
        if (user.interests && user.interests.length > 0) return user.interests;
        return DEFAULT_INTERESTS.map((i) => i.label.replace('#', ''));
    }, [user]);

    const displayedInterests = interests.map((interest) => ({
        label: `#${interest}`,
        icon: iconForInterest(interest),
    }));

    const myAudio = useMyContent('PODCAST');
    const myWrites = useMyContent('ARTICLE');
    const audioItems: MyContentItem[] = (myAudio.data?.pages ?? []).flatMap((p) => p.items);
    const writeItems: MyContentItem[] = (myWrites.data?.pages ?? []).flatMap((p) => p.items);

    // Loading
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Not authenticated → show guest profile with sign-in CTA
    if (!isAuthenticated || !user) {
        return <GuestProfile />;
    }

    // Real user data
    const displayName = user.username || user.email.split('@')[0];
    const handle = `@${user.username || user.email.split('@')[0]}`;

    return (
        <>
            <div className="relative flex h-auto min-h-screen w-full flex-col bg-background max-w-md mx-auto shadow-2xl overflow-x-hidden pb-16">

                {/* Header / Top Bar */}
                <div className="flex items-center bg-background p-4 pb-2 justify-between sticky top-0 z-20 border-b-border/40">
                    <Link href="/" className="text-foreground flex size-10 shrink-0 items-center justify-center cursor-pointer hover:bg-muted/50 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h2 className="text-foreground text-lg font-bold font-serif leading-tight tracking-tight flex-1 text-center">{handle}</h2>
                    <Link href="/settings" className="flex w-10 items-center justify-end cursor-pointer text-foreground hover:bg-muted/50 rounded-full h-10 transition-colors">
                        <Settings className="w-5 h-5" />
                    </Link>
                </div>

                {/* Profile Info */}
                <div className="flex p-4 pt-2">
                    <div className="flex w-full flex-col gap-6 items-center">
                        <div className="flex gap-4 flex-col items-center">
                            <div className="relative">
                                {/* Avatar: initials fallback until user avatars are supported */}
                                <div className="aspect-square rounded-full min-h-28 w-28 ring-4 ring-primary/30 ring-offset-2 ring-offset-background bg-card border border-border flex items-center justify-center">
                                    <span className="text-3xl font-black font-serif text-primary uppercase">
                                        {displayName.charAt(0)}
                                    </span>
                                </div>
                                <div className="absolute bottom-1 end-1 bg-primary rounded-full p-1 border-2 border-background shadow-sm flex items-center justify-center">
                                    <Check className="w-3 h-3 text-primary-foreground stroke-[3]" />
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center text-center px-6">
                                <h1 className="text-foreground text-3xl font-black font-serif leading-tight mb-2">{displayName}</h1>
                                <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-xs">
                                    {user.email}
                                </p>
                                <div className="flex items-center gap-1 mt-2 text-muted-foreground">
                                    <p className="text-xs font-bold tracking-wider uppercase">
                                        {t('profile.memberSince', { year: new Date(user.created_at).getFullYear() })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex w-full gap-3 px-4">
                            <Link href="/profile/edit" className="flex-1">
                                <button className="w-full cursor-pointer flex items-center justify-center rounded-lg h-11 bg-primary text-primary-foreground text-sm font-bold tracking-wide transition-all hover:bg-primary/90 active:scale-[0.98] shadow-md shadow-primary/20">
                                    {t('profile.edit')}
                                </button>
                            </Link>
                            <button className="flex-1 cursor-pointer flex items-center justify-center rounded-lg h-11 border border-border bg-card text-foreground text-sm font-bold tracking-wide transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary active:scale-[0.98]">
                                {t('profile.share')}
                            </button>
                        </div>

                        {user.bio && (
                            <p className="px-6 text-center text-sm text-muted-foreground leading-relaxed -mt-2">
                                {user.bio}
                            </p>
                        )}
                    </div>
                </div>

                {/* Interests Chips (Horizontally Scrollable) */}
                <div className="relative group">
                    <div className="flex gap-2 p-4 pe-10 overflow-x-auto hide-scrollbar scroll-smooth">
                        {displayedInterests.map((interest, idx) => {
                            const Icon = interest.icon;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setShowInterestsModal(true)}
                                    className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-card px-4 border border-border transition-colors hover:border-primary/30 hover:bg-primary/10 group/chip cursor-pointer"
                                >
                                    <Icon className="w-4 h-4 text-muted-foreground group-hover/chip:text-primary transition-colors" />
                                    <span className="text-foreground group-hover/chip:text-primary text-xs font-bold tracking-wide transition-colors">
                                        {interest.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setShowInterestsModal(true)}
                        className="absolute end-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border text-foreground cursor-pointer shadow-sm hover:bg-muted transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs Section */}
                <div className="mt-2">
                    <div className="flex border-b border-border px-4">
                        <button
                            onClick={() => setActiveTab('audio')}
                            className={cn(
                                "flex flex-col items-center justify-center pb-3 pt-4 flex-1 group transition-colors",
                                activeTab === 'audio'
                                    ? "border-b-2 border-primary text-primary"
                                    : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <AudioLines className="w-6 h-6 mb-1" />
                            <p className="text-xs font-bold uppercase tracking-widest">{t('profile.tab.audio')}</p>
                        </button>
                        <button
                            onClick={() => setActiveTab('writes')}
                            className={cn(
                                "flex flex-col items-center justify-center pb-3 pt-4 flex-1 transition-colors",
                                activeTab === 'writes'
                                    ? "border-b-2 border-primary text-primary"
                                    : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <FileText className="w-6 h-6 mb-1" />
                            <p className="text-xs font-bold uppercase tracking-widest">{t('profile.tab.writes')}</p>
                        </button>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="min-h-[40vh] bg-background">
                    {activeTab === 'audio' ? (
                        <MyContentList
                            items={audioItems}
                            kind="audio"
                            isLoading={myAudio.isLoading}
                        />
                    ) : (
                        <MyContentList
                            items={writeItems}
                            kind="writes"
                            isLoading={myWrites.isLoading}
                        />
                    )}
                </div>

                <div className="h-10 bg-background"></div>
            </div>

            <GlobalNowPlayingBar />

             {/* Interests Modal — persists to IAM on save. */}
             <InterestsModal
                isOpen={showInterestsModal}
                onClose={() => setShowInterestsModal(false)}
                selected={interests}
                onSave={(next) => {
                    updateProfile.mutate(
                        { interests: next },
                        {
                            onSuccess: () => toast.success('Interests updated'),
                            onError: (err) =>
                                toast.error(err instanceof Error ? err.message : 'Failed to save interests'),
                        }
                    );
                }}
            />
        </>
    );
}

/* ═══════════════════════════════════════════════
   My Audio / My Writes list
   ═══════════════════════════════════════════════ */
function MyContentList({
    items,
    kind,
    isLoading,
}: {
    items: MyContentItem[];
    kind: 'audio' | 'writes';
    isLoading: boolean;
}) {
    const t = useTranslations();
    if (isLoading && items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin opacity-60" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                {kind === 'audio' ? (
                    <AudioLines className="w-12 h-12 mb-4 opacity-20" />
                ) : (
                    <FileText className="w-12 h-12 mb-4 opacity-20" />
                )}
                <p className="text-sm font-medium">
                                {kind === 'audio' ? t('profile.empty.audio') : t('profile.empty.writes')}
                            </p>
                            <Link
                                href="/create"
                                className="mt-4 text-xs font-semibold uppercase tracking-widest text-primary hover:underline"
                            >
                                {t('profile.empty.cta', { kind: kind === 'audio' ? t('profile.tab.audio') : t('profile.tab.writes') })}
                            </Link>
            </div>
        );
    }

    return (
        <ul className="divide-y divide-border/40">
            {items.map((item) => {
                const isProcessing =
                    item.status === 'PENDING' || item.status === 'PROCESSING';
                const isFailed = item.status === 'FAILED';
                const isReady = item.status === 'READY' || item.status === 'ARCHIVED';
                const href = isReady ? `/?item=${item.id}` : '#';

                return (
                    <li key={item.id}>
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
                            <div className="size-12 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0">
                                {kind === 'audio' ? (
                                    <AudioLines className="w-5 h-5" />
                                ) : (
                                    <FileText className="w-5 h-5" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground line-clamp-2">
                                    {item.title || 'Untitled'}
                                </p>
                                {item.excerpt && (
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
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
                                    {isReady && item.duration_sec && kind === 'audio' && (
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                                            {t('profile.min', { minutes: Math.round(item.duration_sec / 60) })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}
