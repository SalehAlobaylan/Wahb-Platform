'use client';

import { Pause, Play, X } from 'lucide-react';
import { useNowPlayingStore } from '@/lib/stores/now-playing-store';
import { cn } from '@/lib/utils';

interface NowPlayingBarProps {
    /** When true, renders inline (no fixed positioning) — for use inside the bottom sheet */
    inline?: boolean;
}

/**
 * Persistent "Now Playing" bar. Two modes:
 *   • inline=false (default): fixed to the bottom of the viewport (used in root layout for pages without a bottom sheet)
 *   • inline=true: rendered as a normal block element above the bottom sheet
 */
export function NowPlayingBar({ inline = false }: NowPlayingBarProps) {
    const { currentItem, isPlaying, togglePlayPause, stop } = useNowPlayingStore();

    if (!currentItem) return null;

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
