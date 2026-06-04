'use client';

import { Pause, Play, X } from 'lucide-react';
import { useNowPlayingStore } from '@/lib/stores/now-playing-store';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n/use-translations';

interface NowPlayingBarProps {
    /** When true, renders inline (no fixed positioning) — for use inside the bottom sheet */
    inline?: boolean;
    /**
     * When true, renders an expanded view with progress bar, skip controls,
     * and volume — for use inside the news page bottom sheet.
     */
    expanded?: boolean;
}

/**
 * Persistent "Now Playing" bar. Three modes:
 *   • inline=false (default): fixed to the bottom of the viewport
 *   • inline=true: rendered as a normal block element
 *   • expanded=true: full playback controls (progress, skip, volume)
 */
export function NowPlayingBar({ inline = false, expanded = false }: NowPlayingBarProps) {
    const { currentItem, isPlaying, togglePlayPause, stop } = useNowPlayingStore();
    const t = useTranslations();

    if (!currentItem) return null;

    /* ── Expanded variant (news page bottom sheet) ────────────── */
    if (expanded) {
        return (
            <div className="mb-5">
                {/* Track info */}
                <div className="flex items-center gap-3 mb-4 px-1">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {currentItem.thumbnail_url ? (
                            // eslint-disable-next-line @next/next/no-img-element -- remote CDN URLs vary; object-fit normalizes crop
                            <img
                                src={currentItem.thumbnail_url}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover object-center"
                                draggable={false}
                                loading="lazy"
                            />
                        ) : (
                            <div className="flex size-full items-center justify-center">
                                <span className="text-base opacity-30">🎵</span>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p dir="auto" className="text-sm font-semibold text-foreground truncate leading-tight">
                            {currentItem.title || t('nowPlaying.nowPlaying')}
                        </p>
                        <p dir="auto" className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                            {currentItem.author || currentItem.source_name || ''}
                        </p>
                    </div>
                </div>

                {/* Play/Pause */}
                <div className="flex items-center justify-center mb-2">
                    <button
                        onClick={togglePlayPause}
                        className="w-14 h-14 rounded-full bg-gradient-to-b from-news-accent/90 to-news-accent flex items-center justify-center shadow-lg shadow-news-accent/20 hover:scale-105 active:scale-95 transition-all"
                        aria-label={isPlaying ? t('nowPlaying.pause') : t('nowPlaying.play')}
                    >
                        {isPlaying ? (
                            <Pause className="w-7 h-7 text-white fill-white" />
                        ) : (
                            <Play className="w-7 h-7 text-white fill-white ml-0.5" />
                        )}
                    </button>
                </div>
            </div>
        );
    }

    /* ── Compact variant (default) ────────────────────────────── */
    return (
        <div
            className={cn(
                inline
                    ? 'w-full pb-1'
                    : 'fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto animate-in slide-in-from-bottom duration-300'
            )}
        >
            <div
                className={cn(
                    'mx-2 px-3 py-2.5 rounded-2xl',
                    inline ? 'mb-1' : 'mb-2',
                    'bg-card/95 backdrop-blur-xl',
                    'border border-border',
                    'shadow-[0_-2px_12px_rgba(0,0,0,0.08)]',
                    'flex items-center gap-3'
                )}
            >
                {/* Thumbnail — fixed square frame; image is cropped uniformly */}
                <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {currentItem.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- remote CDN URLs vary; object-fit normalizes crop
                        <img
                            src={currentItem.thumbnail_url}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover object-center"
                            draggable={false}
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex size-full items-center justify-center">
                            <span className="text-sm opacity-30">🎵</span>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate leading-tight">
                        {currentItem.title || t('nowPlaying.nowPlaying')}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                        {currentItem.author || currentItem.source_name || 'Unknown'}
                    </p>
                </div>

                {/* Play/Pause */}
                <button
                    onClick={togglePlayPause}
                    className="w-9 h-9 rounded-full bg-news-accent flex items-center justify-center shrink-0 hover:bg-news-accent/80 active:scale-95 transition-all"
                    aria-label={isPlaying ? t('nowPlaying.pause') : t('nowPlaying.play')}
                >
                    {isPlaying ? (
                        <Pause className="w-4 h-4 text-white fill-white" />
                    ) : (
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                    )}
                </button>

                {/* Close */}
                <button
                    onClick={stop}
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={t('nowPlaying.dismiss')}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
