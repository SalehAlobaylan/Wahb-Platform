'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    MoreHorizontal,
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

const DEFAULT_INTERESTS = [
    { label: '#AI', icon: Sparkles },
    { label: '#Saudi', icon: Globe },
    { label: '#Innovation', icon: Lightbulb },
    { label: '#Tech', icon: Cpu },
];

/* ═══════════════════════════════════════════════
   Guest Profile — shown when not logged in
   ═══════════════════════════════════════════════ */
function GuestProfile() {
    return (
        <>
            <div className="relative flex h-auto min-h-screen w-full flex-col bg-background max-w-md mx-auto shadow-2xl overflow-x-hidden pb-16">
                {/* Header */}
                <div className="flex items-center bg-background p-4 pb-2 justify-between sticky top-0 z-20 border-b-border/40">
                    <Link href="/" className="text-foreground flex size-10 shrink-0 items-center justify-center cursor-pointer hover:bg-muted/50 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h2 className="text-foreground text-lg font-bold font-serif leading-tight tracking-tight flex-1 text-center">Profile</h2>
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
                        Welcome to Wahb
                    </h1>
                    <p className="text-sm text-muted-foreground text-center max-w-[260px] leading-relaxed mb-8">
                        Sign in to save your favorites, personalize your feed, and track your listening history.
                    </p>

                    {/* CTA buttons */}
                    <Link href="/login" className="w-full max-w-[280px]">
                        <button className="w-full h-12 rounded-xl bg-gold text-background font-semibold text-sm hover:bg-gold/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer">
                            <LogIn className="w-4 h-4" />
                            Sign In
                        </button>
                    </Link>
                    <Link href="/register" className="mt-3">
                        <span className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Don&apos;t have an account? <span className="text-gold font-medium">Register</span>
                        </span>
                    </Link>

                    {/* Feature pills */}
                    <div className="flex flex-wrap gap-2 justify-center mt-10">
                        {[
                            { icon: Heart, label: 'Likes' },
                            { icon: Bookmark, label: 'Saved' },
                            { icon: AudioLines, label: 'History' },
                            { icon: Sparkles, label: 'For You' },
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
    const [interests, setInterests] = useState<string[]>(DEFAULT_INTERESTS.map(i => i.label.replace('#', '')));
    const [showInterestsModal, setShowInterestsModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'audio' | 'writes'>('audio');

    // Map current interests back to the default objects for icons
    const displayedInterests = interests.map(interest => {
        const found = DEFAULT_INTERESTS.find(di => di.label.replace('#', '') === interest);
        return found || { label: `#${interest}`, icon: Sparkles };
    });

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
                                <div className="aspect-square rounded-full min-h-28 w-28 ring-4 ring-foreground ring-offset-2 ring-offset-background bg-muted flex items-center justify-center">
                                    <span className="text-3xl font-black font-serif text-foreground uppercase">
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
                                    <p className="text-xs font-bold tracking-wider uppercase">Member since {new Date(user.created_at).getFullYear()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex w-full gap-3 px-4">
                            <Link href="/settings" className="flex-1">
                                <button className="w-full cursor-pointer flex items-center justify-center rounded-lg h-11 bg-foreground text-background text-sm font-bold tracking-wide transition-all hover:opacity-90 shadow-md">
                                    Edit Profile
                                </button>
                            </Link>
                            <button className="flex-1 cursor-pointer flex items-center justify-center rounded-lg h-11 border-2 border-border bg-card text-foreground text-sm font-bold tracking-wide transition-all hover:bg-muted">
                                Share Profile
                            </button>
                        </div>
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
                                    className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-foreground/5 px-4 border border-foreground/5 transition-colors hover:bg-foreground hover:text-background group/chip cursor-pointer"
                                >
                                    <Icon className="w-4 h-4 text-foreground group-hover/chip:text-background transition-colors" />
                                    <span className="text-foreground group-hover/chip:text-background text-xs font-bold tracking-wide transition-colors">
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
                                    ? "border-b-2 border-foreground text-foreground"
                                    : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <AudioLines className="w-6 h-6 mb-1" />
                            <p className="text-xs font-bold uppercase tracking-widest">My Audio</p>
                        </button>
                        <button
                            onClick={() => setActiveTab('writes')}
                            className={cn(
                                "flex flex-col items-center justify-center pb-3 pt-4 flex-1 transition-colors",
                                activeTab === 'writes'
                                    ? "border-b-2 border-foreground text-foreground"
                                    : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <FileText className="w-6 h-6 mb-1" />
                            <p className="text-xs font-bold uppercase tracking-widest">My Writes</p>
                        </button>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="min-h-[40vh] flex flex-col items-center justify-center py-20 text-muted-foreground bg-background">
                    {activeTab === 'audio' ? (
                        <>
                            <AudioLines className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm font-medium">No audio yet</p>
                        </>
                    ) : (
                        <>
                            <FileText className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm font-medium">No writes yet</p>
                        </>
                    )}
                </div>

                <div className="h-10 bg-background"></div>
            </div>

            <GlobalNowPlayingBar />

             {/* Interests Modal */}
             <InterestsModal
                isOpen={showInterestsModal}
                onClose={() => setShowInterestsModal(false)}
                selected={interests}
                onSave={setInterests}
            />
        </>
    );
}
