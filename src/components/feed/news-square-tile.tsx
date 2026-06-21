'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, X, Zap } from 'lucide-react';
import { useNowPlayingStore, audioPlaybackTime } from '@/lib/stores/now-playing-store';
import { useAudioProgress } from '@/lib/hooks/use-audio-progress';
import { useTranslations, useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { ContentItem } from '@/types';

const LONG_PRESS_MS = 450;

function formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * The News page's square tile. Replaces the old "+" create FAB (create is
 * disabled here for now). When audio is playing it becomes a squared player:
 *   • tap        → play / pause (progress shown as a ring tracing the square)
 *   • long-press → full-controls popover (scrub, skip ±15s, play/pause, stop)
 * When nothing is playing it shows a switchable info tile that rotates through
 * the clock (time + date) and any breaking story.
 */
interface NewsSquareTileProps {
    /** Latest breaking story (lifecycle === 'breaking'), surfaced in the idle tile */
    breaking?: ContentItem | null;
    /** Open the breaking story (wired to the News page's article reader) */
    onOpenBreaking?: (item: ContentItem) => void;
}

export function NewsSquareTile({ breaking, onOpenBreaking }: NewsSquareTileProps = {}) {
    const t = useTranslations();
    const currentItem = useNowPlayingStore((s) => s.currentItem);
    const isPlaying = useNowPlayingStore((s) => s.isPlaying);
    const togglePlayPause = useNowPlayingStore((s) => s.togglePlayPause);

    const [showControls, setShowControls] = useState(false);

    const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const longPressTriggeredRef = useRef(false);

    const startPress = useCallback(() => {
        if (!currentItem) return;
        longPressTriggeredRef.current = false;
        if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
        pressTimerRef.current = setTimeout(() => {
            longPressTriggeredRef.current = true;
            setShowControls(true);
        }, LONG_PRESS_MS);
    }, [currentItem]);

    const endPress = useCallback(() => {
        if (pressTimerRef.current) {
            clearTimeout(pressTimerRef.current);
            pressTimerRef.current = null;
        }
        if (!currentItem) return;
        if (!longPressTriggeredRef.current) togglePlayPause();
    }, [currentItem, togglePlayPause]);

    const cancelPress = useCallback(() => {
        if (pressTimerRef.current) {
            clearTimeout(pressTimerRef.current);
            pressTimerRef.current = null;
        }
    }, []);

    useEffect(() => () => {
        if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    }, []);

    // Nothing playing → switchable info tile (create disabled for now).
    if (!currentItem) {
        return <IdleTile breaking={breaking} onOpenBreaking={onOpenBreaking} />;
    }

    return (
        <div className="relative">
            <button
                type="button"
                onPointerDown={startPress}
                onPointerUp={endPress}
                onPointerLeave={cancelPress}
                onPointerCancel={cancelPress}
                onContextMenu={(e) => e.preventDefault()}
                className="group relative block h-14 w-14 overflow-visible rounded-[18px] shadow-lg shadow-black/25 transition-transform select-none active:scale-[0.96]"
                style={{ touchAction: 'none' }}
                aria-label={isPlaying ? t('nowPlaying.pause') : t('nowPlaying.play')}
            >
                {/* Artwork / fallback (always dark so the ring + icon read clearly) */}
                <span className="absolute inset-0 block overflow-hidden rounded-[18px] bg-neutral-900">
                    {currentItem.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- remote CDN URLs vary; object-fit normalizes crop
                        <img
                            src={currentItem.thumbnail_url}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover object-center"
                            draggable={false}
                            loading="lazy"
                        />
                    ) : null}
                    {/* Soft scrim for contrast */}
                    <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/30" />
                </span>

                {/* Rounded-square progress ring */}
                <SquareProgressRing />

                {/* Center play / pause — soft glass disc */}
                <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 shadow-sm ring-1 ring-white/40 backdrop-blur-md transition-transform group-active:scale-90">
                        {isPlaying ? (
                            <Pause className="h-3.5 w-3.5 fill-white text-white" />
                        ) : (
                            <Play className="ml-px h-3.5 w-3.5 fill-white text-white" />
                        )}
                    </span>
                </span>
            </button>

            {showControls && <NowPlayingControlsPopover onClose={() => setShowControls(false)} />}
        </div>
    );
}

/* ── Square progress ring ─────────────────────────────────────── */
function SquareProgressRing() {
    const { progress } = useAudioProgress();
    // pathLength=100 lets us express the offset as a simple percentage,
    // independent of the rect's real perimeter length.
    const offset = 100 - Math.min(100, Math.max(0, progress * 100));

    return (
        <svg
            viewBox="0 0 56 56"
            className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
            fill="none"
        >
            {/* Track */}
            <rect
                x="2"
                y="2"
                width="52"
                height="52"
                rx="16"
                stroke="rgba(255,255,255,0.28)"
                strokeWidth="2.5"
            />
            {/* Progress (starts at top, sweeps clockwise via the -90° rotation) */}
            <rect
                x="2"
                y="2"
                width="52"
                height="52"
                rx="16"
                pathLength={100}
                stroke="var(--news-accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="100"
                strokeDashoffset={offset}
            />
        </svg>
    );
}

/* ── Idle tile (default: clock) ───────────────────────────────── */
type IdleFace = 'clock' | 'breaking';

function IdleTile({
    breaking,
    onOpenBreaking,
}: {
    breaking?: ContentItem | null;
    onOpenBreaking?: (item: ContentItem) => void;
}) {
    const t = useTranslations();
    const { locale } = useI18n();
    const intlLocale = locale === 'ar' ? 'ar' : 'en';
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        // First paint on the next frame (client-only — avoids a hydration
        // mismatch), then align ticks to the top of each minute.
        const raf = requestAnimationFrame(() => setNow(new Date()));
        const timeout = setTimeout(() => {
            setNow(new Date());
            interval = setInterval(() => setNow(new Date()), 60_000);
        }, (60 - new Date().getSeconds()) * 1000);
        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(timeout);
            if (interval) clearInterval(interval);
        };
    }, []);

    // Switchable faces. Clock is always present; breaking is appended when a
    // breaking story exists. TODO: append notifications / other tiles here.
    const hasBreaking = Boolean(breaking?.title);
    const faces = useMemo<IdleFace[]>(
        () => (hasBreaking ? ['clock', 'breaking'] : ['clock']),
        [hasBreaking]
    );

    const [faceIdx, setFaceIdx] = useState(0);

    // Auto-rotate through the faces when there is more than one. `face` reads
    // the index modulo length, so a shrinking `faces` never needs a reset here.
    useEffect(() => {
        if (faces.length < 2) return;
        const id = setInterval(() => setFaceIdx((i) => (i + 1) % faces.length), 5000);
        return () => clearInterval(id);
    }, [faces.length]);

    const face = faces[faceIdx % faces.length];

    const time = now
        ? new Intl.DateTimeFormat(intlLocale, { hour: '2-digit', minute: '2-digit' }).format(now)
        : '';
    const date = now
        ? new Intl.DateTimeFormat(intlLocale, { weekday: 'short', day: 'numeric' }).format(now)
        : '';

    const handleTap = () => {
        // On the breaking face, open the story; otherwise advance the carousel.
        if (face === 'breaking' && breaking && onOpenBreaking) {
            onOpenBreaking(breaking);
            return;
        }
        if (faces.length > 1) setFaceIdx((i) => (i + 1) % faces.length);
    };

    const ariaLabel = face === 'breaking' ? `${t('idle.breaking')}: ${breaking?.title ?? ''}` : `${time} ${date}`;

    return (
        <button
            type="button"
            onClick={handleTap}
            className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[18px] bg-gradient-to-br from-news-accent to-news-accent/80 text-white shadow-lg shadow-black/25 ring-1 ring-white/10 transition-transform select-none active:scale-[0.96]"
            aria-label={ariaLabel}
        >
            {face === 'breaking' ? (
                <span key="breaking" className="flex animate-in fade-in flex-col items-center justify-center gap-1 duration-300">
                    <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                        <Zap className="h-3.5 w-3.5 fill-white" />
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-[0.14em]">
                        {t('idle.breaking')}
                    </span>
                </span>
            ) : (
                <span key="clock" className="flex animate-in fade-in flex-col items-center justify-center leading-none duration-300">
                    <span className="text-[14px] font-bold tabular-nums tracking-tight">{time}</span>
                    <span className="mt-1 text-[9px] font-medium uppercase tracking-wide opacity-80">
                        {date}
                    </span>
                </span>
            )}
        </button>
    );
}

/* ── Full-controls popover (long-press) ───────────────────────── */
function NowPlayingControlsPopover({ onClose }: { onClose: () => void }) {
    const t = useTranslations();
    const currentItem = useNowPlayingStore((s) => s.currentItem);
    const isPlaying = useNowPlayingStore((s) => s.isPlaying);
    const togglePlayPause = useNowPlayingStore((s) => s.togglePlayPause);
    const seek = useNowPlayingStore((s) => s.seek);
    const stop = useNowPlayingStore((s) => s.stop);

    const { currentTime, duration } = useAudioProgress();
    const [scrub, setScrub] = useState<number | null>(null);

    if (!currentItem) return null;

    const displayTime = scrub ?? currentTime;
    const hasDuration = duration > 0;

    const commitScrub = () => {
        if (scrub !== null) {
            seek(scrub);
            setScrub(null);
        }
    };

    const skip = (delta: number) => {
        const base = audioPlaybackTime.itemId === currentItem.id ? audioPlaybackTime.time : currentTime;
        const target = hasDuration ? Math.min(duration, Math.max(0, base + delta)) : Math.max(0, base + delta);
        seek(target);
    };

    return (
        <>
            {/* Dismiss backdrop */}
            <div
                className="fixed inset-0 z-[45]"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Popover anchored above the square (same side as the tile) */}
            <div
                onClick={(e) => e.stopPropagation()}
                className={cn(
                    'absolute bottom-full end-0 mb-3 z-50',
                    'w-[280px] max-w-[calc(100vw-2rem)]',
                    'rounded-lg border border-border bg-card/95 backdrop-blur-xl',
                    'shadow-[0_8px_28px_rgba(0,0,0,0.18)] p-3',
                    'animate-in fade-in slide-in-from-bottom-2 duration-200'
                )}
                role="dialog"
                aria-label={t('nowPlaying.controls')}
            >
                {/* Header: artwork + meta + stop */}
                <div className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                        {currentItem.thumbnail_url ? (
                            // eslint-disable-next-line @next/next/no-img-element -- remote CDN URLs vary
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
                    <div className="min-w-0 flex-1">
                        <p dir="auto" className="truncate text-sm font-semibold leading-tight text-foreground">
                            {currentItem.title || t('nowPlaying.nowPlaying')}
                        </p>
                        <p dir="auto" className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
                            {currentItem.author || currentItem.source_name || ''}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            stop();
                            onClose();
                        }}
                        className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={t('nowPlaying.dismiss')}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Scrubber */}
                <div className="mt-3">
                    <input
                        type="range"
                        min={0}
                        max={hasDuration ? duration : 1}
                        step={0.1}
                        value={displayTime}
                        disabled={!hasDuration}
                        onChange={(e) => setScrub(Number(e.target.value))}
                        onPointerUp={commitScrub}
                        onMouseUp={commitScrub}
                        onTouchEnd={commitScrub}
                        onKeyUp={commitScrub}
                        className="h-1.5 w-full cursor-pointer accent-news-accent disabled:opacity-50"
                        aria-label={t('nowPlaying.controls')}
                    />
                    <div className="mt-1 flex justify-between text-[10px] tabular-nums text-muted-foreground">
                        <span>{formatTime(displayTime)}</span>
                        <span>{hasDuration ? formatTime(duration) : '--:--'}</span>
                    </div>
                </div>

                {/* Transport controls */}
                <div className="mt-2 flex items-center justify-center gap-6">
                    <button
                        onClick={() => skip(-15)}
                        className="relative flex size-10 items-center justify-center text-foreground transition-colors hover:text-news-accent"
                        aria-label={t('nowPlaying.skipBack')}
                    >
                        <RotateCcw className="h-5 w-5" />
                        <span className="absolute text-[8px] font-bold">15</span>
                    </button>

                    <button
                        onClick={togglePlayPause}
                        className="flex size-12 items-center justify-center rounded-full bg-gradient-to-b from-news-accent/90 to-news-accent text-white shadow-md shadow-news-accent/20 transition-transform active:scale-95"
                        aria-label={isPlaying ? t('nowPlaying.pause') : t('nowPlaying.play')}
                    >
                        {isPlaying ? (
                            <Pause className="h-6 w-6 fill-white" />
                        ) : (
                            <Play className="ml-0.5 h-6 w-6 fill-white" />
                        )}
                    </button>

                    <button
                        onClick={() => skip(15)}
                        className="relative flex size-10 items-center justify-center text-foreground transition-colors hover:text-news-accent"
                        aria-label={t('nowPlaying.skipForward')}
                    >
                        <RotateCcw className="h-5 w-5 -scale-x-100" />
                        <span className="absolute text-[8px] font-bold">15</span>
                    </button>
                </div>
            </div>
        </>
    );
}
