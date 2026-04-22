'use client';

import { useState } from 'react';
import {
    GripVertical, Mic, Sparkles, PlayCircle, Clock,
    AudioLines, Lock, Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { shareContent } from '@/lib/utils/share';
import { NowPlayingBar } from '@/components/now-playing-bar';
import type { ContentItem } from '@/types';

type TabKey = 'upnext' | 'tts';

/* ══════════════════════════════════════════════════════════
   Feature flag — flip to true when TTS is ready
   ══════════════════════════════════════════════════════════ */
const TTS_ENABLED = false;

/* ══════════════════════════════════════════════════════════
   Mock data (replace with real store / API later)
   ══════════════════════════════════════════════════════════ */
const QUEUE_ITEMS = [
    {
        id: '1',
        title: 'The Future of AI Architecture',
        label: 'Playing Next',
        duration: '12:30',
        imageUrl: '/placeholder-queue-1.jpg',
        isNext: true,
    },
    {
        id: '2',
        title: 'Economic Shifts in 2026',
        label: 'Up Next',
        duration: '08:45',
        imageUrl: '/placeholder-queue-2.jpg',
        isNext: false,
    },
    {
        id: '3',
        title: 'A Deep Dive into Modernism',
        label: 'Queue',
        duration: '15:00',
        imageUrl: '',
        isNext: false,
    },
];

const TRANSCRIPT_LINES = [
    { speaker: 'Narrator', text: 'We often forget that the medium itself carries a message.', active: false },
    { speaker: 'Narrator', text: 'In the digital age, perfect replication is trivial. But analog photography introduces the beautiful error of chemistry. The grain isn\'t noise; it\'s texture. It\'s the physical evidence of light touching matter.', active: true },
    { speaker: 'Narrator', text: 'And perhaps that\'s why we\'re seeing this resurgence now.', active: false },
    { speaker: 'Narrator', text: 'When everything is ephemeral, we crave the tangible.', active: false },
];

const TTS_RECENT = [
    { title: 'Why film is too expensive...', time: 'Today, 10:23 AM' },
    { title: 'Leica sales up 40% globa...', time: 'Yesterday' },
];

const VISUALIZER_BAR_HEIGHTS = [7, 12, 18, 10, 16, 9, 14, 8];

/* ══════════════════════════════════════════════════════════
   Exported Component
   ══════════════════════════════════════════════════════════ */

/**
 * Content for the News page bottom sheet.
 * Includes playback controls (from NowPlayingBar), Up Next queue, and TTS (coming soon).
 */
interface NewsBottomSheetContentProps {
    featuredItem?: Pick<ContentItem, 'id' | 'type' | 'original_url' | 'title' | 'excerpt' | 'body_text'>;
}

export function NewsBottomSheetContent({ featuredItem }: NewsBottomSheetContentProps) {
    const [activeTab, setActiveTab] = useState<TabKey>('upnext');

    return (
        <div className="flex flex-col h-full">
            {/* ── Playback Controls (shared with NowPlayingBar) ── */}
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
                        Up Next
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
                        TTS
                        {!TTS_ENABLED && <Lock className="w-3 h-3 opacity-50" />}
                    </button>
                </div>
                {/* Share Button relocated here */}
                <button
                    onClick={() => {
                        shareContent({
                            title: featuredItem?.title || 'News Post',
                            text: featuredItem?.excerpt || featuredItem?.body_text || 'Check out this news report on Wahb',
                            item: featuredItem ? {
                                id: featuredItem.id,
                                type: featuredItem.type,
                                original_url: featuredItem.original_url,
                            } : undefined,
                        }).catch(() => {});
                    }}
                    className="flex items-center gap-1.5 px-3 h-full mb-1 text-muted-foreground hover:text-foreground transition-all shrink-0"
                    aria-label="Share"
                >
                    <Share2 className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Share</span>
                </button>
            </div>

            {/* ── Tab content ───────────────────────────────── */}
            <div className="flex-1 overflow-y-auto hide-scrollbar">
                {activeTab === 'upnext' && <UpNextTab />}
                {activeTab === 'tts' && <TTSTab />}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   Up Next Tab
   ══════════════════════════════════════════════════════════ */
function UpNextTab() {
    return (
        <div className="space-y-6 pb-20">
            {/* Queue items */}
            <div className="space-y-3">
                {QUEUE_ITEMS.map((item) => (
                    <div
                        key={item.id}
                        className={cn(
                            'bg-card rounded-xl p-2.5 flex gap-3 items-center cursor-pointer group border transition-colors',
                            item.isNext
                                ? 'border-news-accent/40 shadow-[0_0_15px_rgba(218,164,40,0.1)] relative overflow-hidden'
                                : 'border-border opacity-60 hover:opacity-100 hover:bg-muted/50'
                        )}
                    >
                        {/* Highlight glow for "Playing Next" */}
                        {item.isNext && (
                            <div className="absolute inset-0 bg-gradient-to-r from-news-accent/5 to-transparent pointer-events-none" />
                        )}

                        {/* Thumbnail */}
                        <div className="w-14 h-14 shrink-0 overflow-hidden rounded-md bg-muted relative z-10">
                            {item.imageUrl ? (
                                <div
                                    className={cn(
                                        'w-full h-full bg-cover bg-center',
                                        !item.isNext && 'grayscale group-hover:grayscale-0 transition-all'
                                    )}
                                    style={{ backgroundImage: `url(${item.imageUrl})` }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/80">
                                    <Mic className="w-5 h-5 text-muted-foreground" />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex flex-col justify-center flex-1 min-w-0 pr-1 relative z-10">
                            <div className="flex justify-between items-baseline mb-0.5">
                                <span className={cn(
                                    'text-[8px] uppercase tracking-wider font-bold',
                                    item.isNext ? 'text-news-accent' : 'text-muted-foreground group-hover:text-news-accent/70'
                                )}>
                                    {item.label}
                                </span>
                                <span className={cn(
                                    'text-[9px] font-mono',
                                    item.isNext ? 'text-news-accent/80' : 'text-muted-foreground'
                                )}>
                                    {item.duration}
                                </span>
                            </div>
                            <h4 className={cn(
                                'font-serif text-[14px] leading-snug line-clamp-2',
                                item.isNext ? 'text-foreground' : 'text-foreground/70 group-hover:text-foreground'
                            )}>
                                {item.title}
                            </h4>
                        </div>

                        {/* Trailing icon */}
                        <div className="shrink-0 pr-1">
                            {item.isNext ? (
                                <AudioLines className="w-4 h-4 text-news-accent animate-pulse" />
                            ) : (
                                <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Live Transcript */}
            <div className="pt-2">
                <h3 className="text-[10px] text-muted-foreground mb-3 uppercase tracking-widest flex items-center gap-2 font-bold">
                    <Clock className="w-3.5 h-3.5" /> Live Transcript
                </h3>
                <div className="space-y-4 px-1">
                    {TRANSCRIPT_LINES.map((line, i) => (
                        <div
                            key={i}
                            className={cn(
                                line.active
                                    ? 'relative pl-3 border-l-2 border-news-accent'
                                    : 'opacity-40'
                            )}
                        >
                            <p className={cn(
                                'font-serif leading-relaxed',
                                line.active ? 'text-base text-foreground font-medium' : 'text-sm text-foreground/70'
                            )}>
                                <span className={cn(
                                    'text-[10px] uppercase font-bold mr-2',
                                    line.active ? 'text-news-accent/80 block mb-1' : 'text-news-accent/50'
                                )}>
                                    {line.speaker}
                                </span>
                                {line.text}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   TTS Tab  (Coming Soon gated by TTS_ENABLED flag)
   ══════════════════════════════════════════════════════════ */
function TTSTab() {
    const [speed, setSpeed] = useState(1.2);

    if (!TTS_ENABLED) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-news-accent/10 flex items-center justify-center mb-4">
                    <Sparkles className="w-7 h-7 text-news-accent" />
                </div>
                <h3 className="text-base font-serif font-bold text-foreground mb-2">Text-to-Speech</h3>
                <p className="text-sm text-center max-w-[240px] mb-4">
                    Generate professional narration of any article using AI voices.
                </p>
                <span className="px-4 py-1.5 rounded-full bg-news-accent/20 text-news-accent text-xs font-bold uppercase tracking-wider border border-news-accent/30">
                    Coming Soon
                </span>
            </div>
        );
    }

    /* ── Active TTS content (shown when flag is on) ── */
    return (
        <div className="space-y-6 pb-20">
            {/* Active Voice Card */}
            <div className="bg-card rounded-xl border border-news-accent/20 p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3">
                    <span className="px-2 py-0.5 bg-news-accent/20 rounded border border-news-accent/30 text-news-accent/80 text-[9px] font-bold uppercase tracking-wider">
                        Active Voice
                    </span>
                </div>

                <div className="flex gap-4 items-start relative z-10">
                    <div className="w-16 h-16 rounded-full border-2 border-news-accent/40 overflow-hidden shadow-lg shadow-black/20 shrink-0 bg-muted">
                        <div className="w-full h-full flex items-center justify-center">
                            <Mic className="w-6 h-6 text-news-accent" />
                        </div>
                    </div>
                    <div className="flex flex-col pt-1 w-full">
                        <h3 className="font-serif text-lg text-foreground mb-1">Elena Vorkosigan</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-3">
                            Principal Narrator
                        </p>
                        {/* Visualizer bars */}
                        <div className="flex items-center gap-1.5 h-5">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="w-[3px] bg-news-accent rounded-full"
                                    style={{
                                        height: `${VISUALIZER_BAR_HEIGHTS[i] ?? 10}px`,
                                        animation: `pulse ${0.7 + i * 0.08}s ease-in-out infinite alternate`,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Speed control */}
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Speed</span>
                        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-full border border-border">
                            <button
                                onClick={() => setSpeed((s) => Math.max(0.5, +(s - 0.1).toFixed(1)))}
                                className="w-6 h-6 flex items-center justify-center text-[10px] text-muted-foreground hover:text-foreground"
                            >
                                −
                            </button>
                            <span className="font-mono text-xs text-news-accent">{speed}x</span>
                            <button
                                onClick={() => setSpeed((s) => Math.min(3, +(s + 0.1).toFixed(1)))}
                                className="w-6 h-6 flex items-center justify-center text-[10px] text-muted-foreground hover:text-foreground"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Generate button */}
            <button className="w-full py-4 bg-gradient-to-r from-news-accent/70 to-news-accent hover:from-news-accent hover:to-news-accent/90 text-white font-bold text-sm uppercase tracking-widest rounded-lg shadow-lg shadow-news-accent/10 active:scale-[0.99] transition-all flex items-center justify-center gap-2 border border-news-accent/30 font-serif">
                <Sparkles className="w-4 h-4" />
                Generate Audio
            </button>
            <div className="flex justify-between items-center px-2 -mt-4">
                <span className="text-[10px] text-muted-foreground font-mono">Est. duration: 4m 12s</span>
                <span className="text-[10px] text-muted-foreground font-mono">Credits: 12/50</span>
            </div>

            {/* Recent Generations */}
            <div className="pt-2">
                <h3 className="text-[10px] text-muted-foreground mb-3 uppercase tracking-widest flex items-center gap-2 font-bold">
                    <Clock className="w-3.5 h-3.5" /> Recent Generations
                </h3>
                <div className="space-y-2">
                    {TTS_RECENT.map((gen, i) => (
                        <div
                            key={i}
                            className="bg-card/50 rounded-lg p-3 border border-border flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                                    <Mic className="w-3.5 h-3.5 text-news-accent/60" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs text-foreground/70 font-serif truncate group-hover:text-foreground">
                                        {gen.title}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground font-mono">{gen.time}</span>
                                </div>
                            </div>
                            <button className="text-news-accent hover:text-foreground transition-colors">
                                <PlayCircle className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
