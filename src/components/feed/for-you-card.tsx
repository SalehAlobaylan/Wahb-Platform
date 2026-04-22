'use client';

import { useRef, useEffect, useCallback, type MutableRefObject } from 'react';
import { motion } from 'framer-motion';
import { Play, Headphones } from 'lucide-react';
import { useFeedStore } from '@/lib/stores';
import type { ContentItem } from '@/types';

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
    const videoRef = useRef<HTMLVideoElement>(null);
    const wasActiveRef = useRef(false);
    const {
        isPlaying,
        globalPaused,
        setPlaying,
        togglePlay,
        setProgress,
        setForYouPlayback,
        forYouPlaybackById,
        playbackSpeed,
    } = useFeedStore();
    const savedPlayback = forYouPlaybackById[item.id];

    const applySavedTime = useCallback((timeSec?: number) => {
        if (!videoRef.current || typeof timeSec !== 'number') return;

        const duration = Number.isFinite(videoRef.current.duration) ? videoRef.current.duration : null;
        const upperBound = duration && duration > 0 ? Math.max(0, duration - 0.01) : Number.POSITIVE_INFINITY;
        const safeTime = Math.max(0, Math.min(timeSec, upperBound));
        videoRef.current.currentTime = safeTime;

        if (videoTimeRef) {
            videoTimeRef.current = safeTime;
        }
    }, [videoTimeRef]);

    // Handle autoplay based on active state
    useEffect(() => {
        if (!videoRef.current) return;

        if (isActive) {
            if (!wasActiveRef.current) {
                applySavedTime(savedPlayback?.timeSec);
                if (savedPlayback) {
                    setProgress(savedPlayback.progress);
                } else {
                    setProgress(0);
                }
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
        }
        wasActiveRef.current = isActive;
    }, [isActive, globalPaused, isPlaying, setPlaying, setProgress, savedPlayback, applySavedTime]);

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

    // Apply seek after metadata is loaded when duration becomes known
    useEffect(() => {
        if (!videoRef.current) return;

        const onLoadedMetadata = () => {
            if (!isActive) return;
            const playback = useFeedStore.getState().forYouPlaybackById[item.id];
            applySavedTime(playback?.timeSec);
        };

        const el = videoRef.current;
        el.addEventListener('loadedmetadata', onLoadedMetadata);
        return () => {
            el.removeEventListener('loadedmetadata', onLoadedMetadata);
        };
    }, [isActive, item.id, applySavedTime]);

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            const safePercent = Number.isFinite(percent) ? percent : 0;
            if (isActive) {
                setProgress(safePercent);
            }
            setForYouPlayback(item.id, videoRef.current.currentTime, safePercent);
            // Report current time to parent for now-playing handoff
            if (videoTimeRef) {
                videoTimeRef.current = videoRef.current.currentTime;
            }
        }
    };

    return (
        <div className="relative w-full h-full snap-start snap-always shrink-0 overflow-hidden bg-background">
            {/* Background/Video */}
            {item.media_url ? (
                <video
                    ref={videoRef}
                    data-content-id={item.id}
                    className="absolute inset-0 w-full h-full object-cover"
                    src={item.media_url}
                    poster={item.thumbnail_url}
                    loop
                    muted={false}
                    playsInline
                    onTimeUpdate={handleTimeUpdate}
                    onClick={togglePlay}
                />
            ) : (
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-60"
                    style={{ backgroundImage: `url(${item.thumbnail_url})` }}
                />
            )}

            {/* Gradient overlay (Clickable to pause/play) */}
            <div 
                className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 cursor-pointer" 
                onClick={togglePlay}
            />

            {/* Content info — positioned above the fixed bottom sheet */}
            <div className="absolute bottom-[100px] left-0 right-0 p-4 space-y-3">
                {/* Type badge */}
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gold/90 text-white backdrop-blur-md flex items-center gap-1">
                        <Headphones className="w-3 h-3" />
                        {item.type === 'PODCAST' ? 'Podcast' : 'Audio'}
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
            {isActive && !isPlaying && (
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

            {isActive && globalPaused && (
                <div className="absolute top-20 left-4 z-10 pointer-events-none">
                    <span className="px-2.5 py-1 rounded-full bg-black/55 border border-white/15 text-white/90 text-[11px] font-semibold tracking-wide">
                        Paused
                    </span>
                </div>
            )}
        </div>
    );
}
