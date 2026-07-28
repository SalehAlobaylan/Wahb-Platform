'use client';

import Link from 'next/link';
import { ArrowLeft, Settings, LogIn, Heart, Bookmark, AudioLines, Sparkles } from 'lucide-react';
import { GlobalNowPlayingBar } from '@/components/global-now-playing-bar';
import { useTranslations } from '@/lib/i18n';

/**
 * Guest profile — shown when not logged in. Sign-in CTA + feature pills.
 */
export function ProfileGuest() {
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
                    <div className="w-24 h-24 rounded-full bg-muted/60 flex items-center justify-center mb-6 ring-4 ring-border ring-offset-2 ring-offset-background">
                        <LogIn className="w-10 h-10 text-muted-foreground/50" />
                    </div>

                    <h1 className="font-serif text-2xl font-bold text-foreground mb-2 text-center">
                        {t('profile.guest.title')}
                    </h1>
                    <p className="text-sm text-muted-foreground text-center max-w-[260px] leading-relaxed mb-8">
                        {t('profile.guest.body')}
                    </p>

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

                    <div className="flex flex-wrap gap-2 justify-center mt-10">
                        {[
                            { icon: Heart, label: t('profile.guest.feature.likes') },
                            { icon: Bookmark, label: t('profile.guest.feature.saved') },
                            { icon: AudioLines, label: t('profile.guest.feature.history') },
                            { icon: Sparkles, label: t('profile.guest.feature.pods') },
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
