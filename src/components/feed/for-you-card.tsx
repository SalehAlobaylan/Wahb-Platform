'use client';

import { useRef, useEffect, useCallback, useState, type MutableRefObject } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Play, Headphones, Archive, Loader2, Maximize2, Minimize2, FileText, PauseCircle } from 'lucide-react';
import { useFeedStore } from '@/lib/stores';
import { audioPlaybackTime } from '@/lib/stores/now-playing-store';
import { useShallow } from 'zustand/react/shallow';
import { requestRestore } from '@/lib/api/feeds';
import { useRequestTranscription, useTranscript } from '@/lib/hooks';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';
import type { ContentItem, TranscriptSegment } from '@/types';
import type { ForYouDisplayMode } from '@/lib/stores/feed-store';

interface ForYouCardProps {
    item: ContentItem;
    isActive: boolean;
    /** Ref to report current playback time (seconds) to the parent for handoff */
    videoTimeRef?: MutableRefObject<number>;
}

/**
 * Full-screen video/audio card for For You feed.
 * Only handles media playback and content display.
 * Action buttons and bottom sheet are rendered at the page level.
 */
export function ForYouCard({ item, isActive, videoTimeRef }: ForYouCardProps) {
    const t = useTranslations();
    const videoRef = useRef<HTMLVideoElement>(null);
    const wasActiveRef = useRef(false);
    const lastPersistRef = useRef(0);
    const latestPlaybackRef = useRef<{ time: number; percent: number } | null>(null);
    // Resume target applied on activation; re-applied on loadedmetadata in case
    // the seek landed before the element could honor it. Cleared on the first
    // timeupdate, when the playing video becomes the source of truth.
    const pendingResumeRef = useRef<number | null>(null);
    const {
        isPlaying,
        globalPaused,
        setPlaying,
        togglePlay,
        setProgress,
        setForYouPlayback,
        playbackSpeed,
        forYouDisplayMode,
        setForYouDisplayMode,
    } = useFeedStore(
        useShallow((s) => ({
            isPlaying: s.isPlaying,
            globalPaused: s.globalPaused,
            setPlaying: s.setPlaying,
            togglePlay: s.togglePlay,
            setProgress: s.setProgress,
            setForYouPlayback: s.setForYouPlayback,
            playbackSpeed: s.playbackSpeed,
            forYouDisplayMode: s.forYouDisplayMode,
            setForYouDisplayMode: s.setForYouDisplayMode,
        }))
    );
    const [currentTime, setCurrentTime] = useState(
        () => useFeedStore.getState().forYouPlaybackById[item.id]?.timeSec ?? 0
    );
    const effectiveDisplayMode: ForYouDisplayMode = item.media_url ? forYouDisplayMode : 'transcript';
    const showTranscriptSurface = effectiveDisplayMode === 'transcript';
    const renderTranscriptSurface = showTranscriptSurface && isActive;
    const videoFitClass = effectiveDisplayMode === 'fill' ? 'object-cover' : 'object-contain';

    const applyTime = useCallback((timeSec?: number) => {
        if (!videoRef.current || typeof timeSec !== 'number') return;

        const duration = Number.isFinite(videoRef.current.duration) ? videoRef.current.duration : null;
        const upperBound = duration && duration > 0 ? Math.max(0, duration - 0.01) : Number.POSITIVE_INFINITY;
        const safeTime = Math.max(0, Math.min(timeSec, upperBound));
        videoRef.current.currentTime = safeTime;

        if (videoTimeRef) {
            videoTimeRef.current = safeTime;
        }
    }, [videoTimeRef]);

    // Where to resume from when this card becomes active, in order of freshness:
    //   1. The global <audio>'s exact position (the user kept listening via the
    //      now-playing bar while away) — consumed once, then the video owns time.
    //   2. The <video>'s own position — the card stayed mounted, so seeking to
    //      the throttled store snapshot would rewind up to 5s. Keep as-is.
    //   3. The persisted position (fresh mount / reload).
    const resolveResumeTime = useCallback((): number | null => {
        if (audioPlaybackTime.itemId === item.id) {
            const time = audioPlaybackTime.time;
            audioPlaybackTime.itemId = null;
            return time;
        }
        if (videoRef.current && videoRef.current.currentTime > 0.5) {
            return null;
        }
        const saved = useFeedStore.getState().forYouPlaybackById[item.id];
        return typeof saved?.timeSec === 'number' ? saved.timeSec : null;
    }, [item.id]);

    // Handle autoplay based on active state
    useEffect(() => {
        if (!videoRef.current) return;

        if (isActive) {
            if (!wasActiveRef.current) {
                const resume = resolveResumeTime();
                if (resume !== null) {
                    pendingResumeRef.current = resume;
                    applyTime(resume);
                }
                const saved = useFeedStore.getState().forYouPlaybackById[item.id];
                setProgress(saved?.progress ?? 0);
            }

            if (globalPaused || !isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(() => {
                    setPlaying(false);
                });
            }
        } else {
            videoRef.current.pause();
            // Flush the exact position when the card deactivates so the next
            // activation (or another device of truth) doesn't rewind to the
            // throttled 5s snapshot.
            if (wasActiveRef.current) {
                const latest = latestPlaybackRef.current;
                if (latest) {
                    setForYouPlayback(item.id, latest.time, latest.percent);
                    lastPersistRef.current = Date.now();
                }
            }
        }
        wasActiveRef.current = isActive;
    }, [isActive, globalPaused, isPlaying, setPlaying, setProgress, setForYouPlayback, item.id, resolveResumeTime, applyTime]);

    // Handle playback speed
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = playbackSpeed;
        }
    }, [playbackSpeed]);

    // Handle play/pause
    useEffect(() => {
        if (!videoRef.current || !isActive) return;

        if (globalPaused || !isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play().catch(() => setPlaying(false));
        }
    }, [isPlaying, globalPaused, isActive, setPlaying]);

    // Apply seek after metadata is loaded when duration becomes known. Prefer
    // the pending resume target (it may come from the global <audio>, which is
    // fresher than the persisted snapshot).
    useEffect(() => {
        if (!videoRef.current) return;

        const onLoadedMetadata = () => {
            if (!isActive) return;
            const target =
                pendingResumeRef.current ??
                useFeedStore.getState().forYouPlaybackById[item.id]?.timeSec;
            applyTime(target);
        };

        const el = videoRef.current;
        el.addEventListener('loadedmetadata', onLoadedMetadata);
        return () => {
            el.removeEventListener('loadedmetadata', onLoadedMetadata);
        };
    }, [isActive, item.id, applyTime]);

    // Flush the latest position to the store on unmount (e.g. navigating away)
    // so the throttle window below doesn't drop the last few seconds. Guarded by
    // latestPlaybackRef so a card that never played can't overwrite a saved
    // position with 0.
    useEffect(() => {
        return () => {
            const latest = latestPlaybackRef.current;
            if (latest) {
                setForYouPlayback(item.id, latest.time, latest.percent);
            }
        };
    }, [item.id, setForYouPlayback]);

    // Unmount cleanups never run on a hard refresh or tab close, so also flush
    // the exact position on pagehide (active card only — it's the one playing).
    useEffect(() => {
        if (!isActive) return;
        const flush = () => {
            const latest = latestPlaybackRef.current;
            if (latest) {
                setForYouPlayback(item.id, latest.time, latest.percent);
            }
        };
        window.addEventListener('pagehide', flush);
        return () => window.removeEventListener('pagehide', flush);
    }, [isActive, item.id, setForYouPlayback]);

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        pendingResumeRef.current = null;
        const nextTime = videoRef.current.currentTime;
        const percent = (nextTime / videoRef.current.duration) * 100;
        const safePercent = Number.isFinite(percent) ? percent : 0;
        if (isActive) {
            setProgress(safePercent);
            setCurrentTime(nextTime);
        }
        // Report current time to parent for now-playing handoff
        if (videoTimeRef) {
            videoTimeRef.current = nextTime;
        }
        latestPlaybackRef.current = { time: nextTime, percent: safePercent };
        // Persist the resume position at most once per ~5s. Previously this ran
        // on every timeupdate (~4×/s); since forYouPlaybackById is persisted,
        // that serialized + wrote the whole store to localStorage every tick.
        const now = Date.now();
        if (now - lastPersistRef.current >= 5000) {
            lastPersistRef.current = now;
            setForYouPlayback(item.id, nextTime, safePercent);
        }
    };

    const isArchived = item.is_archived || (!item.media_url && item.status === 'ARCHIVED');

    return (
        <div className="relative w-full h-full snap-start snap-always shrink-0 overflow-hidden bg-black">
            {isArchived && (
                <ArchivedOverlay item={item} />
            )}
            {/* Background/Video */}
            {item.media_url ? (
                <>
                    {/* Poster behind video keeps fill mode and loading states visually stable. */}
                    {item.thumbnail_url && (
                        <Image
                            src={item.thumbnail_url}
                            alt=""
                            fill
                            sizes="100vw"
                            className={cn(
                                'object-cover',
                                renderTranscriptSurface && 'opacity-20 blur-sm'
                            )}
                            priority={isActive}
                            unoptimized
                        />
                    )}
                    <video
                        ref={videoRef}
                        data-content-id={item.id}
                        className={cn(
                            'absolute inset-0 h-full w-full bg-black',
                            videoFitClass,
                            renderTranscriptSurface && 'opacity-0 pointer-events-none'
                        )}
                        src={item.media_url}
                        loop
                        muted={false}
                        playsInline
                        onTimeUpdate={handleTimeUpdate}
                        onClick={togglePlay}
                    />
                </>
            ) : (
                /* Audio-only: transcript-first with subtle artwork fallback behind it. */
                <div className="absolute inset-0">
                    {item.thumbnail_url ? (
                        <Image
                            src={item.thumbnail_url}
                            alt=""
                            fill
                            sizes="100vw"
                            className="object-cover opacity-60"
                            priority={isActive}
                            unoptimized
                        />
                    ) : (
                        <div className="absolute inset-0 bg-zinc-900" />
                    )}
                </div>
            )}

            {renderTranscriptSurface && (
                <TranscriptSurface
                    item={item}
                    currentTime={currentTime}
                    isPlaying={isPlaying && !globalPaused}
                    onTogglePlay={togglePlay}
                />
            )}

            {/* Gradient overlay (Clickable to pause/play) */}
            <div
                className={cn(
                    'absolute inset-0 z-[1] bg-gradient-to-b from-black/40 via-transparent to-black/90 cursor-pointer',
                    renderTranscriptSurface && 'pointer-events-none'
                )}
                onClick={togglePlay}
            />

            {isActive && (
                <DisplayModeSelector
                    mode={effectiveDisplayMode}
                    onChange={setForYouDisplayMode}
                />
            )}

            {/* Content info — positioned above the fixed bottom sheet */}
            <div className={cn(
                'absolute bottom-[100px] left-0 right-0 z-10 p-4 space-y-3',
                renderTranscriptSurface && 'pointer-events-none opacity-0'
            )}>
                {/* Type badge */}
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gold/90 text-white backdrop-blur-md flex items-center gap-1">
                        <Headphones className="w-3 h-3" />
                        {item.type === 'PODCAST' ? t('foryou.badge.podcast') : t('foryou.badge.audio')}
                    </span>
                    {item.source_name && (
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase border border-white/30 text-white/90 backdrop-blur-sm">
                            {item.source_name}
                        </span>
                    )}
                </div>

                {/* Title */}
                <h2 dir="auto" className="text-xl font-bold text-white leading-tight drop-shadow-lg line-clamp-2">
                    {item.title}
                </h2>

                {/* Author */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gold/40 flex items-center justify-center text-xs overflow-hidden border border-white/20">
                        <img
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.author}`}
                            alt={item.author || 'Author'}
                            className="w-full h-full"
                        />
                    </div>
                    <span dir="auto" className="text-sm text-gray-200 font-medium">{item.author}</span>
                </div>

                {/* Duration */}
                {item.duration_sec && (
                    <span className="text-xs text-white/60">
                        {Math.floor(item.duration_sec / 60)}:{(item.duration_sec % 60).toString().padStart(2, '0')}
                    </span>
                )}
            </div>

            {/* Play/Pause overlay */}
            {isActive && !isPlaying && !renderTranscriptSurface && (
                <div
                    className="absolute inset-0 flex items-center justify-center cursor-pointer z-10 pointer-events-none"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center justify-center pointer-events-auto drop-shadow-2xl"
                        onClick={togglePlay}
                    >
                        <Play className="w-16 h-16 text-white/90 fill-white/90" />
                    </motion.div>
                </div>
            )}

            {isActive && globalPaused && !renderTranscriptSurface && (
                <div className="absolute top-20 left-4 z-10 pointer-events-none">
                    <span className="px-2.5 py-1 rounded-full bg-black/55 border border-white/15 text-white/90 text-[11px] font-semibold tracking-wide">
                        {t('foryou.paused')}
                    </span>
                </div>
            )}
        </div>
    );
}

const DISPLAY_MODES: Array<{
    mode: ForYouDisplayMode;
    label: string;
    icon: typeof Minimize2;
}> = [
    { mode: 'fit', label: 'foryou.display.fit', icon: Minimize2 },
    { mode: 'fill', label: 'foryou.display.fill', icon: Maximize2 },
    { mode: 'transcript', label: 'foryou.display.transcript', icon: FileText },
];

function DisplayModeSelector({
    mode,
    onChange,
}: {
    mode: ForYouDisplayMode;
    onChange: (mode: ForYouDisplayMode) => void;
}) {
    const t = useTranslations();
    return (
        <div
            className="absolute right-4 top-24 z-20 rounded-full border border-white/15 bg-black/45 p-1 shadow-lg backdrop-blur-md"
            aria-label="Display mode"
            onClick={(event) => event.stopPropagation()}
        >
            <div className="flex flex-col gap-1">
                {DISPLAY_MODES.map(({ mode: option, label, icon: Icon }) => (
                    <button
                        key={option}
                        type="button"
                        aria-label={t(label)}
                        aria-pressed={mode === option}
                        title={t(label)}
                        onClick={() => onChange(option)}
                        className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-all hover:bg-white/15 hover:text-white',
                            mode === option && 'bg-gold text-white shadow-[0_0_14px_rgba(218,164,40,0.35)]'
                        )}
                    >
                        <Icon className="h-4 w-4" />
                    </button>
                ))}
            </div>
        </div>
    );
}

function TranscriptSurface({
    item,
    currentTime,
    isPlaying,
    onTogglePlay,
}: {
    item: ContentItem;
    currentTime: number;
    isPlaying: boolean;
    onTogglePlay: () => void;
}) {
    const t = useTranslations();
    const { isAuthenticated } = useAuthStore();
    const triggerMutation = useRequestTranscription();
    const hasTranscript = !!item.transcript_id;
    const { data: transcript, isLoading, error } = useTranscript(hasTranscript ? item.transcript_id : null);
    const fallbackText = item.body_text || item.excerpt || '';

    return (
        <div
            className="absolute inset-0 z-10 flex flex-col overflow-hidden px-5 pb-28 pt-24 text-white"
            onClick={onTogglePlay}
            data-testid="transcript-surface"
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(218,164,40,0.22),transparent_34%),linear-gradient(180deg,rgba(0,0,0,0.48),rgba(0,0,0,0.92))]" />

            <div className="relative z-10 max-w-[calc(100%-56px)] space-y-2 pr-14">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
                    <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-black/30 px-2.5 py-1 backdrop-blur-sm">
                        <FileText className="h-3 w-3" />
                        {t('transcript.live')}
                    </span>
                    {item.source_name && (
                        <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-white/70 backdrop-blur-sm">
                            {item.source_name}
                        </span>
                    )}
                </div>
                <h2 dir="auto" className="line-clamp-2 text-lg font-bold leading-snug text-white drop-shadow-lg">
                    {item.title}
                </h2>
            </div>

            <div className="relative z-10 flex min-h-0 flex-1 items-center pt-3">
                {!hasTranscript && fallbackText ? (
                    <TranscriptReader text={fallbackText} />
                ) : null}

                {!hasTranscript && !fallbackText ? (
                    <NoTranscriptState
                        contentItemId={item.id}
                        isAuthenticated={isAuthenticated}
                        isPending={triggerMutation.isPending}
                        isSuccess={triggerMutation.isSuccess}
                        isError={triggerMutation.isError}
                        errorMessage={(triggerMutation.error as Error | null)?.message}
                        onGenerate={() => triggerMutation.mutate(item.id)}
                    />
                ) : null}

                {hasTranscript && isLoading ? (
                    <div className="mx-auto flex flex-col items-center justify-center py-8 text-white/70">
                        <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
                        <p className="text-sm">{t('transcript.loading')}</p>
                    </div>
                ) : null}

                {hasTranscript && (error || !transcript) && !isLoading ? (
                    <div className="mx-auto flex flex-col items-center justify-center py-8 text-white/70">
                        <FileText className="mb-2 h-8 w-8 opacity-50" />
                        <p className="text-sm">{t('transcript.failed')}</p>
                    </div>
                ) : null}

                {transcript ? (
                    <TranscriptText
                        fullText={transcript.full_text}
                        segments={transcript.word_timestamps}
                        language={transcript.language}
                        currentTime={currentTime}
                    />
                ) : null}
            </div>

            {!isPlaying && (
                <div className="pointer-events-none absolute bottom-24 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-xs font-semibold text-white/85 backdrop-blur-md">
                    <PauseCircle className="h-4 w-4 text-gold" />
                    {t('foryou.paused')}
                </div>
            )}
        </div>
    );
}

function NoTranscriptState({
    contentItemId,
    isAuthenticated,
    isPending,
    isSuccess,
    isError,
    errorMessage,
    onGenerate,
}: {
    contentItemId: string;
    isAuthenticated: boolean;
    isPending: boolean;
    isSuccess: boolean;
    isError: boolean;
    errorMessage?: string;
    onGenerate: () => void;
}) {
    const t = useTranslations();
    return (
        <div className="mx-auto flex max-w-sm flex-col items-center justify-center rounded-lg border border-white/10 bg-black/35 px-5 py-8 text-center text-white/70 backdrop-blur-md">
            <FileText className="mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">{t('transcript.unavailable')}</p>
            {isAuthenticated ? (
                isSuccess ? (
                    <p className="mt-2 text-xs text-gold">
                        {t('transcript.generating')}
                    </p>
                ) : (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            if (contentItemId) onGenerate();
                        }}
                        disabled={isPending}
                        className="mt-3 rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-gold/90 disabled:opacity-50"
                    >
                        {isPending ? (
                            <span className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                {t('transcript.generating')}
                            </span>
                        ) : (
                            t('transcript.generate')
                        )}
                    </button>
                )
            ) : (
                <p className="mt-1 text-xs">{t('transcript.signIn')}</p>
            )}
            {isError && (
                <p className="mt-2 text-xs text-red-300">
                    {errorMessage || t('transcript.failed')}
                </p>
            )}
        </div>
    );
}

function TranscriptText({
    fullText,
    segments,
    language,
    currentTime,
}: {
    fullText: string;
    segments?: TranscriptSegment[];
    language?: string;
    currentTime: number;
}) {
    const t = useTranslations();
    const listRef = useRef<HTMLDivElement>(null);
    const activeRef = useRef<HTMLDivElement>(null);
    const activeIndex = getActiveSegmentIndex(segments, currentTime);

    useEffect(() => {
        activeRef.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    }, [activeIndex]);

    if (!segments || segments.length === 0) {
        return <TranscriptReader text={fullText} language={language} />;
    }

    return (
        <div className="w-full" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                <span>{t('transcript.autoGenerated')}</span>
                {language && <span className="normal-case">{language}</span>}
            </div>
            <div
                ref={listRef}
                className="max-h-[56vh] space-y-2 overflow-y-auto overscroll-contain py-[22vh] pr-1 scrollbar-none"
                data-testid="live-transcript-list"
            >
                {segments.map((segment, index) => {
                    const isActive = index === activeIndex;
                    const isNear = Math.abs(index - activeIndex) <= 1;
                    return (
                        <div
                            key={`${segment.start}-${index}`}
                            ref={isActive ? activeRef : undefined}
                            dir="auto"
                            data-testid={isActive ? 'active-transcript-segment' : undefined}
                            className={cn(
                                'rounded-lg px-1 py-2 transition-all duration-300',
                                isActive
                                    ? 'scale-[1.01] text-white'
                                    : isNear
                                        ? 'text-white/48'
                                        : 'text-white/24'
                            )}
                        >
                            <div className={cn(
                                'mb-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums',
                                isActive
                                    ? 'border-gold/40 bg-gold/15 text-gold'
                                    : 'border-white/10 bg-white/5 text-white/35'
                            )}>
                                {formatTimestamp(segment.start)}
                            </div>
                            <p className={cn(
                                'max-w-[92%] text-balance font-semibold leading-snug drop-shadow-lg',
                                isActive ? 'text-3xl sm:text-4xl' : 'text-lg sm:text-xl'
                            )}>
                                {segment.text}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function TranscriptReader({ text, language }: { text: string; language?: string }) {
    const t = useTranslations();
    return (
        <div
            className="w-full rounded-lg border border-white/10 bg-black/35 p-5 backdrop-blur-md"
            onClick={(event) => event.stopPropagation()}
            data-testid="transcript-reader"
        >
            <div className="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                <span>{t('transcript.title')}</span>
                {language && <span className="normal-case">{language}</span>}
            </div>
            <div className="max-h-[54vh] overflow-y-auto overscroll-contain pr-1">
                <p dir="auto" className="whitespace-pre-wrap text-xl font-medium leading-9 text-white/88">
                    {text}
                </p>
            </div>
        </div>
    );
}

function getActiveSegmentIndex(segments: TranscriptSegment[] | undefined, currentTime: number): number {
    if (!segments || segments.length === 0) return -1;
    const index = segments.findIndex((segment, i) => {
        const next = segments[i + 1];
        const end = Number.isFinite(segment.end) ? segment.end : next?.start;
        return currentTime >= segment.start && (typeof end !== 'number' || currentTime < end);
    });
    if (index >= 0) return index;
    if (currentTime < segments[0].start) return 0;
    return segments.length - 1;
}

function formatTimestamp(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function ArchivedOverlay({ item }: { item: ContentItem }) {
    const t = useTranslations();
    const [state, setState] = useState<'idle' | 'pending' | 'throttled' | 'error'>('idle');
    const [message, setMessage] = useState<string | null>(null);
    const [requesting, setRequesting] = useState(false);

    async function handleRestore(e: React.MouseEvent) {
        e.stopPropagation();
        if (requesting) return;
        setRequesting(true);
        try {
            const res = await requestRestore(item.id);
            if (res.status === 'throttled') {
                setState('throttled');
                setMessage(res.message);
            } else {
                setState('pending');
                setMessage(t('foryou.archived.requested'));
            }
        } catch (err) {
            setState('error');
            setMessage(err instanceof Error ? err.message : t('foryou.archived.failed'));
        } finally {
            setRequesting(false);
        }
    }

    return (
        <div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
            onClick={handleRestore}
        >
            <div className="flex flex-col items-center gap-4 px-8 text-center">
                <div className="rounded-full bg-white/10 p-4">
                    <Archive className="h-10 w-10 text-white/80" />
                </div>
                <h3 className="text-lg font-semibold text-white">{t('foryou.archived.title')}</h3>
                <p className="max-w-xs text-sm text-white/70">
                    {state === 'idle' && t('foryou.archived.tap')}
                    {state === 'pending' && message}
                    {state === 'throttled' && message}
                    {state === 'error' && message}
                </p>
                <button
                    type="button"
                    onClick={handleRestore}
                    disabled={requesting || state === 'pending'}
                    className="rounded-full bg-white/15 px-5 py-2 text-sm font-semibold text-white hover:bg-white/25 disabled:opacity-50"
                >
                    {requesting ? (
                        <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {t('foryou.archived.requesting')}</span>
                    ) : state === 'pending' ? (
                        t('foryou.archived.restoreQueued')
                    ) : state === 'throttled' ? (
                        t('foryou.archived.already')
                    ) : (
                        t('foryou.archived.restore')
                    )}
                </button>
            </div>
        </div>
    );
}
