'use client';

import { Pause, Play, X, SkipBack, SkipForward, Volume2, ListMusic } from 'lucide-react';
import { useNowPlayingStore } from '@/lib/stores/now-playing-store';
import { cn } from '@/lib/utils';

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

    if (!currentItem) return null;

    /* ── Expanded variant (news page bottom sheet) ────────────── */
    if (expanded) {
        return (
            <div className="mb-5">
                {/* Progress bar */}
                <div className="w-full mb-4">
                    <div className="flex justify-between text-[10px] text-[#a3a3a3] font-mono mb-2">
                        <span>12:45</span>
                        <span className="text-bronze/80 text-[9px] uppercase tracking-wider font-bold">
                            Live Sync
                        </span>
                        <span>34:20</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-[35%] bg-bronze rounded-full relative">
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-lg" />
                        </div>
                    </div>
                </div>

                {/* Transport controls */}
                <div className="flex items-center justify-between px-4 mb-2">
                    <button className="text-[#a3a3a3] hover:text-white transition-colors">
                        <Volume2 className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-6">
                        <button className="text-[#a3a3a3] hover:text-white transition-colors">
                            <SkipBack className="w-6 h-6" />
                        </button>
                        <button
                            onClick={togglePlayPause}
                            className="w-14 h-14 rounded-full bg-gradient-to-b from-bronze/90 to-bronze flex items-center justify-center shadow-lg shadow-bronze/20 hover:scale-105 active:scale-95 transition-all"
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isPlaying ? (
                                <Pause className="w-7 h-7 text-[#0a0a0a] fill-[#0a0a0a]" />
                            ) : (
                                <Play className="w-7 h-7 text-[#0a0a0a] fill-[#0a0a0a] ml-0.5" />
                            )}
                        </button>
                        <button className="text-[#a3a3a3] hover:text-white transition-colors">
                            <SkipForward className="w-6 h-6" />
                        </button>
                    </div>
                    <button className="text-bronze hover:text-white transition-colors">
                        <ListMusic className="w-5 h-5" />
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
                    'bg-[#1c1917]/95 backdrop-blur-xl',
                    'border border-white/10',
                    'shadow-[0_-4px_30px_rgba(0,0,0,0.5)]',
                    'flex items-center gap-3'
                )}
            >
                {/* Thumbnail */}
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                    {currentItem.thumbnail_url ? (
                        <div
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${currentItem.thumbnail_url})` }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="text-sm opacity-30">🎵</span>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate leading-tight">
                        {currentItem.title || 'Now Playing'}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate leading-tight mt-0.5">
                        {currentItem.author || currentItem.source_name || 'Unknown'}
                    </p>
                </div>

                {/* Play/Pause */}
                <button
                    onClick={togglePlayPause}
                    className="w-9 h-9 rounded-full bg-bronze flex items-center justify-center shrink-0 hover:bg-bronze/80 active:scale-95 transition-all"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
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
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-zinc-500 hover:text-white transition-colors"
                    aria-label="Dismiss"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
