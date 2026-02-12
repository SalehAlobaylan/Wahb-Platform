'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Headphones } from 'lucide-react';
import { useFeedStore } from '@/lib/stores';
import type { ContentItem } from '@/types';

interface ForYouCardProps {
    item: ContentItem;
    isActive: boolean;
}

/**
 * Full-screen video/audio card for For You feed.
 * Only handles media playback and content display.
 * Action buttons and bottom sheet are rendered at the page level.
 */
export function ForYouCard({ item, isActive }: ForYouCardProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const { isPlaying, setPlaying, togglePlay, progress, setProgress, playbackSpeed } = useFeedStore();

    // Handle autoplay based on active state
    useEffect(() => {
        if (!videoRef.current) return;

        if (isActive) {
            videoRef.current.play().catch(() => {
                setPlaying(false);
            });
            setPlaying(true);
        } else {
            videoRef.current.pause();
            setPlaying(false);
        }
    }, [isActive, setPlaying]);

    // Handle playback speed
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = playbackSpeed;
        }
    }, [playbackSpeed]);

    // Handle play/pause
    useEffect(() => {
        if (!videoRef.current || !isActive) return;

        if (isPlaying) {
            videoRef.current.play().catch(() => setPlaying(false));
        } else {
            videoRef.current.pause();
        }
    }, [isPlaying, isActive, setPlaying]);

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(percent);
        }
    };

    return (
        <div className="relative w-full h-full snap-start snap-always shrink-0 overflow-hidden bg-background">
            {/* Background/Video */}
            {item.media_url ? (
                <video
                    ref={videoRef}
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

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />

            {/* Content info — positioned above the fixed bottom sheet */}
            <div className="absolute bottom-[100px] left-0 right-0 p-4 space-y-3">
                {/* Type badge */}
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-bronze/90 text-white backdrop-blur-md flex items-center gap-1">
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
                <h2 className="text-xl font-bold text-white leading-tight drop-shadow-lg line-clamp-2">
                    {item.title}
                </h2>

                {/* Author */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-bronze/40 flex items-center justify-center text-xs overflow-hidden border border-white/20">
                        <img
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.author}`}
                            alt={item.author || 'Author'}
                            className="w-full h-full"
                        />
                    </div>
                    <span className="text-sm text-gray-200 font-medium">{item.author}</span>
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
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer z-10"
                >
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-2xl">
                        <Play className="w-10 h-10 text-white ml-1 fill-white" />
                    </div>
                </motion.div>
            )}
        </div>
    );
}
