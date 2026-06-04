'use client';

import { useState } from 'react';
import { Sparkles, Lock, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';
import { shareContent } from '@/lib/utils/share';
import { NowPlayingBar } from '@/components/now-playing-bar';
import type { ContentItem } from '@/types';

type TabKey = 'upnext' | 'tts';

/* Feature flag — flip to true when TTS is ready */
const TTS_ENABLED = false;

type FeaturedItem = Pick<
    ContentItem,
    'id' | 'type' | 'original_url' | 'title' | 'excerpt' | 'body_text' | 'source_name'
>;

interface NewsBottomSheetContentProps {
    featuredItem?: FeaturedItem;
}

/**
 * Content for the News page bottom sheet: playback controls (NowPlayingBar) plus
 * the active item's context. The play queue and TTS are not built yet, so they
 * are gated behind translated "coming soon" states rather than mock data.
 */
export function NewsBottomSheetContent({ featuredItem }: NewsBottomSheetContentProps) {
    const t = useTranslations();
    const [activeTab, setActiveTab] = useState<TabKey>('upnext');

    return (
        <div className="flex flex-col h-full">
            {/* ── Playback controls (shared with NowPlayingBar) ── */}
            <NowPlayingBar expanded />

            {/* ── Tab bar ───────────────────────────────────── */}
            <div className="flex items-center justify-between border-b border-border mb-4 h-[35px]">
                <div className="flex h-full flex-1">
                    <button
                        onClick={() => setActiveTab('upnext')}
                        className={cn(
                            'flex-1 h-full text-xs font-bold uppercase tracking-widest transition-colors font-serif border-b-[2px]',
                            activeTab === 'upnext'
                                ? 'text-news-accent border-news-accent'
                                : 'text-muted-foreground border-transparent hover:text-foreground'
                        )}
                    >
                        {t('upNext.title')}
                    </button>
                    <button
                        onClick={() => setActiveTab('tts')}
                        className={cn(
                            'flex-1 h-full text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 font-serif border-b-[2px]',
                            activeTab === 'tts'
                                ? 'text-news-accent border-news-accent'
                                : 'text-muted-foreground border-transparent hover:text-foreground'
                        )}
                    >
                        {t('tts.title')}
                        {!TTS_ENABLED && <Lock className="w-3 h-3 opacity-50" />}
                    </button>
                </div>
                {/* Share */}
                <button
                    onClick={() => {
                        shareContent({
                            title: featuredItem?.title || t('share.title'),
                            text: featuredItem?.excerpt || featuredItem?.body_text || t('share.description'),
                            item: featuredItem
                                ? { id: featuredItem.id, type: featuredItem.type, original_url: featuredItem.original_url }
                                : undefined,
                        }).catch(() => {});
                    }}
                    className="flex items-center gap-1.5 px-3 h-full mb-1 text-muted-foreground hover:text-foreground transition-all shrink-0"
                    aria-label={t('share.action')}
                >
                    <Share2 className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">{t('share.action')}</span>
                </button>
            </div>

            {/* ── Tab content ───────────────────────────────── */}
            <div className="flex-1 overflow-y-auto hide-scrollbar">
                {activeTab === 'upnext' && <UpNextTab featuredItem={featuredItem} />}
                {activeTab === 'tts' && <TTSTab />}
            </div>
        </div>
    );
}

/* ── Up Next Tab ─────────────────────────────────────────── */
function UpNextTab({ featuredItem }: { featuredItem?: FeaturedItem }) {
    const t = useTranslations();
    return (
        <div className="space-y-4 pb-20">
            {featuredItem && (featuredItem.title || featuredItem.excerpt) && (
                <div className="bg-card rounded-xl p-3 border border-news-accent/30">
                    <span className="text-[8px] uppercase tracking-wider font-bold text-news-accent">
                        {t('upNext.featured')}
                    </span>
                    <h4 dir="auto" className="font-serif text-[15px] leading-snug text-foreground mt-1 line-clamp-3">
                        {featuredItem.title || featuredItem.excerpt}
                    </h4>
                    {featuredItem.source_name && (
                        <p className="text-[11px] text-muted-foreground mt-1">{featuredItem.source_name}</p>
                    )}
                </div>
            )}
            <p className="text-xs text-muted-foreground text-center py-6">{t('upNext.queueSoon')}</p>
        </div>
    );
}

/* ── TTS Tab (coming soon) ───────────────────────────────── */
function TTSTab() {
    const t = useTranslations();
    return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-news-accent/10 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-news-accent" />
            </div>
            <h3 className="text-base font-serif font-bold text-foreground mb-2">{t('tts.heading')}</h3>
            <p className="text-sm text-center max-w-[240px] mb-4">{t('tts.description')}</p>
            <span className="px-4 py-1.5 rounded-full bg-news-accent/20 text-news-accent text-xs font-bold uppercase tracking-wider border border-news-accent/30">
                {t('common.comingSoon')}
            </span>
        </div>
    );
}
